#!/usr/bin/env node

/**
 * Master Opaque-Box E2E Test Suite Runner for Omega Platform.
 * Executes all 4 tiers of tests:
 * - Tier 1: Feature Coverage (R1, R2, R3, R4)
 * - Tier 2: Boundary & Corner Cases (R1, R2, R3, R4)
 * - Tier 3: Cross-Feature Combinations (Pairwise)
 * - Tier 4: Real-World Application Scenarios (End-to-End User Journeys)
 */

import { run } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const TEST_TIERS = [
  {
    tier: 'Tier 1: Feature Coverage (R1-R4)',
    milestones: 'M1, M2, M3, M4',
    files: [
      path.join(__dirname, 'tier1-features/r1-design-tokens.test.js'),
      path.join(__dirname, 'tier1-features/r2-gpu-performance.test.js'),
      path.join(__dirname, 'tier1-features/r3-adaptive-layout.test.js'),
      path.join(__dirname, 'tier1-features/r4-multiplatform.test.js')
    ]
  },
  {
    tier: 'Tier 2: Boundary & Corner Cases (R1-R4)',
    milestones: 'M1, M2, M3, M4',
    files: [
      path.join(__dirname, 'tier2-boundaries/r1-design-boundaries.test.js'),
      path.join(__dirname, 'tier2-boundaries/r2-perf-boundaries.test.js'),
      path.join(__dirname, 'tier2-boundaries/r3-layout-boundaries.test.js'),
      path.join(__dirname, 'tier2-boundaries/r4-platform-boundaries.test.js')
    ]
  },
  {
    tier: 'Tier 3: Cross-Feature Combinations',
    milestones: 'Integration',
    files: [
      path.join(__dirname, 'tier3-combinations/cross-feature.test.js')
    ]
  },
  {
    tier: 'Tier 4: Real-World Application Scenarios',
    milestones: 'End-to-End User Journeys',
    files: [
      path.join(__dirname, 'tier4-scenarios/e2e-scenarios.test.js')
    ]
  }
];

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('       OMEGA COMPREHENSIVE 4-TIER E2E TEST SUITE RUNNER         ');
  console.log('================================================================');
  console.log(`Environment: Node ${process.version} | Target: Omega Platform`);
  console.log(`Project Root: ${PROJECT_ROOT}\n`);

  const tierSummaries = [];
  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;
  const failureDetails = [];

  const startTime = Date.now();

  for (const tierConfig of TEST_TIERS) {
    console.log(`\n▶ Executing ${tierConfig.tier}...`);
    let tierTotal = 0;
    let tierPassed = 0;
    let tierFailed = 0;

    for (const testFile of tierConfig.files) {
      const relPath = path.relative(PROJECT_ROOT, testFile);
      const testStream = run({ files: [testFile] });

      for await (const event of testStream) {
        const testName = event.data?.name || '';
        const isTestCase = /^T[1-4]\./.test(testName);

        if (!isTestCase) continue;

        if (event.type === 'test:pass') {
          tierPassed++;
          tierTotal++;
          console.log(`  ✔ [PASS] ${testName} (${Math.round(event.data.details.duration_ms)}ms)`);
        } else if (event.type === 'test:fail') {
          tierFailed++;
          tierTotal++;
          const errMsg = event.data.details.error?.message || 'Assertion failed';
          console.log(`  ✖ [FAIL] ${testName}`);
          console.log(`     └─ ${errMsg}`);
          failureDetails.push({
            tier: tierConfig.tier,
            file: relPath,
            name: testName,
            error: errMsg
          });
        }
      }
    }

    tierSummaries.push({
      name: tierConfig.tier,
      milestones: tierConfig.milestones,
      total: tierTotal,
      passed: tierPassed,
      failed: tierFailed
    });

    grandTotal += tierTotal;
    grandPassed += tierPassed;
    grandFailed += tierFailed;
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n================================================================');
  console.log('                      TEST EXECUTION SUMMARY                    ');
  console.log('================================================================');
  console.log('Tier                                    | Total | Pass | Fail | Milestones');
  console.log('----------------------------------------+-------+------+------+-----------');
  for (const s of tierSummaries) {
    const tierPadded = s.name.padEnd(39, ' ');
    const totalPadded = String(s.total).padStart(5, ' ');
    const passPadded = String(s.passed).padStart(4, ' ');
    const failPadded = String(s.failed).padStart(4, ' ');
    console.log(`${tierPadded} | ${totalPadded} | ${passPadded} | ${failPadded} | ${s.milestones}`);
  }
  console.log('----------------------------------------+-------+------+------+-----------');
  console.log(`Total Tests: ${grandTotal} | Passed: ${grandPassed} | Pending Implementation: ${grandFailed}`);
  console.log(`Suite Execution Time: ${totalDuration}s`);
  console.log('================================================================\n');

  if (failureDetails.length > 0) {
    console.log('Pending Implementation Milestones / Discovered Defects:');
    failureDetails.forEach((f, idx) => {
      console.log(`${idx + 1}. [${f.tier}] ${f.name}`);
      console.log(`   File: ${f.file}`);
      console.log(`   Issue: ${f.error}\n`);
    });
  } else {
    console.log('🎉 100% of all tests in all 4 tiers PASSED!\n');
  }

  const isBaseline = process.argv.includes('--baseline') || process.argv.includes('--allow-pending');
  if (!isBaseline && grandFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(2);
});
