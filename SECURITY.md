# Security Policy

## Supported Versions

Only the latest public release is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.0   | :white_check_mark: |
| < 1.0.0 | :x:                |

Earlier `v1.1.0`–`v1.4.0` tags were private internal testing artifacts and
are not supported.

## Reporting a Vulnerability

Report vulnerabilities privately via
[GitHub Security Advisories](https://github.com/marodriguezd/Omega/security/advisories/new)
for this repository. Do not open a public issue for a suspected
vulnerability.

Include, where possible: affected version/tag, platform and artifact,
steps to reproduce, and impact assessment.

## Scope Notes

- Android production APKs are signed with a private release key held only
  in CI secrets; signing status of any artifact is recorded in its release
  manifest (`manifest-*.json` `signing` field) — see `docs/SIGNING.md`.
- Desktop artifacts ship unsigned unless project signing secrets are
  configured (see `docs/SIGNING.md`); verify all downloads against the
  published `SHA256SUMS-android.txt` / `SHA256SUMS-desktop.txt` checksums.
