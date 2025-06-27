#!/usr/bin/env node

/**
 * This script runs all the Slack integration tests using tsx for TypeScript support.
 * Usage: node run-slack-tests-with-tsx.js
 */

import { execSync } from 'child_process';

console.log("===============================================");
console.log("  RUNNING SLACK INTEGRATION ERROR HANDLING TESTS");
console.log("===============================================");

try {
  console.log("\n\n[1/3] Running Basic Error Tests...");
  execSync('node test-slack-errors.js', { stdio: 'inherit' });
  console.log("✅ Basic error tests completed.");
} catch (error) {
  console.error("⚠️ Basic error tests failed or had issues.");
}

try {
  console.log("\n\n[2/3] Running Notification Tests...");
  execSync('node test-slack-notifications.js', { stdio: 'inherit' });
  console.log("✅ Notification tests completed.");
} catch (error) {
  console.error("⚠️ Notification tests failed or had issues.");
}

try {
  console.log("\n\n[3/3] Running Edge Case Tests...");
  execSync('node test-slack-edge-cases.js', { stdio: 'inherit' });
  console.log("✅ Edge case tests completed.");
} catch (error) {
  console.error("⚠️ Edge case tests failed or had issues.");
}

console.log("\n\nAll tests completed! Check logs above for detailed results.");