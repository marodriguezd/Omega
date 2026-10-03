import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readProjectFile } from '../helpers/test-utils.js';

// Mirrors the tag-selection semantics of the "Prepare APK for Release" step:
// tags accept ONLY app-release.apk; anything else refuses to publish.
const SELECT_SNIPPET = `
set -eo pipefail
OUT="$1"; REF="$2"
if [ "$REF" = "tag" ]; then
  if [ -n "$(find "$OUT" -name 'app-debug*.apk' ! -name '*unaligned*' | head -n 1)" ]; then
    echo "FATAL: debug APK present in a tag build — refusing to publish." >&2
    exit 1
  fi
  APK_FILE=$(find "$OUT" -name 'app-release*.apk' ! -name '*unaligned*' | head -n 1)
  if [ -z "$APK_FILE" ]; then
    echo "FATAL: no app-release APK in a tag build — refusing to publish." >&2
    exit 1
  fi
else
  APK_FILE=$(find "$OUT" -name "*release*.apk" ! -name "*unaligned*" | head -n 1)
  if [ -z "$APK_FILE" ]; then
    APK_FILE=$(find "$OUT" -name "*.apk" ! -name "*unaligned*" | head -n 1)
  fi
fi
echo "SELECTED=$APK_FILE"
`;

// Mirrors the manifest signing guard: production signing requires a release APK.
const SIGNING_GUARD_SNIPPET = `
set -eo pipefail
APK_FILE="$1"; SIGNING="$2"
if [ "$SIGNING" = "android-production" ]; then
  case "$APK_FILE" in
    *app-release*.apk) ;;
    *)
      echo "FATAL: production signing claimed for non-release APK ($APK_FILE)." >&2
      exit 1
      ;;
  esac
fi
echo "GUARD_OK=$APK_FILE"
`;

function makeOutputs({ release = false, debug = false } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-apk-'));
  const out = path.join(tmp, 'apk');
  fs.mkdirSync(path.join(out, 'release'), { recursive: true });
  fs.mkdirSync(path.join(out, 'debug'), { recursive: true });
  if (release) fs.writeFileSync(path.join(out, 'release', 'app-release.apk'), 'fake-release-bytes');
  if (debug) fs.writeFileSync(path.join(out, 'debug', 'app-debug.apk'), 'fake-debug-bytes');
  return { tmp, out };
}

function runBash(snippet, args, cwd) {
  return execFileSync('bash', ['-c', snippet, 'bash', ...args], { encoding: 'utf8', cwd });
}

function expectFails(fn) {
  assert.throws(fn, /Command failed/, 'must exit non-zero');
}

describe('Release hardening — tag builds can never publish debug APKs', () => {
  it('R24. tag builds run ONLY assembleRelease; debug fallback is branch-only', () => {
    const yml = readProjectFile('.github/workflows/android.yml') || '';
    const start = yml.indexOf('Build Android APK');
    const end = yml.indexOf('Prepare APK for Release');
    assert.ok(start !== -1 && end > start, 'build APK step must exist before prepare step');
    const buildStep = yml.slice(start, end);
    assert.match(buildStep, /\$\{GITHUB_REF_TYPE\}" = "tag"/, 'build step must branch on tag ref type');
    assert.match(buildStep, /pipefail/, 'pipeline failures must propagate through tee');
    const anchor = buildStep.indexOf('run ONLY assembleRelease');
    assert.ok(anchor !== -1, 'tag-only release block must exist in build step');
    const tagBranch = buildStep.slice(anchor, buildStep.indexOf('else', anchor));
    assert.match(tagBranch, /assembleRelease/, 'tag branch must run assembleRelease');
    assert.doesNotMatch(tagBranch, /assembleDebug/, 'tag branch must NEVER run assembleDebug');
    assert.match(buildStep, /assembleDebug/, 'non-tag debug fallback must still exist');
  });

  it('R25. prepare step rejects debug APKs on tags and guards production signing', () => {
    const yml = readProjectFile('.github/workflows/android.yml') || '';
    const start = yml.indexOf('Prepare APK for Release');
    const end = yml.indexOf('Upload APK as Workflow Artifact');
    assert.ok(start !== -1 && end > start, 'prepare step must exist');
    const prep = yml.slice(start, end);
    assert.match(prep, /debug APK present in a tag build/, 'tags must refuse when a debug APK exists');
    assert.match(prep, /no app-release APK in a tag build/, 'tags must refuse when no release APK exists');
    assert.match(prep, /app-release\*\.apk/, 'tags must select only app-release APKs');
    assert.match(
      prep,
      /production signing claimed for non-release APK/,
      'manifest must never claim production signing for a debug APK',
    );
  });

  it('R26. tag + release APK accepted; tag + debug-only rejected; branch fallback permitted', () => {
    // Tag with both artifacts present: release APK wins, debug presence is fatal.
    let { tmp, out } = makeOutputs({ release: true, debug: true });
    try {
      expectFails(() => runBash(SELECT_SNIPPET, [out, 'tag'], tmp));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    // Tag with only the release APK: accepted.
    ({ tmp, out } = makeOutputs({ release: true }));
    try {
      const res = runBash(SELECT_SNIPPET, [out, 'tag'], tmp);
      assert.match(res, /SELECTED=.*app-release\.apk/, 'tag must select the release APK');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    // Tag with only a debug APK: publication refused.
    ({ tmp, out } = makeOutputs({ debug: true }));
    try {
      expectFails(() => runBash(SELECT_SNIPPET, [out, 'tag'], tmp));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
    // Non-tag with only a debug APK: development fallback remains permitted.
    ({ tmp, out } = makeOutputs({ debug: true }));
    try {
      const res = runBash(SELECT_SNIPPET, [out, 'branch'], tmp);
      assert.match(res, /SELECTED=.*app-debug\.apk/, 'branches may still fall back to debug');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('R27. production manifest guard rejects debug APKs', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-guard-'));
    try {
      const ok = runBash(SIGNING_GUARD_SNIPPET, ['/x/app-release.apk', 'android-production'], tmp);
      assert.match(ok, /GUARD_OK=/, 'release APK with production signing passes');
      expectFails(() => runBash(SIGNING_GUARD_SNIPPET, ['/x/app-debug.apk', 'android-production'], tmp));
      const dev = runBash(SIGNING_GUARD_SNIPPET, ['/x/app-debug.apk', 'android-dev'], tmp);
      assert.match(dev, /GUARD_OK=/, 'dev signing never claims production');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('R28. failed assembleRelease fails the tag job (no silent fallback)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omega-exit-'));
    try {
      // Failing producer through tee must propagate under pipefail.
      expectFails(() =>
        execFileSync('bash', ['-c', 'set -eo pipefail; false 2>&1 | tee out.log'], { cwd: tmp, stdio: 'pipe' }),
      );
      // Exact tag-branch shape with a failing ./gradlew stub: job fails,
      // and no fallback command after the tag branch ever runs.
      fs.writeFileSync(path.join(tmp, 'gradlew'), '#!/bin/sh\nexit 1\n');
      fs.chmodSync(path.join(tmp, 'gradlew'), 0o755);
      const tagBranch = 'set -eo pipefail; if [ "${GITHUB_REF_TYPE}" = "tag" ]; then ./gradlew assembleRelease --stacktrace 2>&1 | tee gradle_build.log; else echo FALLBACK_RAN; fi';
      expectFails(() =>
        execFileSync('bash', ['-c', tagBranch], {
          cwd: tmp,
          stdio: 'pipe',
          env: { ...process.env, GITHUB_REF_TYPE: 'tag' },
        }),
      );
      // Same failure off-tag: fallback remains permitted.
      const res = execFileSync('bash', ['-c', tagBranch], {
        cwd: tmp,
        encoding: 'utf8',
        env: { ...process.env, GITHUB_REF_TYPE: 'branch' },
      });
      assert.match(res, /FALLBACK_RAN/, 'non-tag builds keep the fallback path');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
