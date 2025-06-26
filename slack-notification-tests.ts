/**
 * Test script for Slack notifications with error handling
 * Run with: tsx test/slack-notification-tests.ts
 */

import { 
  sendSlackMessage,
  sendTaskReminderNotification,
  sendMeetingReminderNotification,
  sendInvoiceDueNotification,
  sendLeadDetectedNotification,
  sendDailySummaryNotification,
  NotificationType
} from '../server/services/slack-service';

// Test user ID to use for testing
const TEST_USER_ID = 1;

async function runTests() {
  console.log("Running Slack Notification Tests...");

  // Test 1: Simple text message notification
  try {
    console.log("\nTest 1: Simple text message notification");
    const timestamp = new Date().toISOString();
    const result = await sendSlackMessage(
      TEST_USER_ID,
      `This is a simple text notification test (${timestamp})`,
      "general" // This should be configured in the system
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful message notification");
    console.log("✅ Test 1 passed: Simple text notification sent successfully");
  } catch (error) {
    console.error("❌ Test 1 failed:", error.message);
  }

  // Test 2: Task reminder notification
  try {
    console.log("\nTest 2: Task reminder notification");
    const timestamp = new Date().toISOString();
    const result = await sendTaskReminderNotification(
      TEST_USER_ID,
      [{
        id: 9999,
        title: `Test Task (${timestamp})`,
        dueDate: new Date(Date.now() + 86400000) // Tomorrow
      }]
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful task reminder notification");
    console.log("✅ Test 2 passed: Task reminder notification sent successfully");
  } catch (error) {
    console.error("❌ Test 2 failed:", error.message);
  }

  // Test 3: Meeting reminder notification
  try {
    console.log("\nTest 3: Meeting reminder notification");
    const timestamp = new Date().toISOString();
    const result = await sendMeetingReminderNotification(
      TEST_USER_ID,
      {
        id: 9999,
        title: `Test Meeting (${timestamp})`,
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        endTime: new Date(Date.now() + 7200000), // 2 hours from now
        location: "Virtual",
        attendees: ["user1@example.com", "user2@example.com"]
      }
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful meeting reminder notification");
    console.log("✅ Test 3 passed: Meeting reminder notification sent successfully");
  } catch (error) {
    console.error("❌ Test 3 failed:", error.message);
  }

  // Test 4: Invoice due notification
  try {
    console.log("\nTest 4: Invoice due notification");
    const timestamp = new Date().toISOString();
    const result = await sendInvoiceDueNotification(
      TEST_USER_ID,
      {
        id: 9999,
        number: `INV-${Date.now().toString().substring(8)}`,
        client: "Test Client",
        amount: 500.00,
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        status: "pending"
      }
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful invoice due notification");
    console.log("✅ Test 4 passed: Invoice due notification sent successfully");
  } catch (error) {
    console.error("❌ Test 4 failed:", error.message);
  }

  // Test 5: Lead detected notification
  try {
    console.log("\nTest 5: Lead detected notification");
    const timestamp = new Date().toISOString();
    const result = await sendLeadDetectedNotification(
      TEST_USER_ID,
      {
        name: "Test Lead",
        email: "testlead@example.com",
        company: "Test Company",
        source: "Email",
        sourceId: `test-${Date.now()}`,
        confidence: 0.85
      }
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful lead detected notification");
    console.log("✅ Test 5 passed: Lead detected notification sent successfully");
  } catch (error) {
    console.error("❌ Test 5 failed:", error.message);
  }

  // Test 6: Daily summary notification
  try {
    console.log("\nTest 6: Daily summary notification");
    const result = await sendDailySummaryNotification(
      TEST_USER_ID,
      {
        date: new Date(),
        taskCount: 3,
        completedTaskCount: 1,
        upcomingMeetings: 2,
        pendingInvoices: 1,
        newLeads: 2
      }
    );
    
    console.log("Result:", JSON.stringify(result, null, 2));
    console.assert(result.success === true, "Expected successful daily summary notification");
    console.log("✅ Test 6 passed: Daily summary notification sent successfully");
  } catch (error) {
    console.error("❌ Test 6 failed:", error.message);
  }

  console.log("\nSlack Notification Tests Completed");
}

// Run the tests
runTests().catch(error => {
  console.error("Error running tests:", error);
  process.exit(1);
});