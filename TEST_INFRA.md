# Omega Testing Infrastructure (`TEST_INFRA.md`)

## 1. Overview & Architectural Philosophy

The Omega testing infrastructure provides a robust, self-contained, and completely automated test framework. It evaluates the Omega platform from the outside against authoritative functional and non-functional specifications defined in `ORIGINAL_REQUEST.md`.

Three suites, one runner convention each:

- **4-tier functional suite** (`tests/runner.js`, `pnpm run test`): 56 tests.
- **Platform suite** (`tests/runner-platform.js`, `pnpm run test:platform`): 21 tests.
- **Release-hardening suite** (`tests/runner-release.js`, `pnpm run test:release`): 40 tests.

### Core Highlights:
- **Zero Heavy Binary Overhead**: Built directly upon Node's native `node:test`, `node:assert`, and standard ESM. No fragile, memory-heavy headless browser binaries or external daemon dependencies required.
- **Lightweight High-Fidelity Shims**: Simulates browser windowing, custom events, `localStorage`, `navigator.wakeLock`, and `navigator.vibrate` with isolated per-test teardown via `tests/helpers/dom-shim.js`.
- **Authoritative CSS & AST Inspection**: Direct filesystem and CSS custom property parsing (`parseCssVariables`, `parseKeyframes`, `parseMediaQueries`) to ensure compliance with Wim Hof design tokens, GPU acceleration flags, responsive layout breakpoints, and cross-platform configuration.
- **Static CI auditing**: The platform and release suites additionally assert on workflow files, scripts, and packaging configuration (tag gates, signing guards, checksums, allowlisted payloads).

---

## 2. Directory Layout

All test suites and harnesses are colocated in the root `tests/` directory:

```
tests/
├── runner.js                             # 4-tier master runner with formatted reporting
├── runner-platform.js                    # Platform suite runner
├── runner-release.js                     # Release-hardening suite runner
├── helpers/
│   ├── dom-shim.js                       # Lightweight DOM tree, localStorage, and event bus shim
│   └── test-utils.js                     # Project file reader, CSS parser, WCAG contrast calculator
├── tier1-features/
│   ├── r1-design-tokens.test.js          # Tier 1: R1 Tokens, Wim Hof palette, squircles, glassmorphism
│   ├── r2-gpu-performance.test.js        # Tier 1: R2 GPU acceleration, 90/120Hz, progress bars, keyframes
│   ├── r3-adaptive-layout.test.js        # Tier 1: R3 Responsive <768px Mobile vs >=768px Desktop Rail
│   └── r4-multiplatform.test.js          # Tier 1: R4 Multi-platform, vite base, electron, capacitor, native bridge
├── tier2-boundaries/
│   ├── r1-design-boundaries.test.js      # Tier 2: R1 Extreme zoom, clamp limits, contrast ratios, missing tokens
│   ├── r2-perf-boundaries.test.js        # Tier 2: R2 Extreme FPS deltas, timer drift correction, rapid switching
│   ├── r3-layout-boundaries.test.js      # Tier 2: R3 Breakpoint 767/768px, ultra-wide/narrow, extreme safe-areas
│   └── r4-platform-boundaries.test.js    # Tier 2: R4 API errors, corrupted storage, extreme streaks, quota full
├── tier3-combinations/
│   └── cross-feature.test.js             # Tier 3: Pairwise combinations (Tab switch during active exercise, etc.)
├── tier4-scenarios/
│   ├── e2e-scenarios.test.js             # Tier 4: Full realistic user journeys (Breathing, Hydro, Desktop, Mobile, Sync)
│   └── wim-hof-suite.test.js             # Tier 4: Challenge schedule, apnea push-ups, badges, backup, legacy keys
├── platform/
│   ├── platform-abstraction.test.js      # Platform runtime/storage/keep-awake/haptics/lifecycle abstraction
│   ├── electron-security.test.js         # Electron main/preload security surface
│   ├── packaging-config.test.js          # electron-builder targets, scripts, Capacitor, publish safety
│   └── cross-platform-matrix.test.js     # Capability matrix across Android/macOS/Windows/Linux/web
└── release/
    ├── release-metadata.test.js          # R1-R4, R31, R35: version truth, links, third-party notices
    ├── electron-production.test.js       # R5-R8: production Electron security
    ├── icons-offline.test.js             # R9-R12: native icons, bundled fonts
    ├── ci-signing-checksums.test.js      # R13-R16: checksums, signing optionality, CI integrity
    ├── release-cleanliness.test.js       # R17-R23: credentials, manifests, allowlisted payload
    ├── tag-apk-guard.test.js             # R24-R30, R32-R34: tag guards, shared-release safety
    └── release-race.test.js              # R36-R40: race-safe publication, lockfile CI, least privilege, hygiene
```

---

## 3. How to Run the Tests

### 3.1 Standard Execution

```bash
pnpm run test           # 4-tier functional suite (56 tests, strict)
pnpm run test:platform  # platform suite (21 tests)
pnpm run test:release   # release-hardening suite (40 tests)
```

### 3.2 Baseline / Diagnostic Mode

`tests/runner.js --baseline` re-runs the 4-tier suite without failing on
pending items. No pending items remain; strict mode is the release gate.

### 3.3 Individual Tier or File Execution

```bash
# Run single file
node --test tests/tier1-features/r1-design-tokens.test.js

# Run all Tier 1 feature tests
node --test tests/tier1-features/*.test.js

# Run all Tier 2 boundary tests
node --test tests/tier2-boundaries/*.test.js

# Run Tier 3 cross-feature combinations
node --test tests/tier3-combinations/*.test.js

# Run Tier 4 real-world user scenarios
node --test tests/tier4-scenarios/*.test.js

# Run all tests across all tiers
node --test tests/**/*.test.js
```

---

## 4. Test Suite Composition & Coverage Map

| Tier | Category | Scope | Count | Status |
|---|---|---|:---:|---|
| **Tier 1** | Feature Coverage | Primary happy-path contracts for R1, R2, R3, R4 | 20 | All pass |
| **Tier 2** | Boundary & Corner Cases | Extreme values, clamping, WCAG contrast, timer drift, safe-area limits | 20 | All pass |
| **Tier 3** | Cross-Feature Combinations | Pairwise interaction matrices (active session protection, zoom + squircle, storage sync) | 6 | All pass |
| **Tier 4** | Real-World Application Scenarios | End-to-end user journeys (breathing, cold exposure, challenge, badges, backup, desktop, mobile, i18n) | 10 | All pass |
| **Total functional** | **Comprehensive Suite** | **Complete coverage across R1-R4** | **56** | **56/56 pass** |
| **Platform** | Abstraction & packaging | Runtime, storage, keep-awake, haptics, lifecycle, Electron security, builder config, matrix | 21 | 21/21 pass |
| **Release-hardening** | Release safety | Metadata, icons, checksums, signing, tag guards, race-safe publication | 40 | 40/40 pass |

---

## 5. Shimming Strategy & Environmental Isolation

1. **Independent Test Execution**: Each test sets up and cleans up its own DOM and storage state.
2. **Safe Global Restoration**: `dom-shim.js` saves and restores global property descriptors (`globalThis.window`, `document`, `localStorage`, `navigator`) between tests, preventing state leakage across test suites.
3. **High-Precision Timing Validation**: Deliberately tests algorithm behavior under artificial thread lag (e.g. 25ms delay per tick) to verify that timestamp delta reconciliation eliminates clock drift.
4. **WCAG AAA Luminosity Calculus**: `test-utils.js` implements the strict W3C relative luminance algorithm to verify color contrast ratios programmatically.
