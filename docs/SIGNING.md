# Omega signing and release procedure

## Credential policy

The repository contains **no production signing credentials**. No
`.jks`, `.keystore`, `.p12`, `.pfx`, `.pem`, or `.key` file is tracked
(`R17` regression test), and `.gitignore` blocks them from ever being
committed (`R18`).

- Android production signing comes **only** from the `ANDROID_KEYSTORE_BASE64`
  CI secret. `v*` tag builds **fail fast** without it — dev-signed APKs can
  never be published as releases.
- Desktop signing/notarization is optional and secret-driven (tables below).
- Unsigned local builds are **development artifacts**, never releases.

Historical note: an early development keystore
(`android/app/omega-release-key.jks`) was once committed and was removed
from version control without replacement. It may still exist in Git history
(upstream commit `195b009`). History was deliberately **not** rewritten, so
treat that key as public: never use it for production signing. If the key
was ever used for a public release, rotate the signing identity and, only
after coordinating with all clone owners, consider a history purge with
`git filter-repo` — this is documented, not performed, here.

Never commit keystores, `.p12`/`.pfx` certificates, passwords, or Apple
credentials to the repository.

## Local Android development (no secrets needed)

Generate a throwaway local dev keystore once (gitignored, never committed):

```bash
keytool -genkeypair -keystore android/app/omega-release-key.jks \
  -alias omega -keyalg RSA -keysize 2048 -validity 365 \
  -storepass omega2025 -keypass omega2025 \
  -dname "CN=Omega Dev, OU=Dev, O=Omega, C=US"
pnpm run android:build
```

(CI branch builds generate an equivalent ephemeral keystore automatically.)

## macOS (Developer ID + notarization)

| Secret | Contents |
|---|---|
| `MAC_CSC_LINK` | base64 of your Developer ID Application `.p12` |
| `MAC_CSC_KEY_PASSWORD` | password for the `.p12` |
| `APPLE_ID` | Apple ID enrolled in the Developer Program |
| `APPLE_APP_SPECIFIC_PASSWORD` | app-specific password for that Apple ID |
| `APPLE_TEAM_ID` | 10-character Team ID |

```bash
base64 -i DeveloperID.p12 | pbcopy   # paste into MAC_CSC_LINK
```

Without these secrets the DMG builds unsigned (ad-hoc). Notarization runs
automatically via electron-builder only when `APPLE_ID`,
`APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` are all present.

## Windows (code signing)

| Secret | Contents |
|---|---|
| `WIN_CSC_LINK` | base64 of your code-signing `.pfx`/`.p12` |
| `WIN_CSC_KEY_PASSWORD` | password for the certificate file |

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cert.pfx")) | Set-Clipboard
```

Without these secrets the MSI builds unsigned (Windows SmartScreen will
warn on install — expected for unsigned builds).

## Android (release keystore)

| Secret | Contents |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | base64 of your private release `.jks` |
| `KEYSTORE_PASSWORD` | keystore password |
| `KEY_ALIAS` | key alias |
| `KEY_PASSWORD` | key password |

Required for `v*` tags. Branch builds use an ephemeral dev keystore.

## Linux (AppImage)

AppImages ship unsigned by design; no secrets apply. Users verify
authenticity via the published `SHA256SUMS.txt` and `manifest-*.json`.

## Release procedure (maintainers)

```bash
# 1. Set the single source of truth, then commit it.
#    Edit package.json "version", e.g. "1.0.0".

# 2. Full local gate (must all pass):
pnpm install
pnpm run build
pnpm run test                  # 56 core tests
node tests/runner-platform.js  # 19 platform tests
node tests/runner-release.js   # 28 release tests
node scripts/validate-build.mjs
node scripts/release-meta.mjs --tag=v1.0.0

# 3. Commit, then tag exactly matching package.json:
git tag v1.0.0
git push origin main v1.0.0
```

CI then validates the tag, runs every suite, builds APK (ubuntu),
DMG (macOS), MSI (Windows), AppImage (Linux), and publishes:

- `Omega-<version>.apk`, `Omega.apk` (compat alias), `SHA256SUMS.txt`, `manifest.json`
- `Omega-<version>.dmg`, `Omega-<version>.msi`, `Omega-<version>.AppImage`
- `manifest-mac.json`, `manifest-windows.json`, `manifest-linux.json`, combined `SHA256SUMS.txt`

Each `manifest*.json` entry carries `{ version, commit, platform,
artifact, sha256, signing, builtAt }` — the `signing` field tells you
exactly how that artifact was signed.

## Verifying a release

```bash
sha256sum -c SHA256SUMS.txt
```
