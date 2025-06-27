/**
 * Notification Routes
 * Provides API endpoints for testing and managing the notification system
 */
import express from 'express';
import { storage } from '../storage';
import { manualTriggers } from '../services/notification-scheduler';

const router = express.Router();

/**
 * Test sending a digest notification
 * POST /api/notifications/test/digest
 */
router.post('/test/digest', async (req, res) => {
  try {
    // Get user ID from session or use default
    const userId = req.session?.user?.id || 1;
    
    // Trigger a digest notification
    const result = await manualTriggers.triggerDigestForUser(userId);
    
    if (result) {
      res.json({ success: true, message: 'Digest notification sent successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to send digest notification' });
    }
  } catch (error) {
    console.error('Error testing digest notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while sending the notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Test sending a task notification
 * POST /api/notifications/test/task/:taskId
 */
router.post('/test/task/:taskId', async (req, res) => {
  try {
    // Get user ID from session or use default
    const userId = req.session?.user?.id || 1;
    
    // Get task ID from params
    const taskId = parseInt(req.params.taskId, 10);
    
    // Optional client ID for multi-tenant testing
    const clientId = req.body.clientId ? parseInt(req.body.clientId, 10) : null;
    
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    
    // Verify the task exists and belongs to the user
    const task = await storage.getTask(taskId);
    if (!task || task.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    // Trigger a task notification
    const result = await manualTriggers.triggerUrgentTaskNotification(userId, clientId, taskId);
    
    if (result) {
      res.json({ success: true, message: 'Task notification sent successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Failed to send task notification' });
    }
  } catch (error) {
    console.error('Error testing task notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while sending the notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get notification settings
 * GET /api/notifications/settings
 */
router.get('/settings', async (req, res) => {
  try {
    // Get user ID from session or use default
    const userId = req.session?.user?.id || 1;
    
    // Get user settings
    const userSettings = await storage.getUserSettings(userId);
    
    // Get all Slack integrations
    let slackIntegrations = [];
    try {
      slackIntegrations = await storage.getAllSlackIntegrations(userId);
    } catch (error) {
      console.error('Error fetching Slack integrations:', error);
    }
    
    // Return notification settings
    res.json({
      success: true,
      settings: {
        preferredChannels: {
          slack: slackIntegrations.length > 0,
          email: userSettings?.emailNotificationsEnabled || false
        },
        digests: {
          enabled: true,
          times: [
            { hour: 7, minute: 0, label: '7:00 AM' },
            { hour: 12, minute: 0, label: '12:00 PM' },
            { hour: 17, minute: 0, label: '5:00 PM' }
          ]
        },
        realTimeNotifications: {
          urgentTasks: true,
          imminentMeetings: true,
          highPriorityLeads: true
        },
        slackIntegrations: slackIntegrations.map(integration => ({
          id: integration.id,
          clientId: integration.clientId,
          clientName: integration.clientName || 'Default',
          teamName: integration.teamName,
          isDefault: integration.isDefault
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching notification settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;