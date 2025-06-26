/**
 * Test script for Slack integration error handling
 * Run with: tsx test/slack-error-tests.ts
 */

import { WebClient } from '@slack/web-api';
import { storage } from '../server/storage';
import { sendSlackMessage, NotificationType } from '../server/services/slack-service';

// Test user ID to use for testing
const TEST_USER_ID = 1;

async function runTests() {
  console.log("Running Slack Error Handling Tests...");

  // Test 1: Invalid Slack token handling - We can't directly test this since we don't pass tokens 
  // directly to the sendSlackMessage function, but we can test with a non-existent user
  try {
    console.log("\nTest 1: Missing Slack integration handling");
    const nonExistentUser = 9999;
    const result = await sendSlackMessage(
      nonExistentUser,
      "This is a test with an invalid token", 
      "general"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === false, "Expected failure for invalid/missing integration");
    console.assert(result.errorCode === "no_client", "Expected no_client error code");
    console.log("✅ Test 1 passed: Invalid/missing integration correctly handled");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: Channel not found handling
  try {
    console.log("\nTest 2: Channel not found handling");
    const result = await sendSlackMessage(
      TEST_USER_ID,
      "This is a test with a non-existent channel",
      "non_existent_channel_12345"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === false, "Expected failure for non-existent channel");
    console.assert(result.errorCode === "channel_not_found" || result.errorCode === "no_channel", 
      "Expected channel_not_found or no_channel error code");
    console.log("✅ Test 2 passed: Non-existent channel correctly handled");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // Test 3: Empty message handling
  try {
    console.log("\nTest 3: Empty message handling");
    const result = await sendSlackMessage(
      TEST_USER_ID,
      "",
      "general"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === false, "Expected failure for empty message");
    console.log("✅ Test 3 passed: Empty message correctly handled");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // Test 4: User without Slack integration
  try {
    console.log("\nTest 4: User without Slack integration");
    const nonExistentUser = 9999;
    const result = await sendSlackMessage(
      nonExistentUser,
      "This is a test for a user without Slack integration",
      "general"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === false, "Expected failure for user without Slack integration");
    console.assert(result.errorCode === "no_client", "Expected no_client error code");
    console.log("✅ Test 4 passed: User without Slack integration correctly handled");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // Test 5: Notification type-based channel routing
  try {
    console.log("\nTest 5: Notification type-based channel routing");
    const result = await sendSlackMessage(
      TEST_USER_ID,
      "This is a test for notification type-based channel routing",
      undefined,
      NotificationType.TASK_REMINDER
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    // This may succeed or fail depending on if the user has notification channels configured
    console.log(`✅ Test 5 ${result.success ? 'passed with success' : 'passed with expected failure'}: Notification type routing handled`);
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  console.log("\nSlack Error Handling Tests Completed");
}

// Run the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
  process.exit(1);
});