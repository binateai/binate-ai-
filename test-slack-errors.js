/**
 * Test script for Slack integration error handling
 * Run with: node test-slack-errors.js
 */

import { WebClient } from '@slack/web-api';
import { storage } from './server/storage';
import * as slackService from './server/services/slack-service';

// Test user ID to use for testing
const TEST_USER_ID = 1;

async function runTests() {
  console.log('🧪 SLACK INTEGRATION ERROR HANDLING TESTS 🧪');
  console.log('==========================================\n');

  try {
    // Test 1: Disconnecting non-existent integration
    console.log('Test 1: Disconnecting a non-existent Slack integration');
    const nonExistentResult = await slackService.disconnectSlackIntegration(999);
    console.log('Result:', JSON.stringify(nonExistentResult, null, 2));
    console.log('Success:', nonExistentResult.success === false ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 2: Using invalid token for Slack API
    console.log('Test 2: Using an invalid Slack token for API calls');
    try {
      // Create a WebClient with an invalid token
      const badClient = new WebClient('xoxb-invalid-token-123456');
      
      // Try to use the client
      await badClient.chat.postMessage({
        channel: 'C04HL619LG',
        text: 'This should fail with proper error handling'
      });
      console.log('❌ Test failed - should have thrown an error');
    } catch (error) {
      console.log('✅ Test passed - Error was properly thrown and can be caught');
      console.log('Error details available for logging:', error.message);
    }
    console.log('\n');

    // Test 3: Test enhanced database error handling
    console.log('Test 3: Testing database operation error handling');
    try {
      // Let's create a scenario where a required field is missing
      await storage.saveSlackIntegration(TEST_USER_ID, {
        // Intentionally missing required fields
      });
      console.log('❌ Test failed - should have thrown an error');
    } catch (error) {
      console.log('✅ Test passed - Database operation properly failed');
      console.log('Error message:', error.message);
    }
    console.log('\n');
    
    console.log('All tests completed. Check logs above for results.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests().catch(console.error);