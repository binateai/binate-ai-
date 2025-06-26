// Test script for pending email reply API endpoints
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL for API calls
const baseUrl = 'http://localhost:5000';

// Store session cookie and pending reply ID
let cookie = '';
let pendingReplyId = null;

async function loginToApp() {
  console.log('Logging in to app...');
  
  const response = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'shaima123',
      password: 'Tiaali59',
    }),
  });
  
  console.log('Login status:', response.status);
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }
  
  // Get cookie for session
  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    cookie = cookies.split(';')[0]; // Extract the main cookie
    console.log('Session cookie obtained:', cookie);
  } else {
    throw new Error('No cookies returned from login');
  }
  
  const userData = await response.json();
  console.log('Logged in as:', userData.username);
  
  return userData;
}

async function createPendingReply() {
  console.log('\nCreating a new pending email reply...');
  
  const response = await fetch(`${baseUrl}/api/pending-email-replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({
      messageId: 'api-test-message-id-123',
      recipient: 'recipient@example.com',
      subject: 'RE: API Test Subject',
      content: '<p>This is a test reply created through the API.</p>',
      originalMessageData: {
        id: 'test-message-id-123',
        threadId: 'test-thread-id-123',
        subject: 'API Test Subject',
        from: 'sender@example.com'
      }
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create pending reply: ${response.status} ${response.statusText}`);
  }
  
  const pendingReply = await response.json();
  console.log('Created pending reply:', pendingReply);
  pendingReplyId = pendingReply.id;
  
  return pendingReply;
}

async function getPendingReplies() {
  console.log('\nFetching all pending email replies...');
  
  const response = await fetch(`${baseUrl}/api/pending-email-replies`, {
    method: 'GET',
    headers: {
      'Cookie': cookie,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get pending replies: ${response.status} ${response.statusText}`);
  }
  
  const pendingReplies = await response.json();
  console.log(`Found ${pendingReplies.length} pending email replies`);
  
  if (pendingReplies.length > 0) {
    console.log('Latest pending reply:', {
      id: pendingReplies[0].id,
      subject: pendingReplies[0].subject,
      recipient: pendingReplies[0].recipient || pendingReplies[0].to,
      status: pendingReplies[0].status,
      createdAt: pendingReplies[0].createdAt
    });
  }
  
  return pendingReplies;
}

async function getPendingReplyById(id) {
  console.log(`\nFetching pending email reply with ID ${id}...`);
  
  const response = await fetch(`${baseUrl}/api/pending-email-replies/${id}`, {
    method: 'GET',
    headers: {
      'Cookie': cookie,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get pending reply: ${response.status} ${response.statusText}`);
  }
  
  const pendingReply = await response.json();
  console.log('Retrieved pending reply by ID:', {
    id: pendingReply.id,
    subject: pendingReply.subject,
    recipient: pendingReply.recipient || pendingReply.to,
    status: pendingReply.status,
    createdAt: pendingReply.createdAt
  });
  
  return pendingReply;
}

async function approvePendingReply(id) {
  console.log(`\nApproving pending email reply with ID ${id}...`);
  
  const response = await fetch(`${baseUrl}/api/pending-email-replies/${id}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({}),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to approve pending reply: ${response.status} ${response.statusText}`);
  }
  
  const pendingReply = await response.json();
  console.log('Approved pending reply:', {
    id: pendingReply.id,
    subject: pendingReply.subject,
    recipient: pendingReply.recipient || pendingReply.to,
    status: pendingReply.status,
    actionTaken: pendingReply.actionTaken,
    actionDate: pendingReply.actionDate
  });
  
  return pendingReply;
}

async function rejectPendingReply(id) {
  console.log(`\nRejecting pending email reply with ID ${id}...`);
  
  const response = await fetch(`${baseUrl}/api/pending-email-replies/${id}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({}),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to reject pending reply: ${response.status} ${response.statusText}`);
  }
  
  const pendingReply = await response.json();
  console.log('Rejected pending reply:', {
    id: pendingReply.id,
    subject: pendingReply.subject,
    recipient: pendingReply.recipient || pendingReply.to,
    status: pendingReply.status,
    actionTaken: pendingReply.actionTaken,
    actionDate: pendingReply.actionDate
  });
  
  return pendingReply;
}

async function deletePendingReply(id) {
  console.log(`\nDeleting pending email reply with ID ${id}...`);
  
  const response = await fetch(`${baseUrl}/api/pending-email-replies/${id}`, {
    method: 'DELETE',
    headers: {
      'Cookie': cookie,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete pending reply: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log('Delete result:', result);
  
  return result;
}

async function testPendingEmailReplyAPI() {
  try {
    await loginToApp();
    
    // Get existing pending replies
    const initialReplies = await getPendingReplies();
    
    // Create a new pending reply
    const newReply = await createPendingReply();
    
    // Get pending reply by ID
    const retrievedReply = await getPendingReplyById(newReply.id);
    
    // Approve the pending reply
    // Note: In a real workflow we would create two separate pending replies,
    // one for approval and one for rejection
    const approvedReply = await approvePendingReply(newReply.id);
    
    // Create another pending reply for rejection test
    const rejectReply = await createPendingReply();
    
    // Reject the second pending reply
    const rejectedReply = await rejectPendingReply(rejectReply.id);
    
    // Delete approved and rejected replies
    await deletePendingReply(approvedReply.id);
    await deletePendingReply(rejectedReply.id);
    
    // Verify deletion by getting pending replies again
    const finalReplies = await getPendingReplies();
    
    console.log('\nAll tests completed successfully!');
    console.log(`Initial pending replies: ${initialReplies.length}`);
    console.log(`Final pending replies: ${finalReplies.length}`);
    
  } catch (error) {
    console.error('Error testing pending email reply API:', error);
  }
}

// Use IIFE pattern for top-level await
(async () => {
  try {
    await testPendingEmailReplyAPI();
    console.log('API test completed successfully');
  } catch (err) {
    console.error('Error testing pending email reply API:', err);
  }
})();