/**
 * Test script for Slack integration edge cases with error handling
 * Run with: node test-slack-edge-cases.js
 */

import * as slackService from './server/services/slack-service';
import { storage } from './server/storage';

// Test user ID to use for testing
const TEST_USER_ID = 1;
const NONEXISTENT_USER_ID = 9999;

async function runTests() {
  console.log('🔍 SLACK INTEGRATION EDGE CASES TESTS 🔍');
  console.log('======================================\n');

  try {
    // Test 1: Attempt to send message to non-existent channel
    console.log('Test 1: Attempting to send message to non-existent channel');
    const fakeChannelResult = await slackService.sendSlackMessage(
      TEST_USER_ID,
      {
        // Intentionally invalid channel ID format
        channel: 'NOT-A-REAL-CHANNEL-ID',
        text: 'This should fail with proper error handling'
      }
    );
    
    console.log('Result:', JSON.stringify(fakeChannelResult, null, 2));
    console.log('Error handling check:', fakeChannelResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 2: Attempt operations for user with no Slack integration
    console.log('Test 2: Operations for user with no Slack integration');
    const noIntegrationResult = await slackService.sendTaskReminderNotification(
      NONEXISTENT_USER_ID,
      'Test Task',
      'This should have error handling for missing integration',
      new Date(),
      'medium'
    );
    
    console.log('Result:', JSON.stringify(noIntegrationResult, null, 2));
    console.log('Error handling check:', noIntegrationResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 3: Test with empty notification data
    console.log('Test 3: Testing with empty notification data');
    const emptyDataResult = await slackService.sendSlackMessage(
      TEST_USER_ID,
      {
        channel: process.env.SLACK_CHANNEL_ID, // Use valid channel
        text: '' // Empty message text
      }
    );
    
    console.log('Result:', JSON.stringify(emptyDataResult, null, 2));
    console.log('Handle empty data:', emptyDataResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 4: Test with malformed OAuth data
    console.log('Test 4: Testing with malformed OAuth data');
    try {
      const malformedCode = "this-is-not-a-valid-oauth-code";
      await slackService.exchangeCodeForToken(malformedCode);
      console.log('❌ Test failed - should have error handling for invalid OAuth code');
    } catch (error) {
      console.log('✅ Test passed - Error properly handled');
      console.log('Error message:', error.message || String(error));
    }
    console.log('\n');

    // Test 5: Test with invalid notification type
    console.log('Test 5: Using invalid notification type');
    const invalidTypeResult = await slackService.sendSlackMessage(
      TEST_USER_ID,
      {
        channel: process.env.SLACK_CHANNEL_ID,
        text: 'Test message with invalid notification type'
      },
      'not_a_real_notification_type' // Invalid notification type
    );
    
    console.log('Result:', JSON.stringify(invalidTypeResult, null, 2));
    console.log('Handle invalid type:', invalidTypeResult.errorCode ? '✅ Test passed with error' : '✅ Test passed by ignoring invalid type');
    console.log('\n');
    
    console.log('All edge case tests completed. Check logs above for results.');
  } catch (error) {
    console.error('Error running edge case tests:', error);
  }
}

runTests().catch(console.error);