/**
 * Test script for Slack notifications with error handling
 * Run with: node test-slack-notifications.js
 */

import * as slackService from './server/services/slack-service';

// Test user ID to use for testing
const TEST_USER_ID = 1;

async function runTests() {
  console.log('🔔 SLACK NOTIFICATION TESTS WITH ERROR HANDLING 🔔');
  console.log('==============================================\n');

  try {
    // Test 1: Task Reminder Notification
    console.log('Test 1: Sending task reminder notification');
    const taskResult = await slackService.sendTaskReminderNotification(
      TEST_USER_ID,
      'Test Task Reminder',
      'This is a test task reminder with enhanced error handling',
      new Date(Date.now() + 86400000), // Due tomorrow
      'high'
    );
    
    console.log('Result:', JSON.stringify(taskResult, null, 2));
    console.log(taskResult && !taskResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 2: Meeting Reminder Notification
    console.log('Test 2: Sending meeting reminder notification');
    const meetingResult = await slackService.sendMeetingReminderNotification(
      TEST_USER_ID,
      'Test Meeting Reminder',
      'This is a test meeting reminder with enhanced error handling',
      new Date(Date.now() + 3600000), // Starting in 1 hour
      'https://meet.google.com/test-meeting-url',
      'Virtual Meeting Room'
    );
    
    console.log('Result:', JSON.stringify(meetingResult, null, 2));
    console.log(meetingResult && !meetingResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 3: Invoice Due Notification
    console.log('Test 3: Sending invoice due notification');
    const invoiceResult = await slackService.sendInvoiceDueNotification(
      TEST_USER_ID,
      'INV-2025-001',
      'Test Client',
      499.99,
      new Date(Date.now() + 604800000), // Due in 1 week
      'unpaid'
    );
    
    console.log('Result:', JSON.stringify(invoiceResult, null, 2));
    console.log(invoiceResult && !invoiceResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 4: Lead Detection Notification
    console.log('Test 4: Sending lead detection notification');
    const leadResult = await slackService.sendLeadDetectedNotification(
      TEST_USER_ID,
      'test@example.com',
      'Test Lead',
      'Test Company',
      'Website Contact Form',
      'High', 
      1000,
      'Showed interest in the premium plan'
    );
    
    console.log('Result:', JSON.stringify(leadResult, null, 2));
    console.log(leadResult && !leadResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');

    // Test 5: Daily Summary Notification
    console.log('Test 5: Sending daily summary notification');
    const summaryResult = await slackService.sendDailySummaryNotification(
      TEST_USER_ID, 
      {
        tasks: { completed: 3, upcoming: 2 },
        meetings: { attended: 1, upcoming: 2 },
        invoices: { paid: 1, pending: 2, overdue: 0 },
        newLeads: 2,
        totalRevenue: 1499.99
      }
    );
    
    console.log('Result:', JSON.stringify(summaryResult, null, 2));
    console.log(summaryResult && !summaryResult.errorCode ? '✅ Test passed' : '❌ Test failed');
    console.log('\n');
    
    console.log('All notification tests completed. Check logs above for results.');
  } catch (error) {
    console.error('Error running notification tests:', error);
  }
}

runTests().catch(console.error);