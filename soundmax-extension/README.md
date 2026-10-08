# 🔊 SoundMax - Tab Audio Booster & Studio EQ (Manifest V3)

[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=google-chrome)](https://developer.chrome.com/docs/extensions/mv3/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Pikurii/soundmax-volume-booster?style=social)](https://github.com/Pikurii/soundmax-volume-booster)

A modern, high-performance browser extension for **Google Chrome, Microsoft Edge, Brave, and Opera** that lets you control and amplify individual tab audio up to **600%** (or up to **800%** with Turbo Mode), type custom volume percentages directly, shape sound with a **5-Band Studio Parametric Equalizer (60Hz, 250Hz, 1kHz, 4kHz, 12kHz)**, and **save named custom presets**.

Engineered with a **Zero-Leak & 0.0% Idle CPU** architecture (*hardware AudioContext suspension & full AudioNode graph deallocation*), **Dual View Modes (Mini & Studio)**, and mastering-grade anti-distortion (*brickwall peak limiter & analog tape soft-clipper*).

---

## ✨ Features & Highlights

- **📐 Dual View Mode (Mini & Studio)**:
  - **Mini Mode (Compact)**: Ultra-compact view (~250px × 95px) for lightning-fast volume adjustments, one-click Turn Off / On, 100% Reset, and expand button.
  - **Studio Mode (Full)**: Comprehensive control center with the full 5-band studio parametric equalizer, visualizer, quick boost presets, and live audible tab switcher.
- **🖱️ Mouse Wheel Volume Scrolling**:
  - Hover your cursor over the volume slider area and scroll your mouse wheel to adjust volume up or down in 5% increments.
  - Natural page and mixer scrolling remains uninterrupted when hovering outside the slider. Can be toggled on/off in Settings.
- **🛡️ Adaptive Smart Limiter & Anti-Distortion**:
  - Integrated `DynamicsCompressorNode` (-1.5 dBFS) coupled with an analog `WaveShaperNode` soft-clipping saturation curve.
  - Eliminates harsh digital clipping and distortion even at extreme boost levels (600% - 800%).
- **⌨️ Direct Number Input (Editable Percentage)**:
  - Type exact volume values (e.g. `125`, `275`, `450`, `600`) directly into the input box next to the slider and press `Enter`.
- **🎛️ 5-Band Studio Parametric Equalizer**:
  - **60 Hz (Sub-Bass)**: Subwoofer rumble, kick drum punch, and cinematic low-end.
  - **250 Hz (Bass)**: Warmth, bass guitar harmonics, and male vocal body.
  - **1 kHz (Mid)**: Core vocal intelligibility, podcast dialogue, and lead instruments.
  - **4 kHz (Presence)**: Speech articulation, anime vocal clarity, and crisp movie dialogue.
  - **12 kHz (Treble / Air)**: Acoustic sparkle, airy sheen, cymbals, and spatial detail.
- **💾 Unlimited Custom EQ Presets**:
  - Tune the 5 bands to your liking and click **"Save Preset"** to give it a custom name (*Anime Vocal Mode*, *EDM Bass*, *Podcast Master*). Presets are saved persistently in browser storage.
- **🌐 Bilingual Support (English & Bahasa Indonesia)**:
  - Instant one-click language toggle (`ID` / `EN`) in the top header. All UI text, preset descriptions, and tooltips switch dynamically.
- **📑 Live Audible Tab Switcher**:
  - Scans and lists all open tabs currently playing audio. Jump to any tab with a single click.
- **🏷️ Real-time Toolbar Badge**:
  - Displays current volume percentage right on your browser toolbar icon with color-coded boost tiers (Blue → Amber → Red).
- **🌓 Dark & Light Glassmorphism Themes**:
  - Sleek modern glassmorphism design with a high-contrast dark mode and clean light mode.

---

## ⚡ Performance Guarantees & Zero-Leak Architecture

SoundMax is engineered to adhere strictly to Chrome Manifest V3 guidelines, ensuring zero battery drain and minimal memory footprint:

1. **0.0% Idle CPU Guarantee (AudioContext Auto-Suspend)**:
   - In Chromium browsers, an `AudioContext` left in the `running` state spins a real-time hardware audio rendering thread continuously (~0.5%–2% CPU even during complete silence).
   - SoundMax automatically suspends the `AudioContext` whenever tab capture stops or volume is normalized. CPU usage immediately drops to **0.0%**.
2. **Complete AudioNode Deallocation (Zero RAM Leak)**:
   - When a tab is closed or unboosted, all 10 audio processing nodes (`source`, 5 biquad filters, `gainNode`, `compressor`, `softClipper`, `outputGain`) are disconnected (`.disconnect()`), media tracks are stopped (`.stop()`), and references are cleared for immediate V8 Garbage Collection.
3. **Dead Tab Cleanup & DOM Memoization**:
   - Closed or discarded tabs are automatically pruned from internal maps via `chrome.tabs.onRemoved` and `chrome.tabs.onReplaced`.
   - The popup's tab polling uses signature memoization to prevent unnecessary DOM reflows and memory allocations.
4. **100% Offline & Safe**:
   - Zero external scripts, zero `eval()`, zero `new Function()`, zero remote telemetry `fetch` calls, and no unnecessary permissions (no `<all_urls>` required).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + V` | Open SoundMax popup |
| `Alt + ↑` | Increase active tab volume (+10%) |
| `Alt + ↓` | Decrease active tab volume (-10%) |
| `Alt + M` | Toggle Mute / Unmute |
| `0` to `6` *(when popup is open)* | Jump directly to 0%, 100%, 200%, ..., 600% |
| `↑` / `↓` *(when popup is open)* | Adjust volume in 10% steps |
| `Enter` *(inside volume number input)* | Apply typed volume percentage |

> **Note**: You can customize shortcuts anytime by navigating to `chrome://extensions/shortcuts` in your address bar.

---

## 🚀 How to Install & Use

### Method 1: Load Unpacked in Chrome / Edge / Brave / Opera
1. Download or clone this repository:
   ```bash
   git clone https://github.com/Pikurii/soundmax-volume-booster.git
   ```
2. Open your browser and go to `chrome://extensions` (or `edge://extensions` in Edge).
3. Enable **Developer mode** (toggle switch in the top-right corner).
4. Click **Load unpacked** and select the `soundmax-extension` folder inside this project.
5. Click the puzzle icon 🧩 on your toolbar and pin **SoundMax** for easy access!

### Method 2: Install from ZIP
1. Download [`soundmax-extension.zip`](https://github.com/Pikurii/soundmax-volume-booster/blob/main/soundmax-extension.zip) from this repository.
2. Extract the `.zip` archive to a folder.
3. In `chrome://extensions`, click **Load unpacked** and select the extracted folder.

---

## 📁 Repository Structure

```text
soundmax-volume-booster/
├── manifest.json            # Extension configuration (Manifest V3)
├── background.js           # Background service worker (tab state sync & badge)
├── offscreen/
│   ├── offscreen.html      # Offscreen DOM host for Web Audio API
│   └── offscreen.js        # DSP Audio Engine: 5-Band EQ, Limiter, 0.0% CPU suspend
├── popup/
│   ├── popup.html          # Dual Mode UI (Mini & Studio views)
│   ├── popup.css           # Glassmorphism dark/light design system
│   └── popup.js            # UI controller, state sync & preset manager
├── icons/                  # High-resolution icons (16, 32, 48, 128 px)
├── soundmax-extension/     # Clean standalone package ready for browser install
├── soundmax-extension.zip  # Production ZIP archive ready for Chrome Web Store
├── LICENSE                 # MIT License
└── README.md               # Documentation
```

---

## 👨‍💻 Developer & Watermark

- **Creator & Maintainer**: **Pikuri** ([@Pikurii](https://github.com/Pikurii))
- **GitHub Profile**: [https://github.com/Pikurii](https://github.com/Pikurii)
- **Support & Sponsor**: [Ko-fi](https://ko-fi.com/pikuri) • [Trakteer](https://trakteer.id/Pikuri)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - Copyright (c) 2026 **Pikuri**.
