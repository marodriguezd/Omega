# 🌌 Omega - Wim Hof Method Suite & Vitality Hub for Android

<div align="center">
  <img src="public/assets/icon.svg" alt="Omega Logo" width="128" height="128">
  <h3>Complete Wim Hof Breathwork, Cold Exposure & Vitality Suite for Android</h3>

  [![Build & Release Android APK](https://github.com/marodriguezd/Omega/actions/workflows/android.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/android.yml)
  [![Latest Release](https://img.shields.io/github/v/release/marodriguezd/Omega?color=4ca1af&label=Android%20APK)](https://github.com/marodriguezd/Omega/releases/latest)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Made With](https://img.shields.io/badge/Made%20With-React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

  [Overview](#-overview) • [Download APK](#-download--install-on-android) • [Features](#-features) • [5-Tab Architecture](#-5-tab-suite-architecture) • [Development](#-local-development) • [License](#-license)

  **[🇪🇸 Leer en Español](README.es.md)**
</div>

---

## 🌟 Overview

**Omega v1.0** is a 100% Free & Open Source native Android app and unified wellness hub built with **Capacitor 8**, **React 19**, and **Vite**. Inspired by the **Wim Hof Method**, Omega delivers a privacy-first, zero-telemetry experience combining guided conscious breathwork, progressive cold exposure, retention push-up challenges, and gamified progress tracking.

1. 🌬️ **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)**: Guided rhythmic deep breathing, empty lung retention stopwatch, and recovery breathing with sacred rounded hexagon geometry.
2. ❄️ **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)**: Immersive contrast therapy (hot/cold intervals), free cold shower timer, and ice plunge assistant.
3. 🧊 **20-Day Cold Shower Challenge**: 4 progressive weeks (15s to 60s) with 432Hz Tibetan singing bowl cues.
4. 💪 **Apnea Push-Up Test**: Wim Hof retention push-up counter and retention stopwatch.
5. 📊 **Vitality & Progress Screen**: 28-day activity heatmap, 10 unlockable hexagonal badges, and offline JSON backup/restore.

---

## 📱 Download & Install on Android

You can download the pre-compiled Android APK directly from GitHub Releases:

👉 **[Download Omega.apk (v1.0.0)](https://github.com/marodriguezd/Omega/releases/latest/download/Omega.apk)**

### Installation Steps:
1. Open the link above in your Android browser and download `Omega.apk`.
2. Tap the download notification or locate the file in your device's **Downloads** folder.
3. If prompted by Android, enable **"Allow from this source"** for your browser or file manager.
4. Tap **Install** and launch Omega!

---

## ✨ Features

- **Wim Hof Sacred Geometry & Audio**:
  - 🔷 **Rounded Hexagon Geometry**: Custom SVG (`R=86, cr=14`) breathing sphere with continuous perimeter ring (`pathLength="100"`), glassmorphism sheen, and outer halos.
  - 🎵 **432Hz Harmonic Synthesizer**: Web Audio engine featuring Tibetan singing bowls, meditation bells, and native tactile vibration cues.
- **20-Day Cold Shower Adaptation Challenge**:
  - 4 progressive weeks (15s, 30s, 45s, 60s) with daily calendar verification.
  - Visual guidance for the **Horse Stance** (*Kiba Dachi*) to warm the core without shivering.
- **Apnea Push-Up Challenge**:
  - Built-in retention timer and tap counter to measure physical endurance on empty lungs.
- **Gamified Progress & Badges**:
  - 28-day vitality heatmap and 10 collectible hexagonal badges (First Breath, Fire Week, Ice Master, etc.).
- **Privacy & Offline First**:
  - 100% offline. Zero telemetry, no cloud accounts, no ads, and full JSON backup export/import.
- **Fluid Multi-Layout Navigation**:
  - Fixed 5-tab bottom navigation on mobile (`<768px`) and Navigation Rail on tablets/desktop (`>=768px`).
  - Screen Keep-Awake prevents mobile display sleep during retention and showers.
  - Hardware back-button interceptor with accidental exit protection.
- **Multilingual Support (7 Languages)**:
  - English, Spanish, French, German, Italian, Portuguese, and Simplified Chinese.

---

## 🧩 5-Tab Suite Architecture

| Tab | Feature | Highlights |
| :--- | :--- | :--- |
| **Inicio (Hub)** | Overview & Routines | Combined daily streak, quick start actions, routine checklist, and aggregated metrics. |
| **Respiración** | Bubble Breathing | Rhythmic hyperventilation, empty lung retention stopwatch, and 15s recovery breath hold. |
| **Frío** | HydroCycle & Exposure | Hot/cold interval cycles, free cold shower mode, ice plunge guidance, and 432Hz acoustic cues. |
| **Desafíos** | 20-Day Challenge & Push-Ups | 4-week cold adaptation schedule and apnea push-up counter. |
| **Progreso** | Vitality Dashboard | 28-day heatmap, 10 hexagonal badges, and JSON backup/restore. |

---

## 🛠️ Architecture & Tech Stack

- **Monorepo Structure**: Managed with **PNPM Workspaces** and **Git Submodules**, synchronizing `Bubble-Breathing` and `Hydrocicle`.
- **Capacitor 8 Android**: Native wrapper generating the standard Android Gradle project in `android/` (`com.marodriguezd.omega`).
- **Automated CI/CD**: GitHub Actions workflow ([`.github/workflows/android.yml`](.github/workflows/android.yml)) with OpenJDK 21, Android SDK, and Gradle to automatically build, test, and release `Omega.apk`.

---

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)
- [Android Studio](https://developer.android.com/studio) (optional, for native debugging)

### Clone with Submodules
```bash
git clone --recursive https://github.com/marodriguezd/Omega.git
cd Omega
```

### Install Dependencies
```bash
pnpm install --dangerously-allow-all-builds
```

### Run Tests
```bash
pnpm test
```

### Web Development Server
```bash
pnpm dev
```

### Build & Sync with Android
```bash
pnpm run build
pnpm exec cap sync android
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
