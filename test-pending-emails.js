// Test script for pending email reply functionality
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import storage with proper path - using .ts extension
import { storage } from './server/storage.ts';

async function testPendingEmailReplies() {
  console.log('Testing pending email reply functionality...');
  
  // Create a test pending email reply
  const testReply = await storage.createPendingEmailReply({
    userId: 1,
    messageId: 'test-message-id-123',
    to: 'test@example.com',
    subject: 'RE: Test Subject',
    content: '<p>This is a test reply content.</p>',
    originalMessageData: {
      id: 'test-message-id-123',
      threadId: 'test-thread-id-123',
      subject: 'Test Subject',
      from: 'sender@example.com'
    },
    status: 'pending'
  });
  
  console.log('Created pending email reply:', testReply);
  
  // Get pending email replies for user
  const pendingReplies = await storage.getPendingEmailReplies(1);
  console.log(`Found ${pendingReplies.length} pending email replies for user 1`);
  pendingReplies.forEach((reply, index) => {
    console.log(`Reply ${index + 1}:`, {
      id: reply.id,
      subject: reply.subject,
      to: reply.to,
      status: reply.status,
      createdAt: reply.createdAt
    });
  });
  
  // Update the reply status
  if (pendingReplies.length > 0) {
    const replyToUpdate = pendingReplies[0];
    console.log(`Updating reply ${replyToUpdate.id} to 'approved'`);
    
    const updatedReply = await storage.updatePendingEmailReply(replyToUpdate.id, {
      status: 'approved',
      actionTaken: 'approved',
      actionDate: new Date()
    });
    
    console.log('Updated reply:', updatedReply);
    
    // Get the updated reply by ID
    const retrievedReply = await storage.getPendingEmailReply(updatedReply.id);
    console.log('Retrieved reply by ID:', retrievedReply);
    
    // Delete the reply
    console.log(`Deleting reply ${retrievedReply.id}`);
    const deleteResult = await storage.deletePendingEmailReply(retrievedReply.id);
    console.log('Delete result:', deleteResult);
    
    // Verify deletion
    const remainingReplies = await storage.getPendingEmailReplies(1);
    console.log(`Remaining replies after deletion: ${remainingReplies.length}`);
  }
}

// Use IIFE pattern for top-level await
(async () => {
  try {
    await testPendingEmailReplies();
    console.log('Test completed successfully');
  } catch (err) {
    console.error('Error testing pending email replies:', err);
  }
})();