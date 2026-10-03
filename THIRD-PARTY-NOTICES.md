# Third-party notices — Omega v1.0.0

Only factual, directly verifiable information. No legal conclusions are made
here; the project owner is responsible for license compliance review.

## Bubble-Breathing (breathing module source)

- Location: `Bubble-Breathing/` git submodule, pinned at
  `f0deadafe3a9c87b641187338e0d011ae6553b50`.
- License file present in the submodule: `Bubble-Breathing/LICENSE`,
  containing the full text of the **Apache License, Version 2.0
  (January 2004)** (verified in this checkout).
- Its README (`Bubble-Breathing/README.md`) states the project is licensed
  under the Apache 2.0 License.
- Its `package.json` declares no `license` field.
- Upstream repository metadata (`marodriguezd/Bubble-Breathing`) declares
  license `apache-2.0` (SPDX `Apache-2.0`), consistent with the file above.

## Hydrocicle (cold-exposure module source) — OWNER CONFIRMATION REQUIRED

- Location: `Hydrocicle/` git submodule, pinned at
  `c7a04c6ae08e332599d6c6649af4f75aadc79318`.
- Its README (`Hydrocicle/README.md`) claims the project is licensed under
  the **Apache 2.0 License** and links to a `LICENSE` file.
- **Gap: no `LICENSE` file is present in the submodule checkout**, and its
  `package.json` declares no `license` field. Verified 2026-10-03:
  `git ls-tree -r <pinned-commit>` shows no license/notice file, no
  `LICENSE` commit exists anywhere in the submodule history, and the
  upstream repository metadata (`marodriguezd/Hydrocicle`) reports
  `"license": null` (GitHub detects no license).
- No license is asserted here. The owner must confirm Hydrocicle's license
  with its upstream source (e.g. by adding a `LICENSE` file upstream and
  re-pinning the submodule) before treating this as settled for the public
  release.

## Outfit typeface (bundled font files)

- Files: `src/assets/fonts/outfit-latin.woff2`,
  `src/assets/fonts/outfit-latin-ext.woff2` (self-hosted, bundled into the
  app; no network fetch at runtime).
- Per the in-repo comment in `src/styles/fonts.css`: source is Google Fonts,
  Outfit v15, under the **SIL Open Font License 1.1**.
- The full OFL license text is not bundled in this repository; the font
  files themselves were obtained from the upstream Outfit distribution.

## lucide-react (icon glyphs compiled into the app bundle)

- Delivered via npm (`lucide-react`, `^1.24.0`); icon SVG paths are compiled
  into the production bundle.
- Its published `package.json` declares `"license": "ISC"`.

## Runtime frameworks (not redistributed as source)

React, Vite, Capacitor, and Electron are build/runtime dependencies resolved
from npm. Their respective license terms apply as published upstream; no
vendored copies are carried in this repository.
