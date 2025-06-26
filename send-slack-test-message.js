import fetch from 'node-fetch';
import { sendSlackMessage } from '../server/services/slack-service.js';

// This is a test script to simulate sending a message directly from the service
// without having to go through the API authentication
async function sendTestMessage() {
  try {
    console.log('Sending test message directly via the Slack service...');
    
    // User ID 1 is a test user
    const userId = 1;
    const message = '👋 This is a test message sent directly from the Slack service';
    
    // Import the NotificationType enum
    const { NotificationType } = await import('../server/services/slack-service.js');
    
    // Use notification type to test the channel selection logic
    console.log('Using notification type: DAILY_SUMMARY');
    const result = await sendSlackMessage(
      userId, 
      message, 
      undefined, // no specific channel, should use notification type logic
      NotificationType.DAILY_SUMMARY
    );
    
    console.log('Result:', result);
    
    if (result.success) {
      console.log('✅ Message sent successfully!');
    } else {
      console.log('❌ Failed to send message:');
      console.log('Error code:', result.errorCode);
      console.log('Error message:', result.errorMessage);
      console.log('Debug details:', result.debugDetails);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

sendTestMessage();