# Legacy / superseded stress tests — NOT executed

The files in this directory are kept for historical reference only:

- `challenger-*.test.js` — exploratory UI stress drafts from earlier milestones,
  superseded by the official 4-tier suite (`tests/tier1-features/`,
  `tests/tier2-boundaries/`, `tests/tier3-combinations/`,
  `tests/tier4-scenarios/`, run via `pnpm run test`).
- `stress_tokens_contrast.js`, `stress_zoom_and_tokens.js` — ad-hoc helpers,
  imported by nothing.

They are intentionally excluded from every official runner (`tests/runner.js`,
`tests/runner-platform.js`, `tests/runner-release.js` enumerate their files
explicitly, so nothing here can run by accident). One file hardcodes a
developer-machine path and was never portable.

Do not add new tests here. Do not rely on these files for release decisions.
