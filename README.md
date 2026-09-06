# 🌌 Omega - Wellness Hub for Android

<div align="center">
  <img src="public/assets/icon.svg" alt="Omega Logo" width="128" height="128">
  <h3>Unified Wellness & Vitality Hub for Android</h3>

  [![Build & Release Android APK](https://github.com/marodriguezd/Omega/actions/workflows/android.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/android.yml)
  [![Latest Release](https://img.shields.io/github/v/release/marodriguezd/Omega?color=4ca1af&label=Android%20APK)](https://github.com/marodriguezd/Omega/releases/latest)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Made With](https://img.shields.io/badge/Made%20With-React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

  [Overview](#-overview) • [Download APK](#-download--install-on-android) • [Features](#-features) • [Ecosystem](#-integrated-apps) • [Development](#-local-development) • [License](#-license)

  **[🇪🇸 Leer en Español](README.es.md)**
</div>

---

## 🌟 Overview

**Omega** is a native Android mobile application and unified hub built with **Capacitor 8**, **React 19**, and **Vite**. It seamlessly combines two dedicated wellness tools into a single, cohesive experience with shared routines, streaks, and metrics:

1. 🌬️ **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)**: Guided rhythmic deep breathing and conscious breath-holding cycles (Wim Hof inspired).
2. ❄️ **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)**: Immersive guided contrast therapy (hot/cold intervals) and cold exposure timer.

---

## 📱 Download & Install on Android

You can download the pre-compiled Android APK directly from GitHub Releases:

👉 **[Download Omega.apk (Latest Version)](https://github.com/marodriguezd/Omega/releases/latest/download/Omega.apk)**

### Installation Steps:
1. Open the link above in your Android browser and download `Omega.apk`.
2. Tap the download notification or locate the file in your device's **Downloads** folder.
3. If prompted by Android, enable **"Allow from this source"** for your browser or file manager.
4. Tap **Install** and launch Omega!

---

## ✨ Features

- **Unified Wellness Dashboard**:
  - 🔥 **Active Combined Streak**: Tracks consecutive daily practice across both breathing and cold exposure habits.
  - 🎯 **Daily Routine Tracker**: Interactive status to complete both morning and evening routines.
  - ⚡ **Quick Start Cards**: Launch breathing or shower sessions with a single tap.
  - 📊 **Aggregated Analytics**: Total sessions, cumulative breath-hold time, and total cold exposure.
  - 🕒 **Recent Activity Feed**: Chronological timeline combining sessions from both apps.
- **Fluid Mobile Navigation**: Fixed bottom navigation bar (*BottomNav*) for zero-reload switching between the Hub, Bubble Breathing, and HydroCycle.
- **Screen Keep Awake**: Keeps your mobile display active during breath-hold phases and shower sessions so your screen never turns off mid-exercise.
- **Hardware Back Button Handling**: Native Android back gesture / button integration with an exit-confirmation modal when a session is in progress.
- **Glassmorphic UI Design**: Elegant glass-like aesthetics with animated gradient backgrounds, supporting both **Dark Mode** and **Light Mode**.
- **Multilingual Support (7 Languages)**: Synchronized across the entire hub in English, Spanish, French, German, Italian, Portuguese, and Simplified Chinese.

---

## 🧩 Integrated Apps

| App | Focus | Highlights |
| :--- | :--- | :--- |
| **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)** | Breathwork & Apnea | Rhythmic pace control, breath retention stopwatch, recovery timer, visual breath bubbles, soundscapes. |
| **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)** | Contrast Therapy | Hot/cold interval cycles, temperature color transitions, customizable presets, cold shock mode. |

---

## 🛠️ Architecture & Tech Stack

- **Monorepo Structure**: Managed with **PNPM Workspaces** and **Git Submodules**, keeping `Bubble-Breathing` and `Hydrocicle` synchronized with their upstream repositories.
- **Capacitor 8 Android**: Native wrapper generating the standard Android Gradle project in `android/` (`com.marodriguezd.omega`).
- **Automated CI/CD**: GitHub Actions workflow ([`.github/workflows/android.yml`](.github/workflows/android.yml)) with OpenJDK 21, Android SDK, and Gradle to automatically build and release `Omega.apk` on every update.

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

### Web Development Server
```bash
pnpm dev
```

### Build & Sync with Android
```bash
pnpm run build
npx cap sync android
```

### Open in Android Studio
```bash
npx cap open android
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
