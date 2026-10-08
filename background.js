/**
 * SoundMax - Background Service Worker (Manifest V3)
 * Developed & Maintained by Pikuri (https://github.com/Pikurii)
 *
 * Manages tab audio states, offscreen documents,
 * toolbar badge indicators, and zero-leak audio lifecycle.
 */

const tabStates = new Map();

function extractDomain(urlStr) {
  try {
    if (!urlStr || urlStr.startsWith('chrome://') || urlStr.startsWith('chrome-extension://')) {
      return '';
    }
    const url = new URL(urlStr);
    return url.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

// Pre-warmed Offscreen Document
let creatingOffscreenPromise = null;
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length > 0) {
    return true;
  }

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return true;
  }

  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: 'offscreen/offscreen.html',
    reasons: ['USER_MEDIA', 'AUDIO_PLAYBACK'],
    justification: 'Boost tab volume and control equalizer with Web Audio API'
  });

  try {
    await creatingOffscreenPromise;
  } finally {
    creatingOffscreenPromise = null;
  }

  return true;
}

// Active capture mutex map: tabId -> Promise<boolean>
const capturingTabs = new Map();

// Verify if a tab is actively captured and live in offscreen document
async function isTabCapturedInOffscreen(tabId) {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    if (!existingContexts || existingContexts.length === 0) {
      return false;
    }
    const res = await chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'IS_CAPTURED',
      tabId
    });
    return !!(res && res.isCaptured);
  } catch (err) {
    return false;
  }
}

// Automatic Tab Audio Capture Helper with Concurrency Mutex
async function startTabCapture(tabId, volume, isMuted, eq) {
  const state = await getTabState(tabId);

  // If already active in offscreen, sync volume and return immediately
  const activeInOffscreen = await isTabCapturedInOffscreen(tabId);
  if (activeInOffscreen) {
    state.isCaptured = true;
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'UPDATE_VOLUME',
      tabId,
      volume: volume !== undefined ? volume : state.volume,
      isMuted: isMuted !== undefined ? isMuted : state.isMuted
    }).catch(() => {});
    return true;
  }

  // If capture is already in-progress for this tab, wait for it rather than starting duplicate
  if (capturingTabs.has(tabId)) {
    try {
      const success = await capturingTabs.get(tabId);
      if (success) {
        // Make sure the latest volume is applied once in-flight capture completes
        chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'UPDATE_VOLUME',
          tabId,
          volume: state.volume,
          isMuted: state.isMuted
        }).catch(() => {});
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  // Start new capture execution locked under capturingTabs
  const capturePromise = (async () => {
    try {
      await ensureOffscreenDocument();

      const streamId = await new Promise((resolve) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (id) => {
          if (chrome.runtime.lastError || !id) {
            console.warn('[SoundMax] getMediaStreamId failed:', chrome.runtime.lastError?.message);
            resolve(null);
          } else {
            resolve(id);
          }
        });
      });

      if (!streamId) return false;

      const res = await chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'START_CAPTURE',
        tabId,
        streamId,
        volume: state.volume, // Use latest volume
        isMuted: isMuted !== undefined ? isMuted : state.isMuted,
        eq: eq || state.eq,
        antiDistortion: state.antiDistortion !== false
      });

      if (res && res.success) {
        state.isCaptured = true;
        await updateBadge(tabId, state.volume, state.isMuted);
        if (state.domain) saveDomainVolume(state.domain, state.volume);

        // Send latest volume again to guarantee no drops while awaiting capture
        chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'UPDATE_VOLUME',
          tabId,
          volume: state.volume,
          isMuted: state.isMuted
        }).catch(() => {});

        return true;
      }
      return false;
    } catch (err) {
      console.error('[SoundMax] Capture error:', err);
      return false;
    } finally {
      capturingTabs.delete(tabId);
    }
  })();

  capturingTabs.set(tabId, capturePromise);
  return await capturePromise;
}

// Pre-warm offscreen document on service worker start
chrome.runtime.onInstalled.addListener(() => {
  ensureOffscreenDocument().catch(() => {});
});
chrome.runtime.onStartup.addListener(() => {
  ensureOffscreenDocument().catch(() => {});
});

// Toolbar Badge Management
async function updateBadge(tabId, volume, isMuted) {
  try {
    if (isMuted || volume === 0) {
      await chrome.action.setBadgeText({ text: 'OFF', tabId });
      await chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId });
    } else if (volume === 100) {
      await chrome.action.setBadgeText({ text: '', tabId });
    } else {
      await chrome.action.setBadgeText({ text: `${volume}%`, tabId });
      let badgeColor = '#2563eb';
      if (volume > 400) {
        badgeColor = '#e11d48';
      } else if (volume > 200) {
        badgeColor = '#f59e0b';
      }
      await chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId });
    }
  } catch (err) {}
}

async function getTabState(tabId) {
  if (tabStates.has(tabId)) {
    return tabStates.get(tabId);
  }

  let domain = '';
  let isMuted = false;
  try {
    const tab = await chrome.tabs.get(tabId);
    domain = extractDomain(tab.url);
    if (tab.mutedInfo && tab.mutedInfo.muted) {
      isMuted = true;
    }
  } catch (e) {}

  const state = {
    volume: 100,
    isMuted,
    eq: { b60: 0, b250: 0, b1k: 0, b4k: 0, b12k: 0, bass: 0, mid: 0, treble: 0, preset: 'flat' },
    isCaptured: false,
    antiDistortion: true,
    domain
  };

  tabStates.set(tabId, state);
  return state;
}

async function saveDomainVolume(domain, volume) {
  if (!domain) return;
  try {
    const { domainVolumes = {} } = await chrome.storage.local.get('domainVolumes');
    domainVolumes[domain] = volume;
    await chrome.storage.local.set({ domainVolumes });
  } catch (err) {}
}

async function getSavedDomainVolume(domain) {
  if (!domain) return null;
  try {
    const { domainVolumes = {} } = await chrome.storage.local.get('domainVolumes');
    return domainVolumes[domain] || null;
  } catch (err) {
    return null;
  }
}

// Runtime Message Listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'offscreen') return;

  const handleMessage = async () => {
    switch (message.type) {
      case 'PREWARM_OFFSCREEN': {
        await ensureOffscreenDocument();
        return { success: true };
      }

      case 'GET_STATE': {
        let tabId = message.tabId;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab) tabId = activeTab.id;
        }
        if (!tabId) return { error: 'No active tab found' };

        const state = await getTabState(tabId);
        
        try {
          const tab = await chrome.tabs.get(tabId);
          if (tab.url) {
            state.domain = extractDomain(tab.url);
          }
          // Always synchronize real-time browser tab mute status from Opera GX / Chrome
          if (tab.mutedInfo && tab.mutedInfo.muted !== undefined) {
            state.isMuted = tab.mutedInfo.muted;
          }
        } catch (e) {}

        // Check if tab is actively captured in offscreen
        const isLiveInOffscreen = await isTabCapturedInOffscreen(tabId);
        state.isCaptured = isLiveInOffscreen;

        // If offscreen is capturing, ensure volume & mute in offscreen are synced
        if (state.isCaptured) {
          chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'UPDATE_VOLUME',
            tabId,
            volume: state.volume,
            isMuted: state.isMuted
          }).catch(() => {});
        }

        await updateBadge(tabId, state.volume, state.isMuted);

        const savedDomainVolume = await getSavedDomainVolume(state.domain);
        return {
          ...state,
          tabId,
          savedDomainVolume
        };
      }

      case 'START_CAPTURE_WITH_STREAM': {
        const { tabId, streamId, volume = 100, isMuted = false, eq } = message;
        const state = await getTabState(tabId);
        state.volume = volume;
        state.isMuted = !!isMuted;
        if (eq) state.eq = { ...state.eq, ...eq };

        await ensureOffscreenDocument();

        const response = await chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'START_CAPTURE',
          tabId,
          streamId,
          volume: state.volume,
          isMuted: state.isMuted,
          eq: state.eq,
          antiDistortion: state.antiDistortion !== false
        });

        if (response && response.success) {
          state.isCaptured = true;
          await updateBadge(tabId, state.volume, state.isMuted);
          if (state.domain) saveDomainVolume(state.domain, state.volume);
          return { success: true };
        } else {
          return { success: false, error: response?.error || 'Failed to start offscreen capture' };
        }
      }

      case 'SET_VOLUME': {
        let { tabId, volume } = message;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab) tabId = activeTab.id;
        }
        if (!tabId) return { error: 'No active tab found' };

        const state = await getTabState(tabId);
        state.volume = Math.max(0, Math.min(800, volume));

        // Synchronize capture state with offscreen if needed
        if (!state.isCaptured) {
          const inOffscreen = await isTabCapturedInOffscreen(tabId);
          if (inOffscreen) {
            state.isCaptured = true;
          }
        }

        if (state.isCaptured) {
          chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'UPDATE_VOLUME',
            tabId,
            volume: state.volume,
            isMuted: state.isMuted
          }).catch(() => {});
        } else if (state.volume !== 100) {
          // Tab not yet captured -> safely initiate capture with concurrency mutex
          await startTabCapture(tabId, state.volume, state.isMuted, state.eq);
        }

        await updateBadge(tabId, state.volume, state.isMuted);
        if (state.domain) saveDomainVolume(state.domain, state.volume);

        return { success: true, volume: state.volume, isCaptured: state.isCaptured };
      }

      case 'SET_MUTE': {
        let { tabId, isMuted } = message;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab) tabId = activeTab.id;
        }
        if (!tabId) return { error: 'No active tab found' };

        const state = await getTabState(tabId);
        state.isMuted = !!isMuted;

        // If unmuting and volume was 0, restore previous volume
        if (!state.isMuted && state.volume === 0) {
          state.volume = state.previousVolume > 0 ? state.previousVolume : 100;
        }

        try {
          await chrome.tabs.update(tabId, { muted: state.isMuted });
        } catch (e) {}

        if (state.isCaptured) {
          chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'UPDATE_VOLUME',
            tabId,
            volume: state.volume,
            isMuted: state.isMuted
          }).catch(() => {});
        }

        await updateBadge(tabId, state.volume, state.isMuted);
        return { success: true, isMuted: state.isMuted, volume: state.volume };
      }

      case 'SET_EQ': {
        let { tabId, eq } = message;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab) tabId = activeTab.id;
        }
        if (!tabId) return { error: 'No active tab found' };

        const state = await getTabState(tabId);
        state.eq = { ...state.eq, ...eq };

        if (!state.isCaptured) {
          const inOffscreen = await isTabCapturedInOffscreen(tabId);
          if (inOffscreen) {
            state.isCaptured = true;
          }
        }

        if (!state.isCaptured) {
          await startTabCapture(tabId, state.volume, state.isMuted, state.eq);
        } else {
          chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'UPDATE_EQ',
            tabId,
            eq: state.eq
          }).catch(() => {});
        }

        return { success: true, eq: state.eq };
      }

      case 'SET_LIMITER': {
        let { tabId, enabled } = message;
        if (!tabId) {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab) tabId = activeTab.id;
        }
        if (!tabId) return { error: 'No active tab found' };

        const state = await getTabState(tabId);
        state.antiDistortion = !!enabled;

        if (state.isCaptured) {
          chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'UPDATE_LIMITER',
            tabId,
            enabled: state.antiDistortion
          }).catch(() => {});
        }

        return { success: true, antiDistortion: state.antiDistortion };
      }

      case 'RESET_TAB': {
        const { tabId } = message;
        const state = await getTabState(tabId);
        state.volume = 100;
        state.isMuted = false;
        state.eq = { bass: 0, mid: 0, treble: 0, preset: 'flat' };

        try {
          await chrome.tabs.update(tabId, { muted: false });
        } catch (e) {}

        if (state.isCaptured) {
          chrome.runtime.sendMessage({
            target: 'offscreen',
            type: 'STOP_CAPTURE',
            tabId
          }).catch(() => {});
          state.isCaptured = false;
        }

        await updateBadge(tabId, 100, false);
        return { success: true };
      }

      case 'GET_AUDIBLE_TABS': {
        await pruneStaleTabStates();
        const audibleTabs = await chrome.tabs.query({ audible: true });
        const tabsMap = new Map();

        for (const tab of audibleTabs) {
          const tabState = tabStates.get(tab.id) || {
            volume: 100,
            isMuted: tab.mutedInfo?.muted || false,
            isCaptured: false
          };
          if (tab.mutedInfo && tab.mutedInfo.muted !== undefined) {
            tabState.isMuted = tab.mutedInfo.muted;
          }
          tabsMap.set(tab.id, {
            id: tab.id,
            windowId: tab.windowId,
            title: tab.title || 'Tab',
            favIconUrl: tab.favIconUrl || '',
            url: tab.url || '',
            domain: extractDomain(tab.url),
            volume: tabState.volume,
            isMuted: tabState.isMuted,
            isCaptured: tabState.isCaptured,
            active: tab.active
          });
        }

        for (const [tId, tState] of tabStates.entries()) {
          if ((tState.volume !== 100 || tState.isCaptured) && !tabsMap.has(tId)) {
            try {
              const tab = await chrome.tabs.get(tId);
              tabsMap.set(tId, {
                id: tab.id,
                windowId: tab.windowId,
                title: tab.title || extractDomain(tab.url) || 'Audio Tab',
                favIconUrl: tab.favIconUrl || '',
                url: tab.url || '',
                domain: extractDomain(tab.url),
                volume: tState.volume,
                isMuted: tState.isMuted,
                isCaptured: tState.isCaptured,
                active: tab.active
              });
            } catch (e) {
              tabStates.delete(tId);
            }
          }
        }

        return Array.from(tabsMap.values());
      }

      case 'SWITCH_TO_TAB': {
        const { tabId, windowId } = message;
        if (tabId) {
          await chrome.tabs.update(tabId, { active: true });
        }
        if (windowId) {
          await chrome.windows.update(windowId, { focused: true });
        }
        return { success: true };
      }

      case 'TAB_CAPTURE_ENDED': {
        const state = tabStates.get(message.tabId);
        if (state) {
          state.isCaptured = false;
          updateBadge(message.tabId, 100, false);
        }
        return { success: true };
      }

      default:
        return { error: 'Unknown message type' };
    }
  };

  handleMessage().then(sendResponse).catch(err => {
    sendResponse({ error: err.message });
  });

  return true;
});

// Periodic / On-demand Stale Tab Cleanup
async function pruneStaleTabStates() {
  for (const tabId of Array.from(tabStates.keys())) {
    try {
      await chrome.tabs.get(tabId);
    } catch (e) {
      tabStates.delete(tabId);
      capturingTabs.delete(tabId);
      chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'STOP_CAPTURE',
        tabId
      }).catch(() => {});
    }
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  capturingTabs.delete(tabId);
  chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'STOP_CAPTURE',
    tabId
  }).catch(() => {});
  tabStates.delete(tabId);
});

if (chrome.tabs.onReplaced) {
  chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    capturingTabs.delete(removedTabId);
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'STOP_CAPTURE',
      tabId: removedTabId
    }).catch(() => {});
    tabStates.delete(removedTabId);
  });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const state = tabStates.get(tabId);
    if (state) {
      state.domain = extractDomain(changeInfo.url);
    }
  }

  // Real-time synchronization when user clicks Mute / Unmute in Opera GX or browser tab header
  if (changeInfo.mutedInfo !== undefined) {
    const state = await getTabState(tabId);
    const isMuted = !!changeInfo.mutedInfo.muted;
    state.isMuted = isMuted;

    // If unmuted and volume was 0, restore previous volume
    if (!state.isMuted && state.volume === 0) {
      state.volume = (state.previousVolume > 0) ? state.previousVolume : 100;
    }

    if (state.isCaptured) {
      chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'UPDATE_VOLUME',
        tabId,
        volume: state.volume,
        isMuted: state.isMuted
      }).catch(() => {});
    }

    await updateBadge(tabId, state.volume, state.isMuted);

    // Notify any open popup to synchronize its UI in real time
    chrome.runtime.sendMessage({
      type: 'TAB_MUTED_UPDATED',
      tabId,
      isMuted: state.isMuted,
      volume: state.volume
    }).catch(() => {});
  }
});

// Keyboard Commands handler
chrome.commands.onCommand.addListener(async (command) => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab) return;

  const state = await getTabState(activeTab.id);

  if (command === 'volume_up') {
    const newVol = Math.min(600, state.volume + 10);
    state.volume = newVol;
    if (state.isCaptured) {
      chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'UPDATE_VOLUME',
        tabId: activeTab.id,
        volume: newVol,
        isMuted: state.isMuted
      }).catch(() => {});
    } else if (newVol !== 100) {
      await startTabCapture(activeTab.id, newVol, state.isMuted, state.eq);
    }
    await updateBadge(activeTab.id, newVol, state.isMuted);
  } else if (command === 'volume_down') {
    const newVol = Math.max(0, state.volume - 10);
    state.volume = newVol;
    if (state.isCaptured) {
      chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'UPDATE_VOLUME',
        tabId: activeTab.id,
        volume: newVol,
        isMuted: state.isMuted
      }).catch(() => {});
    } else if (newVol !== 100) {
      await startTabCapture(activeTab.id, newVol, state.isMuted, state.eq);
    }
    await updateBadge(activeTab.id, newVol, state.isMuted);
  } else if (command === 'toggle_mute') {
    state.isMuted = !state.isMuted;
    try {
      await chrome.tabs.update(activeTab.id, { muted: state.isMuted });
    } catch (e) {}
    if (state.isCaptured) {
      chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'UPDATE_VOLUME',
        tabId: activeTab.id,
        volume: state.volume,
        isMuted: state.isMuted
      }).catch(() => {});
    }
    await updateBadge(activeTab.id, state.volume, state.isMuted);
  }
});
