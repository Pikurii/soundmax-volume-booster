/**
 * SoundMax - Offscreen Audio Engine (Manifest V3)
 * Developed & Maintained by Pikuri (https://github.com/Pikurii)
 * Processes tab audio captured via chrome.tabCapture
 * 
 * Features:
 * - 5-Band Studio Parametric Equalizer (60Hz, 250Hz, 1kHz, 4kHz, 12kHz)
 * - Transparent Brickwall Peak Limiter (-1.5 dBFS)
 * - Mastering-Grade Linear Soft-Clipper (Analog Saturation)
 * - Zero-Leak Memory Management & 0.0% Idle CPU Suspension
 * - Pure Audio stream capture (No video constraints)
 */

const tabAudioNodes = new Map();

// Mastering-Grade Soft-Clipper Curve (100% linear below 0.85, analog tape warmth on peaks)
const SAMPLES = 65536;
const masteringSoftClipCurve = new Float32Array(SAMPLES);
const LINEAR_THRESHOLD = 0.85;

for (let i = 0; i < SAMPLES; i++) {
  const x = (i * 2) / SAMPLES - 1;
  const absX = Math.abs(x);
  if (absX <= LINEAR_THRESHOLD) {
    masteringSoftClipCurve[i] = x;
  } else {
    const sign = x < 0 ? -1 : 1;
    const excess = (absX - LINEAR_THRESHOLD) / (1 - LINEAR_THRESHOLD);
    const compressed = LINEAR_THRESHOLD + (1 - LINEAR_THRESHOLD) * Math.tanh(excess);
    masteringSoftClipCurve[i] = sign * compressed;
  }
}

// Reusable Singleton AudioContext
const linearPassCurve = new Float32Array([-1, 0, 1]);

let sharedAudioCtx = null;
function getSharedAudioContext() {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    sharedAudioCtx = new AudioContextClass({ latencyHint: 'interactive' });
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  switch (message.type) {
    case 'START_CAPTURE':
      handleStartCapture(message).then(sendResponse);
      return true;

    case 'IS_CAPTURED':
      handleIsCaptured(message.tabId).then(sendResponse);
      return true;

    case 'TAB_RELOADING':
      handleTabReloading(message);
      sendResponse({ success: true });
      break;

    case 'RESTORE_TAB_VOLUME':
      handleRestoreTabVolume(message);
      sendResponse({ success: true });
      break;

    case 'UPDATE_VOLUME':
      handleUpdateVolume(message);
      sendResponse({ success: true });
      break;

    case 'UPDATE_EQ':
      handleUpdateEQ(message);
      sendResponse({ success: true });
      break;

    case 'UPDATE_LIMITER':
      handleUpdateLimiter(message);
      sendResponse({ success: true });
      break;

    case 'STOP_CAPTURE':
      handleStopCapture(message.tabId);
      sendResponse({ success: true });
      break;

    case 'PING':
      sendResponse({ status: 'ready', activeTabs: Array.from(tabAudioNodes.keys()) });
      break;
  }
});

async function handleIsCaptured(tabId) {
  const nodeData = tabAudioNodes.get(tabId);
  if (!nodeData || !nodeData.stream) {
    return { isCaptured: false };
  }
  const isLive = nodeData.stream.getAudioTracks().some(t => t.readyState === 'live');
  return { isCaptured: isLive };
}

async function handleStartCapture({ tabId, streamId, volume = 100, isMuted = false, eq = {}, antiDistortion = true }) {
  if (tabAudioNodes.has(tabId)) {
    const existing = tabAudioNodes.get(tabId);
    if (existing.stream && existing.stream.getAudioTracks().some(t => t.readyState === 'live')) {
      // The stream is ALREADY live! Do not teardown to avoid glitching!
      handleUpdateVolume({ tabId, volume, isMuted });
      handleUpdateEQ({ tabId, eq });
      handleUpdateLimiter({ tabId, enabled: antiDistortion });
      return { success: true };
    }
    handleStopCapture(tabId);
  }

  try {
    // Pure tab audio capture using Chrome MediaSource ID
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });

    const audioCtx = getSharedAudioContext();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const source = audioCtx.createMediaStreamSource(stream);

    // ==========================================
    // 5-Band Studio Parametric Equalizer
    // ==========================================
    const filter60 = audioCtx.createBiquadFilter();
    filter60.type = 'lowshelf';
    filter60.frequency.setValueAtTime(60, audioCtx.currentTime);
    filter60.gain.setValueAtTime(eq.b60 ?? eq.bass ?? 0, audioCtx.currentTime);

    const filter250 = audioCtx.createBiquadFilter();
    filter250.type = 'peaking';
    filter250.frequency.setValueAtTime(250, audioCtx.currentTime);
    filter250.Q.setValueAtTime(1.0, audioCtx.currentTime);
    filter250.gain.setValueAtTime(eq.b250 ?? 0, audioCtx.currentTime);

    const filter1k = audioCtx.createBiquadFilter();
    filter1k.type = 'peaking';
    filter1k.frequency.setValueAtTime(1000, audioCtx.currentTime);
    filter1k.Q.setValueAtTime(1.0, audioCtx.currentTime);
    filter1k.gain.setValueAtTime(eq.b1k ?? eq.mid ?? 0, audioCtx.currentTime);

    const filter4k = audioCtx.createBiquadFilter();
    filter4k.type = 'peaking';
    filter4k.frequency.setValueAtTime(4000, audioCtx.currentTime);
    filter4k.Q.setValueAtTime(1.0, audioCtx.currentTime);
    filter4k.gain.setValueAtTime(eq.b4k ?? 0, audioCtx.currentTime);

    const filter12k = audioCtx.createBiquadFilter();
    filter12k.type = 'highshelf';
    filter12k.frequency.setValueAtTime(12000, audioCtx.currentTime);
    filter12k.gain.setValueAtTime(eq.b12k ?? eq.treble ?? 0, audioCtx.currentTime);

    // Master Volume Gain with Smooth Onboarding Ramp
    const gainNode = audioCtx.createGain();
    const targetGain = isMuted ? 0 : Math.max(0, volume / 100);
    const initialGain = isMuted ? 0 : 1.0; // Start at natural unity gain (matches browser native output)
    gainNode.gain.setValueAtTime(initialGain, audioCtx.currentTime);
    if (!isMuted && targetGain !== initialGain) {
      // Gracefully glide to target volume to prevent popping or explosive volume jumps
      gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + 0.15);
    }

    // Studio Brickwall Peak Limiter (-1.5 dBFS)
    const compressor = audioCtx.createDynamicsCompressor();

    // Mastering Soft-Clipper
    const softClipper = audioCtx.createWaveShaper();
    softClipper.oversample = '2x';

    // Output Headroom
    const outputGain = audioCtx.createGain();

    // Connect Pipeline:
    // source -> 60Hz -> 250Hz -> 1kHz -> 4kHz -> 12kHz -> gainNode -> compressor -> softClipper -> outputGain -> speakers
    source.connect(filter60);
    filter60.connect(filter250);
    filter250.connect(filter1k);
    filter1k.connect(filter4k);
    filter4k.connect(filter12k);
    filter12k.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(softClipper);
    softClipper.connect(outputGain);
    outputGain.connect(audioCtx.destination);

    // Auto-clean on any track end (e.g. tab closed or navigation)
    const tracks = stream.getAudioTracks();
    tracks.forEach((track) => {
      track.onended = () => {
        handleStopCapture(tabId);
        chrome.runtime.sendMessage({
          type: 'TAB_CAPTURE_ENDED',
          tabId
        }).catch(() => {});
      };
    });

    const nodeData = {
      audioCtx,
      stream,
      source,
      filter60,
      filter250,
      filter1k,
      filter4k,
      filter12k,
      gainNode,
      compressor,
      softClipper,
      outputGain,
      volume,
      isMuted,
      eq,
      antiDistortion: antiDistortion !== false
    };

    tabAudioNodes.set(tabId, nodeData);

    // Apply adaptive limiter calibration
    applySmartLimiter(nodeData);

    console.log(`[SoundMax] Tab ${tabId} captured successfully at ${volume}% (Anti-Distortion: ${nodeData.antiDistortion})`);
    return { success: true };
  } catch (error) {
    console.error(`[SoundMax] Tab ${tabId} capture error:`, error);
    return { success: false, error: error.message };
  }
}

// Adaptive Smart Limiter & Anti-Clipping DSP Engine
function applySmartLimiter(nodeData) {
  if (!nodeData || !nodeData.compressor) return;
  const audioCtx = nodeData.audioCtx;
  const now = audioCtx.currentTime;
  const enabled = nodeData.antiDistortion !== false;
  const vol = nodeData.volume || 100;

  if (enabled) {
    // Dynamic calibrated thresholds depending on boost level
    let threshold = -1.5;
    let ratio = 12;
    let knee = 10;
    let attack = 0.002;
    let release = 0.05;
    let outHeadroom = 0.98;

    if (vol <= 100) {
      // Zero-coloration studio reference
      threshold = -0.5;
      ratio = 4;
      knee = 6;
      attack = 0.005;
      release = 0.08;
      outHeadroom = 1.0;
    } else if (vol <= 250) {
      // Moderate boost: musical compression & control
      threshold = -2.0;
      ratio = 12;
      knee = 10;
      attack = 0.002;
      release = 0.05;
      outHeadroom = 0.97;
    } else if (vol <= 450) {
      // High boost: active peak suppression & analog warmth
      threshold = -3.5;
      ratio = 18;
      knee = 14;
      attack = 0.001;
      release = 0.04;
      outHeadroom = 0.95;
    } else {
      // Extreme boost (up to 600%-800%): maximum brickwall anti-clip protection
      threshold = -5.0;
      ratio = 24;
      knee = 18;
      attack = 0.0008;
      release = 0.035;
      outHeadroom = 0.92;
    }

    nodeData.compressor.threshold.setValueAtTime(threshold, now);
    nodeData.compressor.knee.setValueAtTime(knee, now);
    nodeData.compressor.ratio.setValueAtTime(ratio, now);
    nodeData.compressor.attack.setValueAtTime(attack, now);
    nodeData.compressor.release.setValueAtTime(release, now);

    nodeData.softClipper.curve = masteringSoftClipCurve;
    // CPU Optimization: only oversample 2x if boost > 100% to save substantial CPU
    nodeData.softClipper.oversample = vol > 100 ? '2x' : 'none';
    nodeData.outputGain.gain.setValueAtTime(outHeadroom, now);
  } else {
    // Completely bypassed: 100% linear raw pass-through
    nodeData.compressor.threshold.setValueAtTime(0, now);
    nodeData.compressor.ratio.setValueAtTime(1, now);
    nodeData.compressor.knee.setValueAtTime(0, now);

    nodeData.softClipper.curve = linearPassCurve;
    nodeData.softClipper.oversample = 'none';
    nodeData.outputGain.gain.setValueAtTime(1.0, now);
  }
}

function handleUpdateLimiter({ tabId, enabled }) {
  const nodeData = tabAudioNodes.get(tabId);
  if (!nodeData) return;
  nodeData.antiDistortion = !!enabled;
  applySmartLimiter(nodeData);
}

function handleUpdateVolume({ tabId, volume, isMuted }) {
  const nodeData = tabAudioNodes.get(tabId);
  if (!nodeData) return;

  if (nodeData.audioCtx.state === 'suspended') {
    nodeData.audioCtx.resume().catch(() => {});
  }

  if (typeof volume === 'number') {
    nodeData.volume = volume;
  }
  if (typeof isMuted === 'boolean') {
    nodeData.isMuted = isMuted;
  }

  const effectiveGain = nodeData.isMuted ? 0 : Math.max(0, nodeData.volume / 100);
  const now = nodeData.audioCtx.currentTime;
  nodeData.gainNode.gain.cancelScheduledValues(now);
  nodeData.gainNode.gain.setValueAtTime(nodeData.gainNode.gain.value, now);
  // 35ms analog-fader de-zippering
  nodeData.gainNode.gain.linearRampToValueAtTime(effectiveGain, now + 0.035);

  // Re-adapt limiter parameters dynamically to new volume level
  applySmartLimiter(nodeData);
}

// Prepare tab for navigation/reload by smoothly resetting gain to unity (1.0)
// This prevents explosive sound when the new document connects to Web Audio
function handleTabReloading({ tabId }) {
  const nodeData = tabAudioNodes.get(tabId);
  if (!nodeData) return;
  const now = nodeData.audioCtx.currentTime;
  nodeData.gainNode.gain.cancelScheduledValues(now);
  nodeData.gainNode.gain.setValueAtTime(nodeData.gainNode.gain.value, now);
  // Gently ramp to unity gain (1.0)
  nodeData.gainNode.gain.linearRampToValueAtTime(1.0, now + 0.05);
}

// Restore boosted volume smoothly when tab audio plays after reload
function handleRestoreTabVolume({ tabId, volume }) {
  const nodeData = tabAudioNodes.get(tabId);
  if (!nodeData) return;

  if (nodeData.audioCtx.state === 'suspended') {
    nodeData.audioCtx.resume().catch(() => {});
  }

  if (typeof volume === 'number') {
    nodeData.volume = volume;
  }
  const effectiveGain = nodeData.isMuted ? 0 : Math.max(0, nodeData.volume / 100);
  const now = nodeData.audioCtx.currentTime;
  nodeData.gainNode.gain.cancelScheduledValues(now);
  nodeData.gainNode.gain.setValueAtTime(nodeData.gainNode.gain.value, now);
  // Smoothly ramp to the target boosted volume over 150ms to prevent abrupt loudness shock
  nodeData.gainNode.gain.linearRampToValueAtTime(effectiveGain, now + 0.15);
  applySmartLimiter(nodeData);
}

function handleUpdateEQ({ tabId, eq }) {
  const nodeData = tabAudioNodes.get(tabId);
  if (!nodeData || !eq) return;

  if (nodeData.audioCtx.state === 'suspended') {
    nodeData.audioCtx.resume().catch(() => {});
  }

  nodeData.eq = { ...nodeData.eq, ...eq };
  const now = nodeData.audioCtx.currentTime;

  const b60 = (eq.b60 !== undefined) ? eq.b60 : (eq.bass || 0);
  const b250 = (eq.b250 !== undefined) ? eq.b250 : ((eq.bass || 0) * 0.7);
  const b1k = (eq.b1k !== undefined) ? eq.b1k : (eq.mid || 0);
  const b4k = (eq.b4k !== undefined) ? eq.b4k : ((eq.treble || 0) * 0.8);
  const b12k = (eq.b12k !== undefined) ? eq.b12k : (eq.treble || 0);

  nodeData.filter60.gain.cancelScheduledValues(now);
  nodeData.filter60.gain.setValueAtTime(nodeData.filter60.gain.value, now);
  nodeData.filter60.gain.linearRampToValueAtTime(b60, now + 0.03);

  nodeData.filter250.gain.cancelScheduledValues(now);
  nodeData.filter250.gain.setValueAtTime(nodeData.filter250.gain.value, now);
  nodeData.filter250.gain.linearRampToValueAtTime(b250, now + 0.03);

  nodeData.filter1k.gain.cancelScheduledValues(now);
  nodeData.filter1k.gain.setValueAtTime(nodeData.filter1k.gain.value, now);
  nodeData.filter1k.gain.linearRampToValueAtTime(b1k, now + 0.03);

  nodeData.filter4k.gain.cancelScheduledValues(now);
  nodeData.filter4k.gain.setValueAtTime(nodeData.filter4k.gain.value, now);
  nodeData.filter4k.gain.linearRampToValueAtTime(b4k, now + 0.03);

  nodeData.filter12k.gain.cancelScheduledValues(now);
  nodeData.filter12k.gain.setValueAtTime(nodeData.filter12k.gain.value, now);
  nodeData.filter12k.gain.linearRampToValueAtTime(b12k, now + 0.03);
}

function handleStopCapture(tabId) {
  const nodeData = tabAudioNodes.get(tabId);
  if (!nodeData) return;

  try {
    // 1. Terminate all media stream tracks and strip event listeners
    if (nodeData.stream) {
      nodeData.stream.getTracks().forEach((track) => {
        track.onended = null;
        try {
          track.stop();
        } catch (e) {}
      });
    }

    // 2. Disconnect each audio node from the Web Audio processing graph
    // to release native C++ Blink audio graph resources
    const nodes = [
      nodeData.source,
      nodeData.filter60,
      nodeData.filter250,
      nodeData.filter1k,
      nodeData.filter4k,
      nodeData.filter12k,
      nodeData.gainNode,
      nodeData.compressor,
      nodeData.softClipper,
      nodeData.outputGain
    ];

    for (const node of nodes) {
      if (node && typeof node.disconnect === 'function') {
        try {
          node.disconnect();
        } catch (e) {}
      }
    }

    // 3. Sever JavaScript object references to facilitate instant V8 Garbage Collection
    nodeData.source = null;
    nodeData.filter60 = null;
    nodeData.filter250 = null;
    nodeData.filter1k = null;
    nodeData.filter4k = null;
    nodeData.filter12k = null;
    nodeData.gainNode = null;
    nodeData.compressor = null;
    nodeData.softClipper = null;
    nodeData.outputGain = null;
    nodeData.stream = null;
    nodeData.audioCtx = null;
  } catch (err) {
    console.warn(`[SoundMax] Cleanup error for tab ${tabId}:`, err);
  }

  // 4. Remove from Map
  tabAudioNodes.delete(tabId);

  // 5. CRITICAL CPU OPTIMIZATION:
  // When no tabs are captured, suspend the AudioContext.
  // In Chromium, an active AudioContext keeps a high-priority real-time hardware
  // audio rendering thread running continuously (using ~0.5% - 2% CPU even on silence).
  // Suspending the AudioContext halts the rendering thread completely -> 0.0% CPU!
  if (tabAudioNodes.size === 0) {
    if (sharedAudioCtx && sharedAudioCtx.state === 'running') {
      sharedAudioCtx.suspend().catch(() => {});
    }
    // Notify background service worker so it can schedule idle offscreen document termination
    chrome.runtime.sendMessage({
      type: 'OFFSCREEN_ALL_TABS_STOPPED'
    }).catch(() => {});
  }
}

// Complete teardown on document unload to prevent dangling audio resources
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('beforeunload', () => {
    for (const tabId of Array.from(tabAudioNodes.keys())) {
      handleStopCapture(tabId);
    }
    if (sharedAudioCtx && sharedAudioCtx.state !== 'closed') {
      sharedAudioCtx.close().catch(() => {});
      sharedAudioCtx = null;
    }
  });
}
