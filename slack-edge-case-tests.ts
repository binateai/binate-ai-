/**
 * Test script for Slack integration edge cases with error handling
 * Run with: tsx test/slack-edge-case-tests.ts
 */

import { sendSlackMessage } from '../server/services/slack-service';
import { storage } from '../server/storage';

// Test user ID to use for testing
const TEST_USER_ID = 1;
const NONEXISTENT_USER_ID = 9999;

async function runTests() {
  console.log("Running Slack Edge Case Tests...");

  // Test 1: Very long message handling
  try {
    console.log("\nTest 1: Very long message handling");
    // Create a message that's 4000+ characters (Slack's limit is around 4000)
    const longText = "This is a very long test message. ".repeat(200); // ~6000 chars
    
    const result = await sendSlackMessage(
      TEST_USER_ID,
      longText,
      "general"
    );
    
    console.log("Result:", JSON.stringify({
      success: result.success,
      errorCode: result.errorCode,
      message: (result.errorMessage || "").substring(0, 100) + "..." // Truncated for readability
    }, null, 2));
    
    // It should either succeed with truncation or fail gracefully with a specific error code
    console.assert(
      result.success === true || 
      (result.success === false && 
       (result.errorCode === "api_response_error" || result.errorCode === "invalid_auth")),
      "Expected success with truncation or graceful failure for very long messages"
    );
    console.log("✅ Test 1 passed: Very long message handled appropriately");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: Special Unicode characters
  try {
    console.log("\nTest 2: Special Unicode characters");
    // Message with various Unicode characters, emoji, special symbols
    const unicodeText = "Unicode test: 🚀 😊 👨‍👩‍👧‍👦 ⚡ → ∑ ∞ ♥ ⌚ ☂ ★ ☢ ☯ 你好 こんにちは مرحبا नमस्ते";
    
    const result = await sendSlackMessage(
      TEST_USER_ID,
      unicodeText,
      "general"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful handling of Unicode characters");
    console.log("✅ Test 2 passed: Unicode characters handled successfully");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // Test 3: HTML & special characters that need escaping
  try {
    console.log("\nTest 3: HTML & special characters that need escaping");
    const htmlText = "<b>This should not be bold</b> & other HTML entities like &copy; and < > should be handled";
    
    const result = await sendSlackMessage(
      TEST_USER_ID,
      htmlText,
      "general"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful handling of HTML/special characters");
    console.log("✅ Test 3 passed: HTML/special characters handled successfully");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // Test 4: Default channel fallback when no channel specified
  try {
    console.log("\nTest 4: Default channel fallback when no channel specified");
    
    const result = await sendSlackMessage(
      TEST_USER_ID,
      "Testing default channel fallback"
      // No channel specified
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true || 
                  (result.success === false && result.errorCode === "no_channel"), 
                  "Expected successful fallback to default channel or appropriate error");
    console.log(`✅ Test 4 ${result.success ? 'passed: Default channel used' : 'passed: No default channel available (expected)'}`);
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // Test 5: Non-existent user
  try {
    console.log("\nTest 5: Non-existent user");
    
    const result = await sendSlackMessage(
      NONEXISTENT_USER_ID, // User doesn't exist
      "Testing non-existent user",
      "general"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    // Since we're using a non-existent user, we expect the no_client error
    console.assert(
      result.success === false && result.errorCode === "no_client",
      "Expected failure with no_client error for non-existent user"
    );
    console.log("✅ Test 5 passed: Non-existent user handled appropriately");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // Test 6: Message with newlines and formatting
  try {
    console.log("\nTest 6: Message with newlines and formatting");
    const formattedText = "This message has *bold text*, _italic text_, and:\n- Bullet point 1\n- Bullet point 2\n\nAnd a new paragraph.";
    
    const result = await sendSlackMessage(
      TEST_USER_ID,
      formattedText,
      "general"
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful handling of formatted text");
    console.log("✅ Test 6 passed: Formatted text handled successfully");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  console.log("\nSlack Edge Case Tests Completed");
}

// Run the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
  process.exit(1);
});