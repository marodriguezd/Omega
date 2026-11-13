# 🌌 Omega - Conscious Breathwork & Cold Adaptation Hub

<div align="center">
  <img src="public/assets/icon.svg" alt="Omega Logo" width="128" height="128">
  <h3>Open Source Multiplatform Vitality & Breathwork Suite for Android, Windows, macOS & Linux</h3>

  [![Build & Release Android APK](https://github.com/marodriguezd/Omega/actions/workflows/android.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/android.yml)
  [![Build & Release Desktop](https://github.com/marodriguezd/Omega/actions/workflows/desktop.yml/badge.svg)](https://github.com/marodriguezd/Omega/actions/workflows/desktop.yml)
  [![Latest Release](https://img.shields.io/github/v/release/marodriguezd/Omega?color=4ca1af&label=Release)](https://github.com/marodriguezd/Omega/releases/latest)
  [![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
  [![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
  [![Made With](https://img.shields.io/badge/Made%20With-React%2019%20%2B%20Vite%20%2B%20TS-61DAFB?logo=react&logoColor=white)](https://react.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

  [Overview](#-overview) • [Downloads](#-multiplatform-downloads-v100) • [Features](#-features) • [Architecture](#-architecture--tech-stack) • [Legal Notice](#%EF%B8%8F-legal-notice--trademark-disclaimer) • [License](#-license)

  **[🇪🇸 Leer en Español](README.es.md)**
</div>

---

## 🌟 Overview

**Omega v1.0.0** is an independent, 100% Free and Open Source production-grade vitality and wellness application available natively across **Android**, **Windows**, **macOS**, and **Linux**. Inspired by the Wim Hof Method, sacred geometry, and 432Hz harmonic acoustic tuning, Omega delivers an offline-first, zero-telemetry private sanctuary combining:

1. 🌬️ **[Bubble Breathing](https://github.com/marodriguezd/Bubble-Breathing)**: Rhythmic deep breathing with multi-layer concentric ripple hexagons, retention apnea open stopwatch, personal best tracking, and recovery breath holds.
2. 🧊 **[HydroCycle](https://github.com/marodriguezd/Hydrocicle)**: Contrast therapy (hot/cold intervals), cold shower tracking, water temperature logging (°C / °F), and ice plunge guidance.
3. ❄️ **20-Day Cold Shower Challenge**: 4-week progressive cold adaptation protocol (15s, 30s, 45s, 60s) with 432Hz Tibetan bowl chimes and calendar streak tracking.
4. 💪 **Apnea Push-Up Test**: Measure muscular endurance and oxygen efficiency during empty-lung retention with zero-lag delta timestamp timers.
5. 📊 **Vitality & Progress Dashboard**: 28-day calendar heatmap with monthly adherence overview, 10 collectible hexagonal achievement badges with live progress bars, and offline JSON backup/restore.

---

## 🚀 Multiplatform Downloads (v1.0.0)

Pre-compiled native binaries for all major platforms are built and published automatically via GitHub Actions:

| Platform | Package Format | Direct Download Link |
| :--- | :--- | :--- |
| **Android** | APK (Capacitor 8) | 👉 **[Download Omega-1.0.0.apk](https://github.com/marodriguezd/Omega/releases/download/v1.0.0/Omega-1.0.0.apk)** |
| **macOS** | DMG (Apple Silicon & Intel) | 👉 **[Download Omega-1.0.0.dmg](https://github.com/marodriguezd/Omega/releases/download/v1.0.0/Omega-1.0.0.dmg)** |
| **Windows** | MSI Installer | 👉 **[Download Omega-1.0.0.msi](https://github.com/marodriguezd/Omega/releases/download/v1.0.0/Omega-1.0.0.msi)** |
| **Linux** | Universal AppImage | 👉 **[Download Omega-1.0.0.AppImage](https://github.com/marodriguezd/Omega/releases/download/v1.0.0/Omega-1.0.0.AppImage)** |

> **Verification**: Checksums are provided for every artifact. Verify Android downloads with `sha256sum -c SHA256SUMS-android.txt` and desktop binaries with `sha256sum -c SHA256SUMS-desktop.txt`.

---

## ✨ Key Features

- **Multiplatform & Responsive**:
  - Seamless layout adapts from mobile touch screens (safe-area insets, 5-tab bottom navigation, haptics) to desktop ultrawide monitors (Navigation Rail, multi-column dashboard, scalable UI factor).
- **Sacred Geometry & 432Hz Soundscapes**:
  - Continuous curvature rounded hexagon visualizer with multi-ring ripple animations and live phase indicators (`Inhale • Hold • Exhale`).
  - Native Web Audio synthesizer generating 432Hz Tibetan singing bowls and meditation chimes without external network requests or audio assets.
- **Multilingual Support (7 Languages)**:
  - English 🇬🇧, Spanish 🇪🇸, French 🇫🇷, German 🇩🇪, Italian 🇮🇹, Portuguese 🇵🇹, and Simplified Chinese 🇨🇳.
- **Privacy & 100% Offline-First**:
  - No cloud accounts, zero telemetry, no third-party analytics, and bundled local typography (Outfit). Full JSON export/import for complete user data sovereignty.
- **Native Hardware Integration**:
  - Automatic screen wake lock (`KeepAwake` on Android / `powerSaveBlocker` on desktop) prevents screen dimming during breath retention and showers.
  - Hardware back-button routing with safety exit confirmation modals to protect active timers.

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

## ⚖️ Legal Notice & Trademark Disclaimer

- **Independent Project**: Omega is an independent open-source project and is **not affiliated, associated, authorized, endorsed by, or in any way officially connected** with Wim Hof, Innerfire B.V., or any of their subsidiaries or affiliates.
- **Nominative Fair Use**: Any references to the "Wim Hof Method", "Wim Hof", or related terminology are used solely for descriptive, informational, and historical nominative fair use purposes to describe traditional breathwork and cold exposure techniques.
- **Health & Safety Advisory**: Deep breathing with retention and extreme cold exposure induce powerful physiological effects. Never practice breath retention or hyperventilation in water, while driving, standing up, or operating machinery. Never practice cold immersion alone in open water; exit the cold and breathe normally if you feel dizzy, numb, or unwell. Consult a physician prior to practicing if you have cardiovascular conditions, epilepsy, or are pregnant. These techniques are not medical treatment.

---

## 🛠️ Architecture & Tech Stack

- **Monorepo Structure**: Managed with **PNPM Workspaces** and **Git Submodules**, synchronizing `Bubble-Breathing` and `Hydrocicle`.
- **One shared React/Vite layer**: `src/` stays platform-agnostic. All native differences live in the small explicit adapter `src/platform/` (`runtime`, `storage`, `keepAwake`, `haptics`, `lifecycle`). `src/services/nativeService.ts` is a thin backward-compatible facade over it — no duplicated business logic.
- **Capacitor 8 Android**: Native wrapper generating the standard Android Gradle project in `android/` (`com.marodriguezd.omega`).
- **Electron desktop (macOS / Windows / Linux)**: Secure defaults (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, no `webviewTag`, no insecure content), preload-only allowlisted bridge (`window.electronAPI`: `isElectron`, `platform`, `setKeepAwake`), strictly validated boolean IPC (`omega:set-keep-awake` + legacy aliases), navigation locked to the bundled app (popups denied, external `https://` opens in OS browser, all permissions denied, devtools gated on unpackaged runs), `powerSaveBlocker` for keep-awake. Packaged with `electron-builder` as DMG / MSI / AppImage with native `.icns` / `.ico` / PNG icons.
- **Automated CI/CD**: [`android.yml`](.github/workflows/android.yml) builds the release APK on `ubuntu-latest`; [`desktop.yml`](.github/workflows/desktop.yml) builds DMG on `macos-latest`, MSI on `windows-latest`, and AppImage on `ubuntu-latest`. No cross-compilation.

### Platform compatibility matrix

| Capability | Android (Capacitor 8) | macOS (Electron) | Windows (Electron) | Linux (Electron) | Web fallback |
|---|---|---|---|---|---|
| App ID | `com.marodriguezd.omega` | `com.marodriguezd.omega` | `com.marodriguezd.omega` | `com.marodriguezd.omega` | n/a |
| Keep screen awake | KeepAwake plugin | `powerSaveBlocker` via IPC | `powerSaveBlocker` via IPC | `powerSaveBlocker` via IPC | Screen Wake Lock API |
| Haptics | `@capacitor/haptics` | safe no-op | safe no-op | safe no-op | `navigator.vibrate` |
| Back navigation | `App.backButton` → exit/modal | in-app React state | in-app React state | in-app React state | browser history |
| Storage | `localStorage` (WebView) | `localStorage` (renderer) | `localStorage` (renderer) | `localStorage` (renderer) | `localStorage` (+ memory fallback) |
| Audio | Web Audio | Web Audio | Web Audio | Web Audio | Web Audio |
| Safe areas | `viewport-fit=cover` + `env()` | window chrome native | window chrome native | window chrome native | `env()` |
| Offline | 100% offline (bundled Outfit woff2) | 100% offline (bundled Outfit woff2) | 100% offline (bundled Outfit woff2) | 100% offline (bundled Outfit woff2) | 100% offline |
| Artifact | `Omega-<version>.apk` | `Omega-<version>.dmg` | `Omega-<version>.msi` | `Omega-<version>.AppImage` | `dist/` |

### Commands

```bash
pnpm dev              # web development (Vite)
pnpm build            # TypeScript + Vite production build → dist/
pnpm test             # 4-tier suite (56 tests)
pnpm run test:platform# platform suite (21 tests: abstraction, Electron, packaging, matrix)
pnpm run test:release # release suite (40 tests: metadata, security, icons, checksums, CI)
pnpm run validate     # fail-fast packaging validator (targets, security, configs)
pnpm run icons        # regenerate native icons from public/assets/icon.png
pnpm run release:meta # print deterministic artifact names for package.json version
pnpm run checksums    # SHA-256 manifest for ./release (usage: pnpm run checksums -- <dir>)
pnpm run electron:dev # desktop development (Vite + Electron)
pnpm run electron:pack# unpacked desktop build (no installer)
pnpm run dist:mac     # → Omega-<version>.dmg (run on macOS)
pnpm run dist:win     # → Omega-<version>.msi (run on Windows)
pnpm run dist:linux   # → Omega-<version>.AppImage (run on Linux)
pnpm run android:sync # build web + cap sync android
pnpm run android:build# assemble release APK via Gradle
```

### Release flow (`v*` tags)

1. Tag must match the version: `node scripts/release-meta.mjs --tag=v1.0.0` fails CI otherwise (`package.json` is the single source of truth).
2. Each job runs the full gate: `build` → 4-tier tests (56) → platform tests (21) → release tests (40) → `validate`.
3. `android.yml` (ubuntu): syncs Capacitor, assembles the APK, writes `Omega.apk` + `Omega-<version>.apk` + `SHA256SUMS-android.txt` + `manifest-android.json`. Only `v*` tag runs publish to GitHub Releases (`v*` tags require the `ANDROID_KEYSTORE_BASE64` secret); branch builds upload the APK as a CI workflow artifact for testing and never touch a Release.
4. `desktop.yml`: three native jobs package DMG / MSI / AppImage, each with its own `SHA256SUMS.txt` + `manifest.json` workflow artifact. On tags, `release-desktop` verifies every expected artifact exists, assembles a clean allowlisted payload (`*.dmg`, `*.msi`, `*.AppImage`, `manifest-*.json`, `SHA256SUMS-desktop.txt`), and uploads exactly those files to the GitHub Release. Both workflows share one race-safe strategy (reuse-or-create with clobber-upload fallback, never delete), and platform-scoped checksum/manifest names keep concurrent publishes from overwriting each other.
5. Verify downloads per platform: `sha256sum -c SHA256SUMS-android.txt` (APK) and `sha256sum -c SHA256SUMS-desktop.txt` (desktop). Each manifest entry records version, commit, platform, filename, SHA-256, signing status, and build timestamp.

### Signing: unsigned by default, opt-in

All artifacts build and run **unsigned** with no secrets configured, and CI reports it explicitly per job. To ship signed builds, configure the secrets documented in [`docs/SIGNING.md`](docs/SIGNING.md):

| Platform | Secrets | Effect when absent |
|---|---|---|
| macOS | `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD` (+ `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` for notarization) | unsigned DMG |
| Windows | `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD` | unsigned MSI (SmartScreen warns — expected) |
| Android | `ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` (mandatory for `v*` tags) | ephemeral dev-keystore APK on branch builds (never released) |
| Linux | — | AppImage ships unsigned by design; verify via checksums |

### Branding source of truth

`public/assets/icon.png` (512×512) is the single authoritative artwork. `pnpm run icons` deterministically generates `build/icon.icns` (macOS), `build/icon.ico` (Windows, 7 sizes), and the `build/icons/` PNG set (Linux). Android adaptive launcher icons live in `android/app/src/main/res/mipmap-*/`.

### Offline guarantee

Outfit (variable wght 100–900, latin + latin-ext) is bundled in `src/assets/fonts/` and emitted into `dist/assets/` with relative URLs — every target renders identically with no network. No remote stylesheets remain. The system stack in `--omega-font-family` is the deterministic fallback.

### Limitations

- Release artifacts are **unsigned** unless the secrets in [`docs/SIGNING.md`](docs/SIGNING.md) are configured.
- The repository contains **no production signing credentials** (enforced by tests `R17`/`R18`). A historical dev keystore was removed from version control without history rewriting — see [`docs/SIGNING.md`](docs/SIGNING.md); never use it for production.
- Windows MSI requires WiX tooling on the runner (handled automatically in CI; local Windows builds need WiX installed).
- macOS unsigned DMGs need right-click → Open on first launch (Gatekeeper).

---

## 💻 Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)

### Clone & Run
```bash
git clone --recursive https://github.com/marodriguezd/Omega.git
cd Omega
pnpm install
pnpm test
pnpm dev
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
