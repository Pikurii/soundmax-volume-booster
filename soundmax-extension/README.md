# 🔊 SoundMax - Tab Audio Booster & EQ (Manifest V3)

Ekstensi browser modern untuk Google Chrome, Microsoft Edge, Brave, dan Opera yang memungkinkan Anda mengontrol dan meningkatkan volume audio per-tab hingga **600%** (atau hingga **800%** dengan Turbo Mode), mengetikkan angka volume yang diinginkan secara langsung, mengatur **Professional 5-Band Studio Equalizer (60Hz, 250Hz, 1kHz, 4kHz, 12kHz)**, serta **menyimpan lebih dari satu Custom EQ Preset** dengan nama sendiri. 

Dilengkapi arsitektur **Zero-Leak & 0.0% Idle CPU** (*AudioContext suspension & Web Audio node deallocation*), **Dual View Mode (Mini & Studio)**, serta kualitas suara mastering studio anti-kresek (*anti-clipping limiter & soft-clipper*).

---

## ✨ Fitur & Keunggulan Utama

- **📐 Dual View Mode (Mode Minimalis & Mode Studio)**:
  - **Mini Mode (Compact)**: Tampilan super ringkas berukuran ~250px × 95px khusus untuk quick volume slider, tombol Turn Off / On, tombol Reset 100%, dan tombol beralih cepat ke Mode Studio.
  - **Studio Mode (Full)**: Tampilan lengkap dengan 5-band studio equalizer mixer, visualizer, quick boost buttons, dan pemilih tab audio aktif.
- **🖱️ Kontrol Volume dengan Scroll Roda Mouse**:
  - Cukup arahkan kursor ke area volume slider lalu scroll roda mouse untuk menaikkan/menurunkan volume secara instan.
  - Bebas macet: scroll alami halaman dan mixer equalizer tetap berjalan lancar saat kursor tidak berada di atas slider volume. Dapat dinyalakan/dimatikan di menu Pengaturan.
- **🛡️ Smart Limiter & Anti-Distorsi Multi-Stage**:
  - Dilengkapi `DynamicsCompressorNode` (-1.5 dBFS) dan `WaveShaperNode` kurva linear analog soft-clipping tape saturation.
  - Suara tetap 100% jernih dan bebas kresek (*kemresek / distorsi pecah*) bahkan saat di-boost hingga 600% - 800%.
- **⌨️ Ketik Angka Volume Langsung (Editable Number Input)**:
  - Ketikkan angka persentase volume yang Anda inginkan (misal: `125`, `275`, `450`, `600`) pada kotak input di samping slider atau tekan `Enter`.
- **🎛️ Professional 5-Band Studio Parametric Equalizer**:
  - **60 Hz (Sub-Bass)**: Dentuman sub-bass, kick drum, dan getaran bioskop.
  - **250 Hz (Bass)**: Kehangatan melodi bas, ketukan nada, dan bodi vokal.
  - **1 kHz (Mid)**: Inti kejelasan vokal manusia, podcast dialog, dan instrumen.
  - **4 kHz (Presence)**: Artikulasi pengucapan vokal, anime seiyuu, dan dialog film.
  - **12 kHz (Treble / Air)**: Kecerahan akustik, desah udara, cymbals, dan detail jernih.
- **💾 Simpan Lebih dari Satu Custom Preset EQ**:
  - Bebas mengatur 5 slider frekuensi lalu simpan dengan nama sendiri (*Anime Vocal Mode*, *EDM Bass*, *Podcast Enak*). Tersimpan permanen di penyimpanan browser.
- **🌐 Bilingual Localization (Bahasa Indonesia & English)**:
  - Tombol ganti bahasa instan (`ID` / `EN`) di pojok atas serta preferensi bahasa tersimpan otomatis.
- **📑 Tab Audio Manager**:
  - Memindai tab browser yang sedang memutar suara secara real-time dan berpindah tab hanya dengan satu klik.
- **🌓 Dark Mode & Light Mode**:
  - Desain glassmorphism gelap modern serta opsi mode terang yang nyaman di mata.

---

## ⚡ Optimalisasi Performa & Jaminan Bebas RAM/CPU Leak (0.0% Idle CPU)

Ekstensi ini dirancang dengan standar performa ketat Manifest V3 untuk memastikan tidak ada pemborosan daya baterai, lonjakan CPU, atau memory leak:

1. **0.0% Idle CPU Guarantee (AudioContext Auto-Suspend)**:
   - Pada browser Chromium, `AudioContext` yang dibiarkan dalam kondisi *running* akan memutar thread audio real-time secara terus-menerus (mengonsumsi ~1-2% CPU meskipun tidak ada suara).
   - SoundMax secara otomatis memanggil `AudioContext.suspend()` ketika tab tidak di-boost atau capture dihentikan. CPU langsung turun ke **0.0%**.
2. **Pembersihan Node Audio Total (Zero Web Audio Memory Leak)**:
   - Ketika tab ditutup atau capture berhenti, seluruh node pemrosesan audio (`source`, 5 biquad filters, `gainNode`, `compressor`, `softClipper`, `outputGain`) diputus hubungannya (`.disconnect()`), semua stream track dimatikan (`.stop()`), dan referensi variabel di-null-kan agar Garbage Collector V8 segera mereklamasi memori RAM.
3. **Pembersihan Siklus Hidup Ekstensi**:
   - Deteksi tab yang tertutup (`chrome.tabs.onRemoved`) dan tab yang digantikan (`chrome.tabs.onReplaced`) secara otomatis membersihkan memori internal `tabStates`.
   - Timer interval pada popup diputus secara bersih saat popup ditutup (`pagehide` & `beforeunload`).
4. **Bebas Kode Berbahaya / Bebas Mining**:
   - 100% kode JavaScript lokal tanpa `eval()`, tanpa `new Function()`, tanpa `fetch` remote ke server asing, dan tanpa library pihak ketiga yang mencurigakan.
   - Hak akses (*permissions*) minimal: hanya `tabCapture`, `offscreen`, `tabs`, `storage`, dan `activeTab`. Tidak memerlukan izin luas `<all_urls>`.

---

## 📁 Struktur Direktori Proyek

```text
Volume Setting Extension/
├── manifest.json            # Konfigurasi SoundMax Manifest V3
├── background.js           # Service Worker (manajemen state, muting sync & badge tab)
├── offscreen/
│   ├── offscreen.html      # Host DOM Web Audio API di Manifest V3
│   └── offscreen.js        # Engine Web Audio Capture + 5-Band EQ + Smart Limiter
├── popup/
│   ├── popup.html          # UI Popup (Dual Mode: Studio & Mini, 5-Band EQ, Modals)
│   ├── popup.css           # Styling modern glassmorphism (Dark & Light theme)
│   └── popup.js            # Controller UI, audio state sync, custom preset manager
├── icons/                  # Ikon ekstensi resolusi lengkap (16, 32, 48, 128 px)
├── test-page/
│   └── test.html           # Audio test bench mandiri untuk pengetesan lokal
├── preview.html            # Simulasi browser interaktif
├── .gitignore              # Konfigurasi git ignore bersih
└── README.md               # Dokumentasi lengkap
```

---

## 🚀 Panduan Upload ke GitHub & Chrome Web Store

### 1. Upload ke GitHub
```bash
git init
git add .
git commit -m "Initial commit: SoundMax Extension v1.1.0 by Pikuri"
git branch -M main
git remote add origin https://github.com/Pikurii/soundmax-volume-booster.git
git push -u origin main
```

### 2. Upload ke Google Chrome Web Store
1. Siapkan file arsip `.zip` yang berisi folder proyek (jangan menyertakan folder `.git`):
   - Masukkan file: `manifest.json`, `background.js`, folder `offscreen/`, folder `popup/`, dan folder `icons/`.
2. Buka [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Klik **New Item** dan upload file `soundmax-extension.zip`.
4. Isi deskripsi ekstensi, unggah tangkapan layar (screenshot), dan submit untuk proses peninjauan (biasanya memakan waktu 1–3 hari kerja).

---

## 👨‍💻 Developer & Watermark

- **Creator**: **Pikuri** ([@Pikurii](https://github.com/Pikurii))
- **GitHub Profile**: [https://github.com/Pikurii](https://github.com/Pikurii)
- **Support & Sponsor**: [Ko-fi](https://ko-fi.com/pikuri) • [Trakteer](https://trakteer.id/Pikuri)

---

## 📄 Lisensi
Hak Cipta (c) 2026 Pikuri. Dilisensikan di bawah lisensi MIT.
