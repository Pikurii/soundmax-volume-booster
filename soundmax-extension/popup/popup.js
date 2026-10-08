/**
 * SoundMax - Tab Audio Booster & EQ
 * Developed & Maintained by Pikuri (https://github.com/Pikurii)
 * Popup Interface Controller
 * 
 * Features:
 * - Direct volume slider & editable number input (0 - 600%)
 * - Professional 5-Band Studio Parametric EQ (60Hz, 250Hz, 1kHz, 4kHz, 12kHz)
 * - Save & manage multiple named Custom EQ Presets
 * - Bilingual localization (Bahasa Indonesia & English)
 * - Audible tab switcher & preset management
 */

const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;

// Localization Dictionary
const TRANSLATIONS = {
  id: {
    // Header & Subtitle
    subtitle: "Kontrol dan tingkatkan volume tab aktif. Beralih ke tab bersuara dengan sekali klik.",
    tip_title: "Tips: tombol pintas keyboard",
    tip_desc: "Ketik {code} di address bar untuk mengatur shortcut SoundMax.",
    tip_close: "Tutup tips",
    
    // Volume Section
    vol_input_title: "Ketik angka volume (0 - 600%) lalu tekan Enter",
    vol_prefix: "Volume:",
    muted_status: "Muted (0 %)",
    
    // Smart Limiter / Anti-Distorsi
    anti_distortion_on: "Anti-Distorsi: Aktif",
    anti_distortion_off: "Anti-Distorsi: Nonaktif",
    anti_distortion_title: "Cegah suara pecah & distorsi saat volume tinggi (Klik untuk toggle)",
    settings_limiter_title: "🛡️ Smart Limiter (Anti-Distorsi)",
    settings_limiter_desc: "Jaga kejernihan audio & cegah distorsi pecah di volume tinggi",
    
    // Mini Mode
    mini_turn_off: "Turn Off",
    mini_turn_on: "Turn On",
    mini_reset: "Reset 100%",
    mini_studio_btn: "🎛️ Studio",
    btn_toggle_mini_title: "Mode Minimalis (Ringkas)",
    btn_expand_studio_title: "Perluas ke Mode Studio Lengkap (5-Band EQ)",
    settings_mode_title: "📐 Mode Tampilan Default",
    settings_mode_desc: "Pilih tampilan saat SoundMax dibuka",
    opt_mode_studio: "Mode Studio (Lengkap)",
    opt_mode_mini: "Mode Minimalis (Ringkas)",
    settings_wheel_title: "🖱️ Scroll Mouse untuk Volume",
    settings_wheel_desc: "Putar roda mouse di area slider untuk atur volume",
    
    // Quick Buttons
    preset_voice: "Voice boost",
    preset_voice_title: "Kejelasan vokal & dialog podcast/anime",
    preset_bass: "Bass boost",
    preset_bass_title: "Dentuman bass bertenaga & punchy",
    
    // Mute & Reset Strip
    mute_tab: "Mute Tab",
    unmute_tab: "Unmute Tab",
    mute_title: "Senyapkan atau nyalakan suara",
    reset_standard: "Reset ke 100%",
    reset_standard_title: "Kembalikan volume ke normal 100% dan EQ flat",
    
    // 5-Band Studio Equalizer
    eq_title: "Studio Equalizer (5-Band)",
    eq_preset_label: "Preset:",
    eq_optgroup_studio: "Studio Presets",
    eq_optgroup_custom: "Custom Presets Anda",
    eq_empty_custom: "(Belum ada preset kustom)",
    eq_opt_custom: "-- Custom Tuned --",
    
    // EQ Preset Options
    preset_opt_flat: "Flat (Studio Reference)",
    preset_opt_bass_boost: "Bass Booster (Sub & Kick)",
    preset_opt_voice_boost: "Vocal Clarifier (Anime & Podcast)",
    preset_opt_rock: "Rock & Punch (Dynamic V-Shape)",
    preset_opt_night: "Night Mode (Soft & Relaxing)",
    
    // EQ Action Buttons
    btn_save_preset: "Simpan Preset",
    btn_save_preset_title: "Simpan pengaturan EQ saat ini sebagai preset custom baru",
    btn_delete_preset: "Hapus",
    btn_delete_preset_title: "Hapus preset custom yang dipilih",
    btn_reset_eq: "Reset ke Flat",
    btn_reset_eq_title: "Kembalikan semua slider EQ ke 0 dB",
    
    // EQ Preset Quotes
    quote_flat: "Zero spice. Karakter suara asli studio tanpa pewarnaan.",
    quote_bass_boost: "Dentuman sub-bass 60Hz bertenaga dan bass 250Hz yang hangat & punchy.",
    quote_voice_boost: "Kejelasan dialog maksimal & artikulasi vokal kristal untuk video/podcast.",
    quote_rock: "Karakter V-shape dinamis, mid scooped, gitar tegas dan cymbal gemerlap.",
    quote_night: "Meredam lonjakan frekuensi ekstrim agar telinga tetap nyaman saat istirahat.",
    quote_custom: "Equalizer kustom yang disesuaikan secara manual.",
    quote_user_custom: "Preset Kustom Anda: \"{name}\"",
    
    // 5-Band Labels & Descs
    band_60_desc: "Sub-Bass • Dentuman Sub & Kick",
    band_250_desc: "Bass • Kehangatan & Ketukan Nada",
    band_1k_desc: "Mid • Inti Vokal & Instrumen",
    band_4k_desc: "Presence • Artikulasi Dialog & Vokal",
    band_12k_desc: "Air • Kecerahan, Cymbals & Detail",
    
    // Audible Tabs
    tabs_title: "Tab yang sedang memutar audio",
    tabs_scanning: "Memindai tab audio...",
    tabs_empty: "Tidak ada tab lain yang memutar audio saat ini.",
    tab_card_title: "Klik untuk beralih ke \"{title}\"",
    tab_muted_badge: "Muted",
    
    // Modal: Save Preset
    modal_save_title: "💾 Simpan Custom Preset EQ",
    modal_save_desc: "Beri nama untuk konfigurasi 5-Band EQ saat ini:",
    modal_save_placeholder: "Contoh: Anime Mode, EDM Bass, Podcast Enak",
    btn_modal_cancel: "Batal",
    btn_modal_save: "Simpan Preset",
    default_preset_name: "Preset Custom {num}",
    
    // Modal: Settings
    settings_title: "Pengaturan SoundMax",
    settings_lang_title: "🌐 Bahasa / Language",
    settings_lang_desc: "Pilih bahasa antarmuka",
    settings_turbo_title: "🚀 Turbo Mode (Hingga 800%)",
    settings_turbo_desc: "Izinkan penguatan ekstrem hingga 800%",
    settings_memory_title: "💾 Memori Volume Per-Website",
    settings_memory_desc: "Ingat level volume favorit per domain situs",
    settings_shortcuts_title: "⌨️ Tombol Pintas Keyboard",
    sc_open_popup: "Buka popup SoundMax",
    sc_vol_up: "Tingkatkan volume +10%",
    sc_vol_down: "Kurangi volume -10%",
    sc_mute: "Toggle Mute / Unmute",
    sc_numbers: "Langsung meloncat ke 0% – 600%",
    btn_settings_done: "Selesai",
    
    // Footer & Rating
    footer_shortcuts: "Keyboard Shortcuts",
    footer_creator: "by Pikuri",
    footer_creator_title: "Dibuat dengan ❤️ oleh Pikuri (GitHub: @Pikurii)",
    rating_title: "Beri Rating SoundMax 5 Bintang!",
    rating_thank_you: "Terima kasih telah memberikan rating 5 bintang untuk SoundMax! ★★★★★",
    theme_switch_title: "Ganti Mode Gelap / Terang",
    settings_btn_title: "Pengaturan & Pintasan",
    lang_btn_title: "Ganti Bahasa (ID / EN)"
  },
  
  en: {
    // Header & Subtitle
    subtitle: "Control and boost active tab audio. Switch to audible tabs with a single click.",
    tip_title: "Tip: keyboard shortcuts",
    tip_desc: "Type {code} in your address bar to configure SoundMax shortcuts.",
    tip_close: "Dismiss tip",
    
    // Volume Section
    vol_input_title: "Type volume percentage (0 - 600%) and press Enter",
    vol_prefix: "Volume:",
    muted_status: "Muted (0 %)",
    
    // Smart Limiter / Anti-Distortion
    anti_distortion_on: "Anti-Distortion: ON",
    anti_distortion_off: "Anti-Distortion: OFF",
    anti_distortion_title: "Prevent harsh clipping & distortion at high volume (Click to toggle)",
    settings_limiter_title: "🛡️ Smart Limiter (Anti-Distortion)",
    settings_limiter_desc: "Maintain audio clarity and prevent harsh clipping at high volume",
    
    // Mini Mode
    mini_turn_off: "Turn Off",
    mini_turn_on: "Turn On",
    mini_reset: "Reset 100%",
    mini_studio_btn: "🎛️ Studio",
    btn_toggle_mini_title: "Switch to Mini Mode",
    btn_expand_studio_title: "Expand to Full Studio Mode (5-Band EQ)",
    settings_mode_title: "📐 Default Popup Mode",
    settings_mode_desc: "Choose main view when opening SoundMax",
    opt_mode_studio: "Studio Mode (Full)",
    opt_mode_mini: "Mini Mode (Compact)",
    settings_wheel_title: "🖱️ Mouse Wheel Volume",
    settings_wheel_desc: "Scroll mouse wheel over slider area to adjust volume",
    
    // Quick Buttons
    preset_voice: "Voice boost",
    preset_voice_title: "Vocal and speech clarity for anime/podcasts",
    preset_bass: "Bass boost",
    preset_bass_title: "Punchy and powerful low-end boost",
    
    // Mute & Reset Strip
    mute_tab: "Mute Tab",
    unmute_tab: "Unmute Tab",
    mute_title: "Mute or unmute tab audio",
    reset_standard: "Reset to 100%",
    reset_standard_title: "Reset volume back to standard 100% and flat EQ",
    
    // 5-Band Studio Equalizer
    eq_title: "Studio Equalizer (5-Band)",
    eq_preset_label: "Preset:",
    eq_optgroup_studio: "Studio Presets",
    eq_optgroup_custom: "Your Custom Presets",
    eq_empty_custom: "(No custom presets yet)",
    eq_opt_custom: "-- Custom Tuned --",
    
    // EQ Preset Options
    preset_opt_flat: "Flat (Studio Reference)",
    preset_opt_bass_boost: "Bass Booster (Sub & Kick)",
    preset_opt_voice_boost: "Vocal Clarifier (Anime & Podcast)",
    preset_opt_rock: "Rock & Punch (Dynamic V-Shape)",
    preset_opt_night: "Night Mode (Soft & Relaxing)",
    
    // EQ Action Buttons
    btn_save_preset: "Save Preset",
    btn_save_preset_title: "Save current EQ curve as a new custom preset",
    btn_delete_preset: "Delete",
    btn_delete_preset_title: "Delete selected custom preset",
    btn_reset_eq: "Reset to Flat",
    btn_reset_eq_title: "Reset all EQ sliders to 0 dB",
    
    // EQ Preset Quotes
    quote_flat: "Zero spice. Pure reference studio sound without coloration.",
    quote_bass_boost: "Sub-bass 60Hz rumble and warm punchy 250Hz low-end.",
    quote_voice_boost: "Maximum dialogue clarity and crisp vocal articulation for video/podcasts.",
    quote_rock: "Dynamic V-shape response with scooped mids and sparkling cymbals.",
    quote_night: "Tames harsh dynamics to protect your ears during late night listening.",
    quote_custom: "Manually customized equalizer bands.",
    quote_user_custom: "Your Custom Preset: \"{name}\"",
    
    // 5-Band Labels & Descs
    band_60_desc: "Sub-Bass • Sub & Kick Rumble",
    band_250_desc: "Bass • Warmth & Punch",
    band_1k_desc: "Mid • Vocal & Core Instruments",
    band_4k_desc: "Presence • Dialogue & Speech Clarity",
    band_12k_desc: "Air • Shimmer, Cymbals & Detail",
    
    // Audible Tabs
    tabs_title: "Tabs playing audio right now",
    tabs_scanning: "Scanning audio tabs...",
    tabs_empty: "No other tabs playing audio right now.",
    tab_card_title: "Click to switch to \"{title}\"",
    tab_muted_badge: "Muted",
    
    // Modal: Save Preset
    modal_save_title: "💾 Save Custom EQ Preset",
    modal_save_desc: "Name your current 5-Band EQ configuration:",
    modal_save_placeholder: "e.g. Anime Vocal Mode, EDM Bass, Podcast Master",
    btn_modal_cancel: "Cancel",
    btn_modal_save: "Save Preset",
    default_preset_name: "Custom Preset {num}",
    
    // Modal: Settings
    settings_title: "SoundMax Settings",
    settings_lang_title: "🌐 Language / Bahasa",
    settings_lang_desc: "Select interface language",
    settings_turbo_title: "🚀 Turbo Mode (Up to 800%)",
    settings_turbo_desc: "Allow extreme volume boost up to 800%",
    settings_memory_title: "💾 Per-Website Volume Memory",
    settings_memory_desc: "Remember preferred volume levels per website domain",
    settings_shortcuts_title: "⌨️ Keyboard Shortcuts",
    sc_open_popup: "Open SoundMax popup",
    sc_vol_up: "Increase volume +10%",
    sc_vol_down: "Decrease volume -10%",
    sc_mute: "Toggle Mute / Unmute",
    sc_numbers: "Jump directly to 0% – 600%",
    btn_settings_done: "Done",
    
    // Footer & Rating
    footer_shortcuts: "Keyboard Shortcuts",
    footer_creator: "by Pikuri",
    footer_creator_title: "Created with ❤️ by Pikuri (GitHub: @Pikurii)",
    rating_title: "Rate SoundMax 5 Stars!",
    rating_thank_you: "Thank you for rating SoundMax 5 stars! ★★★★★",
    theme_switch_title: "Toggle Dark / Light Mode",
    settings_btn_title: "Settings & Shortcuts",
    lang_btn_title: "Switch Language (ID / EN)"
  }
};

// Global State
let appState = {
  tabId: null,
  volume: 100,
  previousVolume: 100,
  isMuted: false,
  eq: {
    b60: 0,
    b250: 0,
    b1k: 0,
    b4k: 0,
    b12k: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    preset: 'flat'
  },
  domain: '',
  savedDomainVolume: null,
  isCaptured: false,
  theme: 'dark',
  language: 'id',
  tipDismissed: false,
  turboMode: false,
  rememberDomains: true,
  antiDistortion: true,
  popupMode: 'studio',
  wheelScrollEnabled: true
};

// Calibrated 5-Band Studio EQ Presets
const STUDIO_PRESETS = {
  flat: {
    b60: 0, b250: 0, b1k: 0, b4k: 0, b12k: 0,
    quoteKey: 'quote_flat'
  },
  bass_boost: {
    b60: 6.5, b250: 4.0, b1k: 0.5, b4k: 1.0, b12k: 1.5,
    quoteKey: 'quote_bass_boost'
  },
  voice_boost: {
    b60: -2.0, b250: 0.5, b1k: 4.0, b4k: 3.5, b12k: 1.5,
    quoteKey: 'quote_voice_boost'
  },
  rock: {
    b60: 4.5, b250: 2.0, b1k: -1.5, b4k: 3.0, b12k: 4.5,
    quoteKey: 'quote_rock'
  },
  night: {
    b60: -4.0, b250: -2.0, b1k: 0.5, b4k: -1.0, b12k: -3.0,
    quoteKey: 'quote_night'
  },
  custom: {
    b60: 0, b250: 0, b1k: 0, b4k: 0, b12k: 0,
    quoteKey: 'quote_custom'
  }
};

let userCustomPresets = [];
let audibleIntervalId = null;
let lastAudibleTabsSig = '';

let mockAudibleTabs = [
  {
    id: 101,
    windowId: 1,
    title: "MrBeast - $1 vs $500,000 Experiences!",
    domain: "youtube.com",
    favIconUrl: "https://www.youtube.com/s/desktop/9986345d/img/favicon_32x32.png",
    volume: 180,
    isMuted: false,
    active: true
  },
  {
    id: 102,
    windowId: 1,
    title: "Music Mix 2024 - Top NCS Gaming Songs EDM",
    domain: "youtube.com",
    favIconUrl: "https://www.youtube.com/s/desktop/9986345d/img/favicon_32x32.png",
    volume: 100,
    isMuted: false,
    active: false
  }
];

// DOM Elements
const docEl = document.documentElement;
const btnLangToggle = document.getElementById('btn-lang-toggle');
const themeToggle = document.getElementById('theme-toggle');
const lblThemeSwitch = document.getElementById('lbl-theme-switch');
const btnSettings = document.getElementById('btn-settings');
const appSubtitle = document.getElementById('app-subtitle');
const tipBanner = document.getElementById('tip-banner');
const tipTitle = document.getElementById('tip-title');
const tipDesc = document.getElementById('tip-desc');
const btnCloseTip = document.getElementById('btn-close-tip');
const volumeSlider = document.getElementById('volume-slider');
const volumeInput = document.getElementById('volume-input');
const sliderFill = document.getElementById('slider-fill');
const volTextPrefix = document.getElementById('vol-text-prefix');
const volMaxLabel = document.getElementById('vol-max-label');
const btnAntiDistortion = document.getElementById('btn-anti-distortion');
const lblAntiDistortion = document.getElementById('lbl-anti-distortion');

// Dual Mode & Mini View DOM Elements
const studioView = document.getElementById('studio-view');
const miniView = document.getElementById('mini-view');
const btnToggleMiniMode = document.getElementById('btn-toggle-mini-mode');
const btnExpandStudio = document.getElementById('btn-expand-studio');
const btnMiniStudio = document.getElementById('btn-mini-studio');
const miniVolBadge = document.getElementById('mini-vol-badge');
const miniVolumeSlider = document.getElementById('mini-volume-slider');
const miniSliderFill = document.getElementById('mini-slider-fill');
const btnMiniMute = document.getElementById('btn-mini-mute');
const miniMuteLabel = document.getElementById('mini-mute-label');
const btnMiniMuteIcon = document.getElementById('btn-mini-mute-icon');
const miniSpeakerLeftIcon = document.getElementById('mini-speaker-left-icon');
const btnMiniReset = document.getElementById('btn-mini-reset');
const lblMiniStudio = document.getElementById('lbl-mini-studio');

// Quick Action Boost Buttons
const btnPresetVoice = document.getElementById('btn-preset-voice');
const lblPresetVoice = document.getElementById('lbl-preset-voice');
const btnPresetBass = document.getElementById('btn-preset-bass');
const lblPresetBass = document.getElementById('lbl-preset-bass');

// Mute & Reset Strip
const btnMuteToggle = document.getElementById('btn-mute-toggle');
const muteIcon = document.getElementById('mute-icon');
const muteLabel = document.getElementById('mute-label');
const btnResetStandard = document.getElementById('btn-reset-standard');
const lblResetStandard = document.getElementById('lbl-reset-standard');

// 5-Band EQ DOM Elements
const btnToggleEq = document.getElementById('btn-toggle-eq');
const eqHeaderTitle = document.getElementById('eq-header-title');
const eqContent = document.getElementById('eq-content');
const lblEqPreset = document.getElementById('lbl-eq-preset');
const eqPresetSelect = document.getElementById('eq-preset-select');
const optgroupStudio = document.getElementById('optgroup-studio');
const customPresetsGroup = document.getElementById('custom-presets-group');
const optPresetFlat = document.getElementById('opt-preset-flat');
const optPresetBassBoost = document.getElementById('opt-preset-bass-boost');
const optPresetVoiceBoost = document.getElementById('opt-preset-voice-boost');
const optPresetRock = document.getElementById('opt-preset-rock');
const optPresetNight = document.getElementById('opt-preset-night');
const optCustomTuned = document.getElementById('opt-custom-tuned');
const eqPresetQuote = document.getElementById('eq-preset-quote');

// EQ Action Buttons
const btnOpenSavePreset = document.getElementById('btn-open-save-preset');
const lblBtnSavePreset = document.getElementById('lbl-btn-save-preset');
const btnDeletePreset = document.getElementById('btn-delete-preset');
const lblBtnDeletePreset = document.getElementById('lbl-btn-delete-preset');
const btnResetEq = document.getElementById('btn-reset-eq');
const lblBtnResetEq = document.getElementById('lbl-btn-reset-eq');

// EQ Slider Bands & Badges
const eqSliders = {
  b60: document.getElementById('eq-band-60'),
  b250: document.getElementById('eq-band-250'),
  b1k: document.getElementById('eq-band-1k'),
  b4k: document.getElementById('eq-band-4k'),
  b12k: document.getElementById('eq-band-12k')
};
const eqBadges = {
  b60: document.getElementById('eq-val-60'),
  b250: document.getElementById('eq-val-250'),
  b1k: document.getElementById('eq-val-1k'),
  b4k: document.getElementById('eq-val-4k'),
  b12k: document.getElementById('eq-val-12k')
};
const bandDescEls = {
  b60: document.getElementById('band-desc-60'),
  b250: document.getElementById('band-desc-250'),
  b1k: document.getElementById('band-desc-1k'),
  b4k: document.getElementById('band-desc-4k'),
  b12k: document.getElementById('band-desc-12k')
};

// Modal Save Preset Elements
const modalSavePreset = document.getElementById('modal-save-preset');
const lblModalSaveTitle = document.getElementById('lbl-modal-save-title');
const lblModalSaveDesc = document.getElementById('lbl-modal-save-desc');
const btnCloseSaveModal = document.getElementById('btn-close-save-modal');
const btnCancelSavePreset = document.getElementById('btn-cancel-save-preset');
const btnConfirmSavePreset = document.getElementById('btn-confirm-save-preset');
const presetNameInput = document.getElementById('preset-name-input');

// Audible Tabs & Footer
const audibleSectionTitle = document.getElementById('audible-section-title');
const tabsListContainer = document.getElementById('tabs-list-container');
const tabsLoadingText = document.getElementById('tabs-loading-text');
const ratingStars = document.getElementById('rating-stars');
const linkShortcuts = document.getElementById('link-shortcuts');

// Settings Modal Elements
const modalSettings = document.getElementById('modal-settings');
const lblModalSettingsTitle = document.getElementById('lbl-modal-settings-title');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnSaveSettings = document.getElementById('btn-save-settings');
const lblSettingsLangTitle = document.getElementById('lbl-settings-lang-title');
const lblSettingsLangDesc = document.getElementById('lbl-settings-lang-desc');
const settingLanguage = document.getElementById('setting-language');
const lblSettingsLimiterTitle = document.getElementById('lbl-settings-limiter-title');
const lblSettingsLimiterDesc = document.getElementById('lbl-settings-limiter-desc');
const settingAntiDistortion = document.getElementById('setting-anti-distortion');
const settingWheelScroll = document.getElementById('setting-wheel-scroll');
const lblSettingsWheelTitle = document.getElementById('lbl-settings-wheel-title');
const lblSettingsWheelDesc = document.getElementById('lbl-settings-wheel-desc');
const settingPopupMode = document.getElementById('setting-popup-mode');
const lblSettingsModeTitle = document.getElementById('lbl-settings-mode-title');
const lblSettingsModeDesc = document.getElementById('lbl-settings-mode-desc');
const optModeStudio = document.getElementById('opt-mode-studio');
const optModeMini = document.getElementById('opt-mode-mini');
const lblSettingsTurboTitle = document.getElementById('lbl-settings-turbo-title');
const lblSettingsTurboDesc = document.getElementById('lbl-settings-turbo-desc');
const settingTurboMode = document.getElementById('setting-turbo-mode');
const lblSettingsMemoryTitle = document.getElementById('lbl-settings-memory-title');
const lblSettingsMemoryDesc = document.getElementById('lbl-settings-memory-desc');
const settingRememberDomains = document.getElementById('setting-remember-domains');
const lblSettingsShortcutsTitle = document.getElementById('lbl-settings-shortcuts-title');
const scDescOpen = document.getElementById('sc-desc-open');
const scDescUp = document.getElementById('sc-desc-up');
const scDescDown = document.getElementById('sc-desc-down');
const scDescMute = document.getElementById('sc-desc-mute');
const scDescJump = document.getElementById('sc-desc-jump');

/* =========================================================
   Initialization
========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
  if (isExtension) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        appState.tabId = activeTab.id;
      }
    } catch (e) {}
  }

  await loadPreferences();
  await loadCustomPresets();
  initEventListeners();
  applyLanguage(appState.language);
  await refreshTabState();
  await loadAudibleTabs();

  if (isExtension) {
    chrome.runtime.sendMessage({ type: 'PREWARM_OFFSCREEN' }).catch(() => {});

    // Listen for tab mute changes from Opera GX / browser in real time
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'TAB_MUTED_UPDATED' && message.tabId === appState.tabId) {
        appState.isMuted = !!message.isMuted;
        if (!appState.isMuted && message.volume !== undefined && message.volume > 0) {
          appState.volume = message.volume;
        }
        syncAllUI();
      }
    });
  }

  if (audibleIntervalId) clearInterval(audibleIntervalId);
  audibleIntervalId = setInterval(loadAudibleTabs, 3000);
});

async function loadPreferences() {
  if (isExtension) {
    try {
      const data = await chrome.storage.local.get(['theme', 'language', 'tipDismissed', 'turboMode', 'rememberDomains', 'antiDistortion', 'popupMode', 'wheelScrollEnabled']);
      if (data.theme) appState.theme = data.theme;
      if (data.language) appState.language = data.language;
      if (data.tipDismissed) appState.tipDismissed = data.tipDismissed;
      if (data.turboMode) appState.turboMode = data.turboMode;
      if (data.rememberDomains !== undefined) appState.rememberDomains = data.rememberDomains;
      if (data.antiDistortion !== undefined) appState.antiDistortion = data.antiDistortion;
      if (data.popupMode) appState.popupMode = data.popupMode;
      if (data.wheelScrollEnabled !== undefined) appState.wheelScrollEnabled = data.wheelScrollEnabled;
    } catch (e) {}
  } else {
    try {
      const savedTheme = localStorage.getItem('soundmax_theme');
      if (savedTheme) appState.theme = savedTheme;
      const savedLang = localStorage.getItem('soundmax_lang');
      if (savedLang) appState.language = savedLang;
      if (localStorage.getItem('soundmax_tip_dismissed') === 'true') appState.tipDismissed = true;
      if (localStorage.getItem('soundmax_turbo') === 'true') appState.turboMode = true;
      if (localStorage.getItem('soundmax_anti_distortion') !== null) {
        appState.antiDistortion = localStorage.getItem('soundmax_anti_distortion') === 'true';
      }
      const savedMode = localStorage.getItem('soundmax_popup_mode');
      if (savedMode) appState.popupMode = savedMode;
      if (localStorage.getItem('soundmax_wheel_scroll') !== null) {
        appState.wheelScrollEnabled = localStorage.getItem('soundmax_wheel_scroll') === 'true';
      }
    } catch (e) {}
  }

  applyTheme(appState.theme);

  if (appState.tipDismissed && tipBanner) {
    tipBanner.style.display = 'none';
  }

  applyTurboMode(appState.turboMode);
  updateLimiterUI(appState.antiDistortion);
  applyPopupMode(appState.popupMode);
  if (settingWheelScroll) settingWheelScroll.checked = appState.wheelScrollEnabled;
}

function applyTheme(theme) {
  appState.theme = theme;
  docEl.setAttribute('data-theme', theme);
  if (themeToggle) {
    themeToggle.checked = theme === 'light';
  }
}

function applyTurboMode(enabled) {
  appState.turboMode = enabled;
  if (settingTurboMode) settingTurboMode.checked = enabled;
  const maxVol = enabled ? 800 : 600;
  volumeSlider.max = maxVol;
  if (volumeInput) volumeInput.max = maxVol;
  if (miniVolumeSlider) miniVolumeSlider.max = maxVol;
  volMaxLabel.textContent = `${maxVol} %`;
  updateSliderUI(appState.volume);
}

function applyPopupMode(mode) {
  if (mode !== 'mini' && mode !== 'studio') mode = 'studio';
  appState.popupMode = mode;
  if (docEl) docEl.setAttribute('data-mode', mode);
  if (document.body) document.body.setAttribute('data-mode', mode);
  if (settingPopupMode) settingPopupMode.value = mode;
  updateSliderUI(appState.volume);
  updateMuteUI(appState.isMuted);
}

function setPopupMode(mode) {
  applyPopupMode(mode);
  if (isExtension) {
    chrome.storage.local.set({ popupMode: mode });
  } else {
    localStorage.setItem('soundmax_popup_mode', mode);
  }
}

function updateLimiterUI(enabled) {
  appState.antiDistortion = !!enabled;
  const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
  if (btnAntiDistortion) {
    if (enabled) {
      btnAntiDistortion.classList.add('active');
    } else {
      btnAntiDistortion.classList.remove('active');
    }
  }
  if (lblAntiDistortion) {
    lblAntiDistortion.textContent = enabled ? t.anti_distortion_on : t.anti_distortion_off;
  }
  if (settingAntiDistortion) {
    settingAntiDistortion.checked = enabled;
  }
}

async function setLimiter(enabled) {
  updateLimiterUI(enabled);
  if (isExtension) {
    chrome.storage.local.set({ antiDistortion: enabled });
    if (appState.tabId) {
      chrome.runtime.sendMessage({
        type: 'SET_LIMITER',
        tabId: appState.tabId,
        enabled
      }).catch(() => {});
    }
  } else {
    localStorage.setItem('soundmax_anti_distortion', enabled ? 'true' : 'false');
  }
}

/* =========================================================
   Language Translation Engine
========================================================= */
function applyLanguage(lang) {
  if (!TRANSLATIONS[lang]) lang = 'id';
  appState.language = lang;
  const t = TRANSLATIONS[lang];

  docEl.lang = lang;
  if (btnLangToggle) {
    btnLangToggle.textContent = lang.toUpperCase();
    btnLangToggle.title = t.lang_btn_title;
  }
  if (settingLanguage) {
    settingLanguage.value = lang;
  }

  // Header & Subtitle
  if (appSubtitle) appSubtitle.textContent = t.subtitle;
  if (lblThemeSwitch) lblThemeSwitch.title = t.theme_switch_title;
  if (btnSettings) btnSettings.title = t.settings_btn_title;

  // Tip Banner
  if (tipTitle) tipTitle.textContent = t.tip_title;
  if (tipDesc) {
    tipDesc.innerHTML = t.tip_desc.replace('{code}', '<code class="tip-code">chrome://extensions/shortcuts</code>');
  }
  if (btnCloseTip) btnCloseTip.title = t.tip_close;

  // Volume Controls
  if (volTextPrefix) volTextPrefix.textContent = t.vol_prefix;
  if (volumeInput) volumeInput.title = t.vol_input_title;
  if (btnAntiDistortion) btnAntiDistortion.title = t.anti_distortion_title;
  if (lblAntiDistortion) lblAntiDistortion.textContent = appState.antiDistortion ? t.anti_distortion_on : t.anti_distortion_off;

  // Quick Action Buttons
  if (lblPresetVoice) lblPresetVoice.textContent = t.preset_voice;
  if (btnPresetVoice) btnPresetVoice.title = t.preset_voice_title;
  if (lblPresetBass) lblPresetBass.textContent = t.preset_bass;
  if (btnPresetBass) btnPresetBass.title = t.preset_bass_title;

  // Mute & Reset Strip
  if (btnMuteToggle) btnMuteToggle.title = t.mute_title;
  if (muteLabel) {
    muteLabel.textContent = appState.isMuted ? t.unmute_tab : t.mute_tab;
  }
  if (lblResetStandard) lblResetStandard.textContent = t.reset_standard;
  if (btnResetStandard) btnResetStandard.title = t.reset_standard_title;

  // 5-Band Studio Equalizer
  if (eqHeaderTitle) eqHeaderTitle.textContent = t.eq_title;
  if (lblEqPreset) lblEqPreset.textContent = t.eq_preset_label;
  if (optgroupStudio) optgroupStudio.label = t.eq_optgroup_studio;
  if (customPresetsGroup) customPresetsGroup.label = t.eq_optgroup_custom;
  if (optPresetFlat) optPresetFlat.textContent = t.preset_opt_flat;
  if (optPresetBassBoost) optPresetBassBoost.textContent = t.preset_opt_bass_boost;
  if (optPresetVoiceBoost) optPresetVoiceBoost.textContent = t.preset_opt_voice_boost;
  if (optPresetRock) optPresetRock.textContent = t.preset_opt_rock;
  if (optPresetNight) optPresetNight.textContent = t.preset_opt_night;
  if (optCustomTuned) optCustomTuned.textContent = t.eq_opt_custom;

  if (lblBtnSavePreset) lblBtnSavePreset.textContent = t.btn_save_preset;
  if (btnOpenSavePreset) btnOpenSavePreset.title = t.btn_save_preset_title;
  if (lblBtnDeletePreset) lblBtnDeletePreset.textContent = t.btn_delete_preset;
  if (btnDeletePreset) btnDeletePreset.title = t.btn_delete_preset_title;
  if (lblBtnResetEq) lblBtnResetEq.textContent = t.btn_reset_eq;
  if (btnResetEq) btnResetEq.title = t.btn_reset_eq_title;

  // Band Descriptions
  if (bandDescEls.b60) bandDescEls.b60.textContent = t.band_60_desc;
  if (bandDescEls.b250) bandDescEls.b250.textContent = t.band_250_desc;
  if (bandDescEls.b1k) bandDescEls.b1k.textContent = t.band_1k_desc;
  if (bandDescEls.b4k) bandDescEls.b4k.textContent = t.band_4k_desc;
  if (bandDescEls.b12k) bandDescEls.b12k.textContent = t.band_12k_desc;

  // Audible Tabs Section
  if (audibleSectionTitle) audibleSectionTitle.textContent = t.tabs_title;
  if (tabsLoadingText) tabsLoadingText.textContent = t.tabs_scanning;

  // Footer
  if (linkShortcuts) linkShortcuts.textContent = t.footer_shortcuts;
  if (ratingStars) ratingStars.title = t.rating_title;
  const linkCreatorEl = document.getElementById('link-creator');
  if (linkCreatorEl) {
    linkCreatorEl.textContent = t.footer_creator;
    linkCreatorEl.title = t.footer_creator_title;
  }

  // Modal: Save Preset
  if (lblModalSaveTitle) lblModalSaveTitle.textContent = t.modal_save_title;
  if (lblModalSaveDesc) lblModalSaveDesc.textContent = t.modal_save_desc;
  if (presetNameInput) presetNameInput.placeholder = t.modal_save_placeholder;
  if (btnCancelSavePreset) btnCancelSavePreset.textContent = t.btn_modal_cancel;
  if (btnConfirmSavePreset) btnConfirmSavePreset.textContent = t.btn_modal_save;

  // Modal: Settings
  if (lblModalSettingsTitle) lblModalSettingsTitle.textContent = t.settings_title;
  if (lblSettingsLangTitle) lblSettingsLangTitle.textContent = t.settings_lang_title;
  if (lblSettingsLangDesc) lblSettingsLangDesc.textContent = t.settings_lang_desc;
  if (lblSettingsLimiterTitle) lblSettingsLimiterTitle.textContent = t.settings_limiter_title;
  if (lblSettingsLimiterDesc) lblSettingsLimiterDesc.textContent = t.settings_limiter_desc;
  if (lblSettingsWheelTitle) lblSettingsWheelTitle.textContent = t.settings_wheel_title;
  if (lblSettingsWheelDesc) lblSettingsWheelDesc.textContent = t.settings_wheel_desc;
  if (lblSettingsModeTitle) lblSettingsModeTitle.textContent = t.settings_mode_title;
  if (lblSettingsModeDesc) lblSettingsModeDesc.textContent = t.settings_mode_desc;
  if (optModeStudio) optModeStudio.textContent = t.opt_mode_studio;
  if (optModeMini) optModeMini.textContent = t.opt_mode_mini;
  if (btnToggleMiniMode) btnToggleMiniMode.title = t.btn_toggle_mini_title;
  if (btnExpandStudio) btnExpandStudio.title = t.btn_expand_studio_title;
  if (lblMiniStudio) lblMiniStudio.textContent = t.mini_studio_btn;
  if (miniMuteLabel) miniMuteLabel.textContent = appState.isMuted ? t.mini_turn_on : t.mini_turn_off;
  if (lblSettingsTurboTitle) lblSettingsTurboTitle.textContent = t.settings_turbo_title;
  if (lblSettingsTurboDesc) lblSettingsTurboDesc.textContent = t.settings_turbo_desc;
  if (lblSettingsMemoryTitle) lblSettingsMemoryTitle.textContent = t.settings_memory_title;
  if (lblSettingsMemoryDesc) lblSettingsMemoryDesc.textContent = t.settings_memory_desc;
  if (lblSettingsShortcutsTitle) lblSettingsShortcutsTitle.textContent = t.settings_shortcuts_title;
  if (scDescOpen) scDescOpen.textContent = t.sc_open_popup;
  if (scDescUp) scDescUp.textContent = t.sc_vol_up;
  if (scDescDown) scDescDown.textContent = t.sc_vol_down;
  if (scDescMute) scDescMute.textContent = t.sc_mute;
  if (scDescJump) scDescJump.textContent = t.sc_numbers;
  if (btnSaveSettings) btnSaveSettings.textContent = t.btn_settings_done;

  // Refresh dynamic states
  syncEqualizerUI();
  renderCustomPresetsDropdown(appState.eq.preset);
  lastAudibleTabsSig = '';
  renderAudibleTabs(isExtension ? null : mockAudibleTabs);
}

function setLanguage(lang) {
  applyLanguage(lang);
  if (isExtension) {
    chrome.storage.local.set({ language: lang });
  } else {
    localStorage.setItem('soundmax_lang', lang);
  }
}

/* =========================================================
   State Synchronization
========================================================= */
async function refreshTabState() {
  if (isExtension) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab) {
        appState.tabId = activeTab.id;
        const res = await chrome.runtime.sendMessage({
          type: 'GET_STATE',
          tabId: activeTab.id
        });

        if (res && !res.error) {
          // Do not overwrite user-adjusted volume if currently interacting or dispatch pending!
          const isInteracting = document.activeElement === volumeSlider ||
                                document.activeElement === volumeInput ||
                                pendingDispatchTimer !== null;

          if (!isInteracting) {
            appState.volume = (res.volume !== undefined && res.volume !== null) ? res.volume : 100;
            appState.previousVolume = appState.volume > 0 ? appState.volume : 100;
          }
          appState.isMuted = !!res.isMuted;
          if (res.eq) {
            appState.eq = {
              b60: res.eq.b60 !== undefined ? res.eq.b60 : (res.eq.bass || 0),
              b250: res.eq.b250 !== undefined ? res.eq.b250 : ((res.eq.bass || 0) * 0.7),
              b1k: res.eq.b1k !== undefined ? res.eq.b1k : (res.eq.mid || 0),
              b4k: res.eq.b4k !== undefined ? res.eq.b4k : ((res.eq.treble || 0) * 0.8),
              b12k: res.eq.b12k !== undefined ? res.eq.b12k : (res.eq.treble || 0),
              bass: res.eq.bass || 0,
              mid: res.eq.mid || 0,
              treble: res.eq.treble || 0,
              preset: res.eq.preset || 'flat'
            };
          }
          appState.domain = res.domain || '';
          appState.savedDomainVolume = res.savedDomainVolume || null;
          appState.isCaptured = !!res.isCaptured;
          if (res.antiDistortion !== undefined) {
            updateLimiterUI(res.antiDistortion);
          }
        }
      }
    } catch (e) {
      console.warn('Could not query active tab state:', e);
    }
  } else {
    appState.tabId = 101;
    appState.domain = 'youtube.com';
    appState.savedDomainVolume = 190;
  }

  syncAllUI();
}

function syncAllUI() {
  const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
  volumeSlider.value = appState.isMuted ? 0 : appState.volume;
  if (volumeInput) {
    volumeInput.value = appState.isMuted ? 0 : appState.volume;
  }
  updateSliderUI(appState.volume);
  updateMuteUI(appState.isMuted);
  updatePresetHighlight();
  syncEqualizerUI();
}

/* =========================================================
   Volume & Mute Controls (Instantaneous Real-Time)
========================================================= */
let lastDispatchTime = 0;
let pendingDispatchTimer = null;
const THROTTLE_INTERVAL_MS = 35; // ~28 fps - smooth and responsive

async function sendVolumeToBackground(vol, tabId) {
  if (!isExtension) {
    const currentMock = mockAudibleTabs.find(t => t.id === (tabId || appState.tabId));
    if (currentMock) currentMock.volume = vol;
    renderAudibleTabs(mockAudibleTabs);
    return;
  }

  // Ensure tabId is resolved before sending
  let targetTabId = tabId || appState.tabId;
  if (!targetTabId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        targetTabId = tab.id;
        appState.tabId = tab.id;
      }
    } catch (e) {}
  }

  if (!targetTabId) return;

  try {
    const res = await chrome.runtime.sendMessage({
      type: 'SET_VOLUME',
      tabId: targetTabId,
      volume: vol
    });
    if (res && res.isCaptured) {
      appState.isCaptured = true;
    }
  } catch (err) {}
}

function updateSliderUI(vol) {
  const max = parseInt(volumeSlider.max, 10) || 600;
  const displayVol = appState.isMuted ? 0 : vol;
  const percent = Math.min(100, Math.max(0, (displayVol / max) * 100));
  sliderFill.style.width = `${percent}%`;

  if (miniVolumeSlider) {
    miniVolumeSlider.value = displayVol;
  }
  if (miniSliderFill) {
    miniSliderFill.style.width = `${percent}%`;
  }
  if (miniVolBadge) {
    miniVolBadge.textContent = appState.isMuted ? 'Muted' : `${vol} %`;
  }

  if (volumeInput && document.activeElement !== volumeInput) {
    volumeInput.value = displayVol;
  }

  const gradient = appState.isMuted
    ? '#64748b'
    : (vol > 400
        ? 'linear-gradient(90deg, #f59e0b, #ef4444, #e11d48)'
        : (vol > 200
            ? 'linear-gradient(90deg, #3b82f6, #06b6d4, #f59e0b)'
            : 'linear-gradient(90deg, #3b82f6, #06b6d4)'));

  sliderFill.style.background = gradient;
  if (miniSliderFill) {
    miniSliderFill.style.background = gradient;
  }
}

function handleVolumeChange(newVol, immediate = false) {
  const maxVol = parseInt(volumeSlider.max, 10) || 600;
  appState.volume = Math.max(0, Math.min(maxVol, newVol));

  if (appState.volume > 0) {
    appState.previousVolume = appState.volume;
  }

  if (appState.isMuted && appState.volume > 0) {
    appState.isMuted = false;
    updateMuteUI(false);
    if (isExtension && appState.tabId) {
      chrome.runtime.sendMessage({
        type: 'SET_MUTE',
        tabId: appState.tabId,
        isMuted: false
      }).catch(() => {});
    }
  }

  // Fast synchronous UI update: both slider and input update simultaneously
  volumeSlider.value = appState.volume;
  if (volumeInput && document.activeElement !== volumeInput) {
    volumeInput.value = appState.volume;
  }
  updateSliderUI(appState.volume);
  updatePresetHighlight();

  const now = Date.now();

  if (immediate) {
    if (pendingDispatchTimer) {
      clearTimeout(pendingDispatchTimer);
      pendingDispatchTimer = null;
    }
    lastDispatchTime = now;
    sendVolumeToBackground(appState.volume, appState.tabId);
    return;
  }

  // Throttled real-time dispatch with guaranteed trailing update
  const timeSinceLastDispatch = now - lastDispatchTime;

  if (timeSinceLastDispatch >= THROTTLE_INTERVAL_MS) {
    if (pendingDispatchTimer) {
      clearTimeout(pendingDispatchTimer);
      pendingDispatchTimer = null;
    }
    lastDispatchTime = now;
    sendVolumeToBackground(appState.volume, appState.tabId);
  } else {
    // Schedule trailing dispatch so user's final slider value is never dropped
    if (pendingDispatchTimer) {
      clearTimeout(pendingDispatchTimer);
    }
    const waitTime = THROTTLE_INTERVAL_MS - timeSinceLastDispatch;
    pendingDispatchTimer = setTimeout(() => {
      pendingDispatchTimer = null;
      lastDispatchTime = Date.now();
      sendVolumeToBackground(appState.volume, appState.tabId);
    }, waitTime);
  }
}

function updateMuteUI(muted) {
  const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
  if (muted) {
    btnMuteToggle.classList.add('muted-active');
    muteIcon.textContent = '🔊';
    muteLabel.textContent = t.unmute_tab;
    if (volumeInput) {
      volumeInput.value = 0;
      volumeInput.disabled = true;
    }
    sliderFill.style.width = '0%';
    volumeSlider.value = 0;

    // Mini Mode sync
    if (miniMuteLabel) miniMuteLabel.textContent = t.mini_turn_on;
    if (btnMiniMute) btnMiniMute.classList.add('muted-active');
    if (miniSpeakerLeftIcon) miniSpeakerLeftIcon.textContent = '🔇';
    if (miniSliderFill) miniSliderFill.style.width = '0%';
    if (miniVolBadge) miniVolBadge.textContent = 'Muted';
  } else {
    btnMuteToggle.classList.remove('muted-active');
    muteIcon.textContent = '🔇';
    muteLabel.textContent = t.mute_tab;
    if (volumeInput) {
      volumeInput.value = appState.volume;
      volumeInput.disabled = false;
    }
    volumeSlider.value = appState.volume;
    updateSliderUI(appState.volume);

    // Mini Mode sync
    if (miniMuteLabel) miniMuteLabel.textContent = t.mini_turn_off;
    if (btnMiniMute) btnMiniMute.classList.remove('muted-active');
    if (miniSpeakerLeftIcon) miniSpeakerLeftIcon.textContent = '🔈';
    if (miniVolBadge) miniVolBadge.textContent = `${appState.volume} %`;
  }
}

async function toggleMute() {
  appState.isMuted = !appState.isMuted;

  if (!appState.isMuted && appState.volume === 0) {
    appState.volume = appState.previousVolume || 100;
  }

  updateMuteUI(appState.isMuted);

  if (isExtension && appState.tabId) {
    const res = await chrome.runtime.sendMessage({
      type: 'SET_MUTE',
      tabId: appState.tabId,
      isMuted: appState.isMuted
    });
    if (res && res.volume !== undefined && !appState.isMuted) {
      appState.volume = res.volume;
    }
    syncAllUI();
  } else {
    const currentMock = mockAudibleTabs.find(t => t.id === appState.tabId);
    if (currentMock) currentMock.isMuted = appState.isMuted;
    renderAudibleTabs(mockAudibleTabs);
  }
}

function updatePresetHighlight() {
  if (btnPresetVoice) btnPresetVoice.classList.remove('active');
  if (btnPresetBass) btnPresetBass.classList.remove('active');

  if (appState.eq.preset === 'voice_boost') {
    if (btnPresetVoice) btnPresetVoice.classList.add('active');
  } else if (appState.eq.preset === 'bass_boost') {
    if (btnPresetBass) btnPresetBass.classList.add('active');
  }
}

/* =========================================================
   5-Band Parametric Equalizer Logic & Custom Preset Storage
========================================================= */

async function loadCustomPresets() {
  if (isExtension) {
    try {
      const data = await chrome.storage.local.get(['soundmax_custom_presets']);
      if (Array.isArray(data.soundmax_custom_presets)) {
        userCustomPresets = data.soundmax_custom_presets;
      }
    } catch (e) {}
  } else {
    try {
      const saved = localStorage.getItem('soundmax_custom_presets');
      if (saved) {
        userCustomPresets = JSON.parse(saved);
      }
    } catch (e) {}
  }

  renderCustomPresetsDropdown();
}

async function saveCustomPresetsToStorage() {
  if (isExtension) {
    await chrome.storage.local.set({ soundmax_custom_presets: userCustomPresets });
  } else {
    localStorage.setItem('soundmax_custom_presets', JSON.stringify(userCustomPresets));
  }
}

function renderCustomPresetsDropdown(selectedId = null) {
  if (!customPresetsGroup) return;
  const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
  customPresetsGroup.innerHTML = '';

  if (userCustomPresets.length === 0) {
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.disabled = true;
    emptyOpt.textContent = t.eq_empty_custom;
    customPresetsGroup.appendChild(emptyOpt);
    return;
  }

  userCustomPresets.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `★ ${p.name}`;
    if (selectedId && p.id === selectedId) {
      opt.selected = true;
    }
    customPresetsGroup.appendChild(opt);
  });
}

function syncEqualizerUI() {
  const eq = appState.eq;
  const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
  
  // Set dropdown value
  if (eq.preset && eqPresetSelect) {
    eqPresetSelect.value = eq.preset;
  }

  // Update quote
  if (STUDIO_PRESETS[eq.preset]) {
    const quoteKey = STUDIO_PRESETS[eq.preset].quoteKey;
    if (eqPresetQuote) eqPresetQuote.textContent = t[quoteKey] || t.quote_flat;
    if (btnDeletePreset) btnDeletePreset.style.display = 'none';
  } else {
    const foundCustom = userCustomPresets.find(p => p.id === eq.preset);
    if (foundCustom) {
      if (eqPresetQuote) eqPresetQuote.textContent = t.quote_user_custom.replace('{name}', foundCustom.name);
      if (btnDeletePreset) btnDeletePreset.style.display = 'inline-flex';
    } else {
      if (eqPresetQuote) eqPresetQuote.textContent = t.quote_custom;
      if (btnDeletePreset) btnDeletePreset.style.display = 'none';
    }
  }

  // Update 5 sliders and text badges
  const bands = ['b60', 'b250', 'b1k', 'b4k', 'b12k'];
  bands.forEach((b) => {
    const val = eq[b] !== undefined ? eq[b] : 0;
    if (eqSliders[b]) eqSliders[b].value = val;
    if (eqBadges[b]) {
      eqBadges[b].textContent = `${val > 0 ? '+' : ''}${val} dB`;
      if (val > 0) {
        eqBadges[b].style.color = 'var(--accent-blue, #3b82f6)';
      } else if (val < 0) {
        eqBadges[b].style.color = '#f59e0b';
      } else {
        eqBadges[b].style.color = 'var(--text-muted)';
      }
    }
  });
}

async function setEQ(eqData) {
  appState.eq = {
    ...appState.eq,
    ...eqData,
    bass: eqData.b60 !== undefined ? eqData.b60 : (appState.eq.bass || 0),
    mid: eqData.b1k !== undefined ? eqData.b1k : (appState.eq.mid || 0),
    treble: eqData.b12k !== undefined ? eqData.b12k : (appState.eq.treble || 0)
  };

  syncEqualizerUI();
  updatePresetHighlight();

  if (isExtension && appState.tabId) {
    chrome.runtime.sendMessage({
      type: 'SET_EQ',
      tabId: appState.tabId,
      eq: appState.eq
    }).catch(() => {});
  }
}

/* =========================================================
   Audible Tabs Management
========================================================= */
async function loadAudibleTabs() {
  if (isExtension) {
    try {
      const tabs = await chrome.runtime.sendMessage({ type: 'GET_AUDIBLE_TABS' });
      if (Array.isArray(tabs)) {
        renderAudibleTabs(tabs);
      }
    } catch (e) {}
  } else {
    renderAudibleTabs(mockAudibleTabs);
  }
}

function renderAudibleTabs(tabs) {
  if (!tabs) {
    tabs = isExtension ? [] : mockAudibleTabs;
  }

  // Prevent DOM thrashing and layout reflows if tabs list has not changed
  const currentSig = `${appState.language}_${appState.tabId}_` + JSON.stringify(tabs.map(t => [t.id, t.volume, t.isMuted, t.active, t.title]));
  if (currentSig === lastAudibleTabsSig) {
    return;
  }
  lastAudibleTabsSig = currentSig;

  tabsListContainer.innerHTML = '';
  const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;

  if (!tabs || tabs.length === 0) {
    tabsListContainer.innerHTML = `
      <div class="empty-tabs-notice">
        ${t.tabs_empty}
      </div>
    `;
    return;
  }

  tabs.forEach(tab => {
    const card = document.createElement('div');
    const isCurrent = (tab.id === appState.tabId) || tab.active;
    card.className = `tab-card ${isCurrent ? 'is-active-tab' : ''}`;
    card.title = t.tab_card_title.replace('{title}', tab.title || tab.domain || 'Audio Tab');
    card.dataset.tabId = tab.id;
    card.dataset.windowId = tab.windowId || '';

    let volClass = '';
    if (tab.volume > 400) volClass = 'boosted-high';
    else if (tab.volume > 200) volClass = 'boosted-mid';

    const favIconHtml = tab.favIconUrl
      ? `<img src="${tab.favIconUrl}" class="tab-favicon" alt="Icon" onerror="this.outerHTML='<span class=\\'tab-favicon-fallback\\'>🎵</span>'">`
      : `<span class="tab-favicon-fallback">🎵</span>`;

    const badgeText = tab.isMuted ? t.tab_muted_badge : `${tab.volume || 100} %`;

    card.innerHTML = `
      <div class="tab-info-group">
        ${favIconHtml}
        <span class="tab-title">${escapeHtml(tab.title || tab.domain || 'Audio Tab')}</span>
      </div>
      <span class="tab-vol-badge ${volClass}">${badgeText}</span>
    `;

    tabsListContainer.appendChild(card);
  });
}

async function switchTab(tabId, windowId) {
  if (isExtension) {
    try {
      await chrome.runtime.sendMessage({
        type: 'SWITCH_TO_TAB',
        tabId,
        windowId
      });
      window.close();
    } catch (e) {}
  } else {
    appState.tabId = tabId;
    mockAudibleTabs.forEach(t => t.active = (t.id === tabId));
    renderAudibleTabs(mockAudibleTabs);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* =========================================================
   Event Listeners
========================================================= */
function initEventListeners() {
  // Quick Language Toggle in Header
  if (btnLangToggle) {
    btnLangToggle.addEventListener('click', () => {
      const nextLang = appState.language === 'id' ? 'en' : 'id';
      setLanguage(nextLang);
    });
  }

  // Language Dropdown in Settings
  if (settingLanguage) {
    settingLanguage.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  // Volume Slider Drag
  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    handleVolumeChange(val, false);
  });

  volumeSlider.addEventListener('change', (e) => {
    const val = parseInt(e.target.value, 10);
    handleVolumeChange(val, true);
  });

  // Direct Editable Volume Number Input
  if (volumeInput) {
    volumeInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val)) {
        handleVolumeChange(val, false);
      }
    });

    volumeInput.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      const maxVol = parseInt(volumeSlider.max, 10) || 600;
      if (isNaN(val)) val = 100;
      val = Math.max(0, Math.min(maxVol, val));
      volumeInput.value = val;
      handleVolumeChange(val, true);
    });

    volumeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        volumeInput.blur();
      }
    });
  }

  // Theme Toggle
  themeToggle.addEventListener('change', (e) => {
    const newTheme = e.target.checked ? 'light' : 'dark';
    applyTheme(newTheme);
    if (isExtension) {
      chrome.storage.local.set({ theme: newTheme });
    } else {
      localStorage.setItem('soundmax_theme', newTheme);
    }
  });

  // Dismiss Tip
  btnCloseTip.addEventListener('click', () => {
    tipBanner.style.display = 'none';
    appState.tipDismissed = true;
    if (isExtension) {
      chrome.storage.local.set({ tipDismissed: true });
    } else {
      localStorage.setItem('soundmax_tip_dismissed', 'true');
    }
  });



  // Preset: Voice Boost (160% + mid vocal clarifier)
  btnPresetVoice.addEventListener('click', async () => {
    appState.volume = 160;
    appState.previousVolume = 160;
    appState.isMuted = false;
    appState.eq = { ...STUDIO_PRESETS.voice_boost, preset: 'voice_boost' };
    syncAllUI();

    if (isExtension && appState.tabId) {
      await chrome.runtime.sendMessage({
        type: 'SET_VOLUME',
        tabId: appState.tabId,
        volume: 160
      }).catch(() => {});

      await chrome.runtime.sendMessage({
        type: 'SET_EQ',
        tabId: appState.tabId,
        eq: appState.eq
      }).catch(() => {});
    }
  });

  // Preset: Bass Boost (180% + tight warm low-end)
  btnPresetBass.addEventListener('click', async () => {
    appState.volume = 180;
    appState.previousVolume = 180;
    appState.isMuted = false;
    appState.eq = { ...STUDIO_PRESETS.bass_boost, preset: 'bass_boost' };
    syncAllUI();

    if (isExtension && appState.tabId) {
      await chrome.runtime.sendMessage({
        type: 'SET_VOLUME',
        tabId: appState.tabId,
        volume: 180
      }).catch(() => {});

      await chrome.runtime.sendMessage({
        type: 'SET_EQ',
        tabId: appState.tabId,
        eq: appState.eq
      }).catch(() => {});
    }
  });

  // Mute / Unmute Button
  btnMuteToggle.addEventListener('click', () => {
    toggleMute();
  });

  // Reset Volume to 100% Button
  btnResetStandard.addEventListener('click', async () => {
    appState.volume = 100;
    appState.previousVolume = 100;
    appState.isMuted = false;
    appState.eq = { ...STUDIO_PRESETS.flat, preset: 'flat' };
    syncAllUI();

    if (isExtension && appState.tabId) {
      await chrome.runtime.sendMessage({
        type: 'SET_VOLUME',
        tabId: appState.tabId,
        volume: 100
      }).catch(() => {});
      await chrome.runtime.sendMessage({
        type: 'SET_EQ',
        tabId: appState.tabId,
        eq: appState.eq
      }).catch(() => {});
    }
  });

  // Equalizer Accordion Toggle
  btnToggleEq.addEventListener('click', () => {
    const isExpanded = btnToggleEq.getAttribute('aria-expanded') === 'true';
    btnToggleEq.setAttribute('aria-expanded', !isExpanded);
    eqContent.style.display = isExpanded ? 'none' : 'flex';
  });

  // EQ Preset Dropdown Change
  eqPresetSelect.addEventListener('change', async (e) => {
    const selectedKey = e.target.value;
    if (!selectedKey) return;

    if (STUDIO_PRESETS[selectedKey]) {
      const p = STUDIO_PRESETS[selectedKey];
      await setEQ({
        b60: p.b60,
        b250: p.b250,
        b1k: p.b1k,
        b4k: p.b4k,
        b12k: p.b12k,
        preset: selectedKey
      });
    } else {
      const found = userCustomPresets.find(p => p.id === selectedKey);
      if (found) {
        await setEQ({
          b60: found.b60,
          b250: found.b250,
          b1k: found.b1k,
          b4k: found.b4k,
          b12k: found.b12k,
          preset: found.id
        });
      }
    }
  });

  // Reset EQ Flat Button
  btnResetEq.addEventListener('click', async () => {
    await setEQ({ ...STUDIO_PRESETS.flat, preset: 'flat' });
  });

  // 5 Individual EQ Band Sliders
  const setupBandSlider = (bandKey) => {
    const slider = eqSliders[bandKey];
    if (!slider) return;

    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      const updated = { [bandKey]: val, preset: 'custom' };
      setEQ(updated);
    });
  };

  setupBandSlider('b60');
  setupBandSlider('b250');
  setupBandSlider('b1k');
  setupBandSlider('b4k');
  setupBandSlider('b12k');

  // Custom Preset Management: Open Save Modal
  btnOpenSavePreset.addEventListener('click', () => {
    modalSavePreset.style.display = 'flex';
    const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
    presetNameInput.value = t.default_preset_name.replace('{num}', userCustomPresets.length + 1);
    setTimeout(() => {
      presetNameInput.focus();
      presetNameInput.select();
    }, 50);
  });

  // Close Save Preset Modal
  const closeSaveModal = () => {
    modalSavePreset.style.display = 'none';
  };
  btnCloseSaveModal.addEventListener('click', closeSaveModal);
  btnCancelSavePreset.addEventListener('click', closeSaveModal);

  // Confirm Save Preset
  const handleConfirmSavePreset = async () => {
    const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
    let name = presetNameInput.value.trim();
    if (!name) {
      name = t.default_preset_name.replace('{num}', userCustomPresets.length + 1);
    }

    const newPreset = {
      id: `custom_${Date.now()}`,
      name,
      b60: appState.eq.b60 || 0,
      b250: appState.eq.b250 || 0,
      b1k: appState.eq.b1k || 0,
      b4k: appState.eq.b4k || 0,
      b12k: appState.eq.b12k || 0
    };

    userCustomPresets.push(newPreset);
    await saveCustomPresetsToStorage();

    renderCustomPresetsDropdown(newPreset.id);
    await setEQ({ preset: newPreset.id });

    closeSaveModal();
  };

  btnConfirmSavePreset.addEventListener('click', handleConfirmSavePreset);
  presetNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleConfirmSavePreset();
    }
  });

  // Delete Custom Preset
  btnDeletePreset.addEventListener('click', async () => {
    const currentKey = eqPresetSelect.value;
    const foundIndex = userCustomPresets.findIndex(p => p.id === currentKey);
    if (foundIndex !== -1) {
      userCustomPresets.splice(foundIndex, 1);
      await saveCustomPresetsToStorage();
      renderCustomPresetsDropdown();
      await setEQ({ ...STUDIO_PRESETS.flat, preset: 'flat' });
    }
  });

  // Smart Limiter Pill Toggle
  if (btnAntiDistortion) {
    btnAntiDistortion.addEventListener('click', () => {
      setLimiter(!appState.antiDistortion);
    });
  }

  // Mini Mode Listeners
  if (btnToggleMiniMode) {
    btnToggleMiniMode.addEventListener('click', () => setPopupMode('mini'));
  }
  if (btnExpandStudio) {
    btnExpandStudio.addEventListener('click', () => setPopupMode('studio'));
  }
  if (btnMiniStudio) {
    btnMiniStudio.addEventListener('click', () => setPopupMode('studio'));
  }
  if (btnMiniMute) {
    btnMiniMute.addEventListener('click', () => toggleMute());
  }
  if (btnMiniMuteIcon) {
    btnMiniMuteIcon.addEventListener('click', () => toggleMute());
  }
  if (btnMiniReset) {
    btnMiniReset.addEventListener('click', async () => {
      appState.volume = 100;
      appState.previousVolume = 100;
      appState.isMuted = false;
      appState.eq = { ...STUDIO_PRESETS.flat, preset: 'flat' };
      syncAllUI();

      if (isExtension && appState.tabId) {
        await chrome.runtime.sendMessage({
          type: 'SET_VOLUME',
          tabId: appState.tabId,
          volume: 100
        }).catch(() => {});
        await chrome.runtime.sendMessage({
          type: 'SET_EQ',
          tabId: appState.tabId,
          eq: appState.eq
        }).catch(() => {});
      }
    });
  }
  if (miniVolumeSlider) {
    miniVolumeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      handleVolumeChange(val, false);
    });
    miniVolumeSlider.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      handleVolumeChange(val, true);
    });
  }

  // Mouse Wheel Volume Adjustment - Only when hovering over volume controls and enabled in settings
  window.addEventListener('wheel', (e) => {
    if (!appState.wheelScrollEnabled) return;

    // Check if mouse cursor is hovering over the volume control area or mini view
    const isOverVolume = e.target.closest('.volume-control-section') || 
                         e.target.closest('#mini-view') || 
                         e.target.closest('.slider-track-wrap');

    if (!isOverVolume) {
      // Allow natural page and mixer scrolling!
      return;
    }

    // Do not intercept if actively typing in an input
    if (['select', 'textarea'].includes(document.activeElement?.tagName.toLowerCase())) return;

    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    const maxVol = parseInt(volumeSlider.max, 10) || 600;
    const targetVol = Math.max(0, Math.min(maxVol, appState.volume + delta));
    handleVolumeChange(targetVol, true);
  }, { passive: false });

  // Settings Modal Handlers
  btnSettings.addEventListener('click', () => {
    modalSettings.style.display = 'flex';
  });
  btnCloseModal.addEventListener('click', () => {
    modalSettings.style.display = 'none';
  });
  btnSaveSettings.addEventListener('click', () => {
    const turbo = settingTurboMode.checked;
    applyTurboMode(turbo);
    const limiter = settingAntiDistortion ? settingAntiDistortion.checked : true;
    setLimiter(limiter);
    const chosenMode = settingPopupMode ? settingPopupMode.value : 'studio';
    setPopupMode(chosenMode);
    const wheelEnabled = settingWheelScroll ? settingWheelScroll.checked : true;
    appState.wheelScrollEnabled = wheelEnabled;
    modalSettings.style.display = 'none';
    if (isExtension) {
      chrome.storage.local.set({
        turboMode: turbo,
        rememberDomains: settingRememberDomains.checked,
        antiDistortion: limiter,
        popupMode: chosenMode,
        wheelScrollEnabled: wheelEnabled
      });
    } else {
      localStorage.setItem('soundmax_turbo', turbo ? 'true' : 'false');
      localStorage.setItem('soundmax_anti_distortion', limiter ? 'true' : 'false');
      localStorage.setItem('soundmax_popup_mode', chosenMode);
      localStorage.setItem('soundmax_wheel_scroll', wheelEnabled ? 'true' : 'false');
    }
  });

  // Rating Stars
  ratingStars.addEventListener('click', () => {
    const t = TRANSLATIONS[appState.language] || TRANSLATIONS.id;
    if (isExtension) {
      const extId = chrome.runtime.id;
      window.open(`https://chromewebstore.google.com/detail/${extId}/reviews`, '_blank');
    } else {
      alert(t.rating_thank_you);
    }
  });

  // Link Shortcuts
  linkShortcuts.addEventListener('click', (e) => {
    e.preventDefault();
    if (isExtension) {
      chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    } else {
      modalSettings.style.display = 'flex';
    }
  });

  // Creator GitHub Profile Watermark Links
  const openCreatorProfile = (e) => {
    e.preventDefault();
    if (isExtension) {
      chrome.tabs.create({ url: 'https://github.com/Pikurii' });
    } else {
      window.open('https://github.com/Pikurii', '_blank');
    }
  };
  const linkCreator = document.getElementById('link-creator');
  if (linkCreator) linkCreator.addEventListener('click', openCreatorProfile);
  const linkSettingsCreator = document.getElementById('link-settings-creator');
  if (linkSettingsCreator) linkSettingsCreator.addEventListener('click', openCreatorProfile);

  // Delegated click handler for audible tabs cards (zero memory leak)
  tabsListContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.tab-card');
    if (card && card.dataset.tabId) {
      const tId = parseInt(card.dataset.tabId, 10);
      const wId = parseInt(card.dataset.windowId, 10);
      if (!isNaN(tId)) {
        switchTab(tId, isNaN(wId) ? null : wId);
      }
    }
  });

  // Numeric Keyboard Shortcuts in popup
  window.addEventListener('keydown', (e) => {
    if (['input', 'textarea'].includes(document.activeElement?.tagName.toLowerCase())) return;

    if (e.key >= '0' && e.key <= '6') {
      const targetVol = parseInt(e.key, 10) * 100;
      handleVolumeChange(targetVol, true);
    } else if (e.key.toLowerCase() === 'm') {
      toggleMute();
    } else if (e.key === 'ArrowUp') {
      handleVolumeChange(appState.volume + 10, true);
    } else if (e.key === 'ArrowDown') {
      handleVolumeChange(appState.volume - 10, true);
    }
  });

  // Clean up interval and timers on popup teardown
  const cleanupPopup = () => {
    if (audibleIntervalId) {
      clearInterval(audibleIntervalId);
      audibleIntervalId = null;
    }
    if (pendingDispatchTimer) {
      clearTimeout(pendingDispatchTimer);
      pendingDispatchTimer = null;
    }
  };

  window.addEventListener('pagehide', cleanupPopup);
  window.addEventListener('beforeunload', cleanupPopup);
}
