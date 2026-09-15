# Omega Testing Infrastructure (`TEST_INFRA.md`)

## 1. Overview & Architectural Philosophy

The Omega testing infrastructure provides a robust, self-contained, and completely automated **4-tier opaque-box end-to-end test framework**. It evaluates the Omega platform from the outside against authoritative functional and non-functional specifications defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

### Core Highlights:
- **Zero Heavy Binary Overhead**: Built directly upon Node 24's native `node:test`, `node:assert`, and standard ESM. No fragile, memory-heavy headless browser binaries or external daemon dependencies required.
- **Lightweight High-Fidelity Shims**: Simulates browser windowing, custom events, `localStorage`, `navigator.wakeLock`, and `navigator.vibrate` with isolated per-test teardown via `tests/helpers/dom-shim.js`.
- **Authoritative CSS & AST Inspection**: Direct filesystem and CSS custom property parsing (`parseCssVariables`, `parseKeyframes`, `parseMediaQueries`) to ensure compliance with Wim Hof design tokens, GPU acceleration flags, responsive layout breakpoints, and cross-platform configuration.
- **Unified Master Test Runner**: `tests/runner.js` executes all 4 tiers sequentially, aggregates results into a structured executive summary table, and maps pending tests to implementation milestones.

---

## 2. Directory Layout

All test suites and harnesses are colocated in the root `tests/` directory:

```
/data/data/com.termux/files/home/Omega/tests/
├── runner.js                             # Master CLI test runner with formatted reporting
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
└── tier4-scenarios/
    └── e2e-scenarios.test.js             # Tier 4: Full realistic user journeys (Breathing, Hydro, Desktop, Mobile, Sync)
```

---

## 3. How to Run the Tests

### 3.1 Standard Execution
Execute the entire test suite via `npm test` or directly via Node:

```bash
# Run entire test suite (exits with code 1 if pending implementation tests fail)
npm test

# Run directly via runner
node tests/runner.js
```

### 3.2 Baseline / Diagnostic Mode
During milestone implementation (M1-M4), run with `--baseline` to inspect the full summary and pending items without breaking build pipelines:

```bash
npm test -- --baseline
# or
node tests/runner.js --baseline
```

### 3.3 Individual Tier or File Execution
Run any specific test file or tier directly with Node's native test runner:

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

| Tier | Category | Scope | Count | Target Milestones |
|---|---|---|:---:|---|
| **Tier 1** | Feature Coverage | Primary happy-path contracts for R1, R2, R3, R4 | 20 | M1, M2, M3, M4 |
| **Tier 2** | Boundary & Corner Cases | Extreme values, clamping, WCAG contrast, timer drift, safe-area limits | 20 | M1, M2, M3, M4 |
| **Tier 3** | Cross-Feature Combinations | Pairwise interaction matrices (active session protection, zoom + squircle, storage sync) | 6 | Integration |
| **Tier 4** | Real-World Application Scenarios | Complete end-to-end user journeys (Breathing, HydroCycle, Desktop, Mobile, i18n) | 5 | End-to-End |
| **Total** | **Comprehensive Suite** | **Complete coverage across R1-R4** | **51** | **All Milestones** |

---

## 5. Shimming Strategy & Environmental Isolation

1. **Independent Test Execution**: Each test sets up and cleans up its own DOM and storage state.
2. **Safe Global Restoration**: `dom-shim.js` saves and restores global property descriptors (`globalThis.window`, `document`, `localStorage`, `navigator`) between tests, preventing state leakage across test suites.
3. **High-Precision Timing Validation**: Deliberately tests algorithm behavior under artificial thread lag (e.g. 25ms delay per tick) to verify that timestamp delta reconciliation eliminates clock drift.
4. **WCAG AAA Luminosity Calculus**: `test-utils.js` implements the strict W3C relative luminance algorithm to verify color contrast ratios programmatically.
