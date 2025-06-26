#!/usr/bin/env tsx

/**
 * This script runs all the Slack integration tests.
 * Run with: tsx test/run-all-slack-tests.ts
 */

import { execSync } from 'child_process';

console.log("===============================================");
console.log("  RUNNING ALL SLACK INTEGRATION TESTS");
console.log("===============================================");

const testFiles = [
  'test/slack-error-tests.ts',
  'test/slack-notification-tests.ts',
  'test/slack-edge-case-tests.ts'
];

let failedTests = 0;

for (let i = 0; i < testFiles.length; i++) {
  const testFile = testFiles[i];
  console.log(`\n\n[${i+1}/${testFiles.length}] Running ${testFile}...`);
  
  try {
    execSync(`tsx ${testFile}`, { stdio: 'inherit' });
    console.log(`✅ ${testFile} completed successfully.`);
  } catch (error) {
    console.error(`⚠️ ${testFile} had issues.`);
    failedTests++;
  }
}

console.log("\n\n===============================================");
console.log(`  TEST SUMMARY: ${testFiles.length - failedTests}/${testFiles.length} PASSED`);
console.log("===============================================");

if (failedTests > 0) {
  console.log(`⚠️ ${failedTests} test file(s) had issues.`);
  process.exit(1);
} else {
  console.log("✅ All test files completed successfully!");
  process.exit(0);
}