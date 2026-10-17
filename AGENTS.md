# 🤖 Omega — Agent Operating System & Repository Guidelines

Welcome to **Omega**. This document provides authoritative guidelines, architectural context, and development rules for AI coding agents operating on this repository.

---

## 🎯 1. Project Overview & Philosophy

**Omega** is a production-grade, offline-first multiplatform application unifying the **Wim Hof Method** with sacred geometry, 432Hz soundscapes, and advanced vitality tracking.

- **Stack**: React 19, TypeScript, Vite, Tailwind CSS / custom design tokens.
- **Targets**: Android (Capacitor 8), Desktop (Electron for macOS, Windows, Linux), and Modern Web (PWA).
- **Submodules**:
  - [`Bubble-Breathing`](https://github.com/marodriguezd/Bubble-Breathing): Rhythmic breathing, retention open stopwatch, and recovery breath holds.
  - [`Hydrocicle`](https://github.com/marodriguezd/Hydrocicle): Contrast shower protocols, 20-day cold challenge, and water temperature tracking.
- **Local Agent Context**: Stored in [`.agents/`](file:///.agents/) (gitignored; includes original prompts, test infra notes, and scratchpads).

---

## ⚡ 2. Rules of Engagement for Agents

1. **RTK Command Prefix**: Always prefix terminal commands with `rtk` (e.g. `rtk pnpm run test`, `rtk git status`).
2. **ADHD Output Style**:
   - Lead with the answer, command, path, or code snippet first.
   - Number multi-step work with one bounded action per step.
   - Conclude each response with one next action doable in under 2 minutes.
   - Cap lists to 5 items.
   - No conversational fluff, preamble, recaps, or sign-offs.
3. **Documentation & Comment Integrity**: Preserve existing comments, docstrings, and architectural rationale unless specifically asked to refactor them.
4. **Zero-Drift Architecture**: Any timer or interval must calculate elapsed time using monotonic timestamp deltas (`performance.now()`) to prevent cumulative background lag.
5. **GPU Acceleration**: Animations and visual transitions must strictly use `transform`, `opacity`, and `will-change`. Avoid layout thrashing (`width`, `height`, `margin`, `top`, or `box-shadow` animations).

---

## 🛠️ 3. Core Developer & Verification Commands

All changes must be verified against the test suites before completing a turn:

```bash
# Functional 4-Tier Test Suite (67 tests: Features, Boundaries, Combinations, Scenarios)
rtk pnpm run test

# Platform Suite (21 tests: Electron security, Capacitor config, Native APIs)
rtk node tests/runner-platform.js

# Release & Hardening Suite (40 tests: Metadata, Checksums, Tag guards, Manifests)
rtk node tests/runner-release.js

# Build & Validation
rtk node scripts/validate-build.mjs
rtk pnpm run build
rtk pnpm run android:sync
```

---

## 📁 4. Repository Structure

```text
Omega/
├── .agents/               # 🔒 Local agent memory, prompt history, scratchpads (GITIGNORED)
├── .github/workflows/     # CI/CD pipelines (android.yml, desktop.yml)
├── Bubble-Breathing/      # Git submodule: Breathwork engine
├── Hydrocicle/            # Git submodule: Cold exposure & contrast shower engine
├── android/               # Capacitor 8 native Android wrapper
├── electron/              # Electron desktop wrapper (main.cjs, preload.cjs)
├── public/                # Static assets, fonts (Outfit), soundscapes, web manifest
├── scripts/               # Build, icon generation, manifest, and checksum tools
├── src/                   # Core application source code
│   ├── components/        # Modals, navigation, charts, badge display
│   ├── hooks/             # Custom React hooks (useOmegaStats, useTranslation)
│   ├── platform/          # Native hardware abstraction (Haptics, KeepAwake)
│   ├── services/          # Audio engine (zenAudioService) and persistence
│   ├── store/             # Global state (omegaStore)
│   └── styles/            # Design tokens, themes, glassmorphism CSS
├── tests/                 # Automated test runners and suites
├── ABOUT.md               # User-facing project description and features
├── AGENTS.md              # 👈 You are here: agent instructions
├── README.md              # Project documentation and installation guides
└── package.json           # Single source of truth for versioning
```

---

## 🚀 5. Release & Versioning Protocol

- **Single Source of Truth**: `package.json` `"version"` (semver).
- **Android Version**: [`android/app/build.gradle`](file:///android/app/build.gradle) `versionName` **must** match `package.json`.
- **Git Tags**: Production releases trigger on `v*` tags (e.g. `v1.0.1`).
- **Concurrent CI Publishes**: Both `android.yml` and `desktop.yml` upload platform-scoped assets (`manifest-android.json`, `SHA256SUMS-android.txt` vs `manifest-*.json`, `SHA256SUMS-desktop.txt`) with race-safe clobbering to GitHub Releases.
- **Signing**: Secrets provide production keys (`ANDROID_KEYSTORE_BASE64`); dev/ephemeral keystores are used automatically when secrets are absent. Never commit private keys or `.jks` files.
