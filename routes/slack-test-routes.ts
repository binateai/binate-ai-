/**
 * Test routes for Slack multi-tenant integration
 * These routes allow testing the Slack integration with real users and clients
 */
import { Router } from 'express';
import { storage } from '../storage';
import * as slackController from '../services/slack/controller';
import * as multiTenant from '../services/slack/multi-tenant';

const router = Router();

/**
 * Test route to verify Slack setup
 * GET /api/slack-test/status
 */
router.get('/status', async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = (req.session as any).userId;
    const isPreviewEnv = req.headers.host?.includes('.replit.dev') || req.headers.host?.includes('.repl.co');
    
    // In preview environment, provide sample data for testing
    if (isPreviewEnv) {
      console.log('Preview environment detected, providing sample Slack integration data');
      
      // Return sample data that's useful for testing
      return res.json({
        success: true,
        integrations: [
          {
            id: 1,
            clientId: 101,
            clientName: "Demo Client 1",
            teamName: "Demo Workspace 1",
            isDefault: true,
            channelCount: 3
          },
          {
            id: 2,
            clientId: 102,
            clientName: "Demo Client 2",
            teamName: "Demo Workspace 2",
            isDefault: false,
            channelCount: 2
          }
        ],
        hasSystemIntegration: true
      });
    }
    
    // Production flow - get real data
    const integrations = await multiTenant.getAllClientIntegrations(userId);
    
    // Check for system-level integration
    const hasSystemIntegration = process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID;
    
    return res.json({
      success: true,
      integrations: integrations.map(int => ({
        id: int.id,
        clientId: int.clientId,
        clientName: int.clientName,
        teamName: int.teamName,
        isDefault: int.isDefault,
        channelCount: int.channels?.length || 0
      })),
      hasSystemIntegration
    });
  } catch (error) {
    console.error('Error checking Slack status:', error);
    return res.status(500).json({ success: false, error: 'Failed to check Slack status' });
  }
});

/**
 * Test route to send a test message to a specific client's Slack
 * POST /api/slack-test/send-client-message
 */
router.post('/send-client-message', async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = (req.session as any).userId;
    const { clientId, message } = req.body;
    const isPreviewEnv = req.headers.host?.includes('.replit.dev') || req.headers.host?.includes('.repl.co');
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    // In preview environment, simulate success
    if (isPreviewEnv) {
      console.log('Preview environment detected, simulating successful message send');
      console.log(`Would send message "${message}" to client ID: ${clientId || 'system default'}`);
      
      // Simulate a delay for realism
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return res.json({
        success: true,
        message: 'Test message sent successfully (Preview Environment)',
        details: {
          success: true,
          clientId: clientId || 'system',
          messageContent: message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Create a test task for notification in production
    const testTask = {
      id: Date.now(), // Use timestamp as a fake ID
      title: 'Test Task',
      description: message || 'This is a test notification',
      dueDate: new Date(Date.now() + 60 * 60 * 1000), // Due in 1 hour
      priority: 'high',
      flagged: true
    };
    
    // Send notification with client ID if provided
    const result = await slackController.sendTaskNotification(
      userId,
      clientId ? parseInt(clientId) : null,
      testTask
    );
    
    return res.json({
      success: result.success,
      message: result.success 
        ? 'Test message sent successfully' 
        : `Failed to send test message: ${result.error}`,
      details: result
    });
  } catch (error) {
    console.error('Error sending test message:', error);
    return res.status(500).json({ success: false, error: 'Failed to send test message' });
  }
});

/**
 * Test route to set the default Slack integration for a user
 * POST /api/slack-test/set-default-integration
 */
router.post('/set-default-integration', async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = (req.session as any).userId;
    const { integrationId } = req.body;
    
    if (!integrationId) {
      return res.status(400).json({ success: false, error: 'Integration ID is required' });
    }
    
    // Get all integrations
    const integrations = await multiTenant.getAllClientIntegrations(userId);
    
    // Check if the specified integration exists
    const targetIntegration = integrations.find(int => int.id === parseInt(integrationId));
    if (!targetIntegration) {
      return res.status(404).json({ success: false, error: 'Integration not found' });
    }
    
    // Update all integrations to set isDefault to false
    for (const integration of integrations) {
      await storage.updateSlackIntegration(integration.id, { isDefault: false });
    }
    
    // Set the target integration as default
    await storage.updateSlackIntegration(targetIntegration.id, { isDefault: true });
    
    return res.json({
      success: true,
      message: `Integration for ${targetIntegration.clientName || 'default client'} set as default`
    });
  } catch (error) {
    console.error('Error setting default integration:', error);
    return res.status(500).json({ success: false, error: 'Failed to set default integration' });
  }
});

/**
 * Test route to send a scheduled digest to a specific client
 * POST /api/slack-test/send-digest
 */
router.post('/send-digest', async (req, res) => {
  try {
    // Check if the user is authenticated
    if (!req.session || !(req.session as any).userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = (req.session as any).userId;
    const { clientId } = req.body;
    const isPreviewEnv = req.headers.host?.includes('.replit.dev') || req.headers.host?.includes('.repl.co');
    
    // In preview environment, simulate success with sample data
    if (isPreviewEnv) {
      console.log('Preview environment detected, simulating successful digest send');
      console.log(`Would send digest to client ID: ${clientId || 'system default'}`);
      
      // Simulate a delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return res.json({
        success: true,
        message: 'Test digest sent successfully (Preview Environment)',
        details: {
          success: true,
          clientId: clientId || 'system',
          digestContent: {
            tasks: 5,
            meetings: 3,
            leads: 2,
            date: new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          },
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // For production environment, get real data and send actual digest
    try {
      // Get user's tasks, events, and leads for the digest
      const tasks = await storage.getTasks(userId) || [];
      const events = await storage.getEvents(userId) || [];
      const leads = await storage.getLeads(userId) || [];
      
      // Prepare digest data
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Create a digest message
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Daily Digest: ${formattedDate}*`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `This is a test digest notification ${clientId ? 'for a specific client' : ''}.`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Tasks:* ${tasks.length} total`
            },
            {
              type: 'mrkdwn',
              text: `*Meetings:* ${events.length} scheduled`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View All Tasks',
                emoji: true
              },
              style: 'primary',
              value: 'view_tasks'
            }
          ]
        }
      ];
      
      // Send the digest through multiTenant service
      const result = await multiTenant.sendClientNotification(
        userId,
        clientId ? parseInt(clientId) : null,
        'Daily Digest', // Fallback text
        undefined, // Use default channel
        { blocks }
      );
      
      return res.json({
        success: result.success,
        message: result.success 
          ? 'Test digest sent successfully' 
          : `Failed to send test digest: ${result.error}`,
        details: result
      });
    } catch (storageError) {
      console.error('Error getting data for digest:', storageError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get data for digest'
      });
    }
  } catch (error) {
    console.error('Error sending test digest:', error);
    return res.status(500).json({ success: false, error: 'Failed to send test digest' });
  }
});

export default router;