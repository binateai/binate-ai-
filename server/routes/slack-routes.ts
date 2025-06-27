import { Router } from 'express';
import { storage } from '../storage';
import { 
  generateSlackOAuthUrl, 
  exchangeCodeForToken, 
  saveSlackIntegration, 
  getSlackIntegration, 
  disconnectSlackIntegration, 
  syncSlackChannels,
  sendSlackMessage,
  NotificationType
} from '../services/slack-service';

const router = Router();

// Test route to check Slack configuration
router.get('/test-config', async (req, res) => {
  try {
    const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
    const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
    const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
    const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
    const SLACK_DEFAULT_CHANNEL = process.env.SLACK_CHANNEL_ID;
    
    if (SLACK_CLIENT_ID && SLACK_CLIENT_SECRET && SLACK_SIGNING_SECRET) {
      res.status(200).json({ 
        message: 'Slack configuration present', 
        configured: true,
        systemBotToken: !!SLACK_BOT_TOKEN,
        defaultChannel: !!SLACK_DEFAULT_CHANNEL
      });
    } else {
      const missingConfigs = [];
      if (!SLACK_CLIENT_ID) missingConfigs.push('SLACK_CLIENT_ID');
      if (!SLACK_CLIENT_SECRET) missingConfigs.push('SLACK_CLIENT_SECRET');
      if (!SLACK_SIGNING_SECRET) missingConfigs.push('SLACK_SIGNING_SECRET');
      
      res.status(200).json({ 
        message: 'Slack configuration incomplete', 
        configured: false,
        missingConfigs,
        systemBotToken: !!SLACK_BOT_TOKEN,
        defaultChannel: !!SLACK_DEFAULT_CHANNEL
      });
    }
  } catch (error: unknown) {
    // Enhanced error handling
    let errorMessage = 'Unknown error checking Slack configuration';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error checking Slack configuration:', errorMessage);
    
    res.status(500).json({ 
      error: 'Failed to check Slack configuration', 
      errorCode: 'configuration_check_failed',
      details: errorMessage
    });
  }
});

// Endpoint to start the OAuth flow
router.get('/authorize', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const authUrl = generateSlackOAuthUrl();
    res.json({ url: authUrl });
  } catch (error: unknown) {
    // Enhanced error handling
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error generating Slack OAuth URL:', errorMessage);
    
    res.status(500).json({ 
      error: 'Failed to generate Slack authorization URL', 
      errorCode: 'oauth_url_generation_failed',
      details: errorMessage
    });
  }
});

// OAuth callback endpoint
router.get('/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      return res.redirect('/app/settings?slack_error=' + encodeURIComponent(error as string));
    }
    
    if (!code) {
      return res.redirect('/app/settings?slack_error=missing_code');
    }
    
    if (!req.isAuthenticated()) {
      return res.redirect('/app/auth?slack_error=session_expired');
    }
    
    const userId = req.user.id;
    
    // Exchange the code for an access token
    const tokenData = await exchangeCodeForToken(code as string);
    
    // Save the integration data
    await saveSlackIntegration(userId, tokenData);
    
    // Redirect back to the settings page with success
    res.redirect('/app/settings?slack_connected=true');
  } catch (error: unknown) {
    // Enhanced error handling with detailed logging
    let errorMessage = 'Unknown error';
    let errorCode = 'unknown_error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    // Check for specific error types
    if (errorMessage.includes('invalid_code')) {
      errorCode = 'invalid_code';
    } else if (errorMessage.includes('invalid_client')) {
      errorCode = 'invalid_client';
    } else if (errorMessage.includes('access_denied')) {
      errorCode = 'access_denied';
    }
    
    console.error('Error handling Slack OAuth callback:', {
      userId: req.user?.id,
      errorCode,
      errorDetails: errorMessage
    });
    
    // Redirect with improved error information
    res.redirect(`/app/settings?slack_error=${encodeURIComponent(errorCode)}&slack_error_details=${encodeURIComponent(errorMessage.substring(0, 100))}`);
  }
});

// Get integration status
router.get('/status', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const integration = await getSlackIntegration(userId);
    
    res.json({
      connected: !!integration,
      integration
    });
  } catch (error: unknown) {
    // Enhanced error handling with detailed logging
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error getting Slack integration status:', {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    
    res.status(500).json({ 
      error: 'Failed to get Slack integration status',
      errorCode: 'integration_status_error',
      details: errorMessage
    });
  }
});

// Disconnect Slack integration
router.post('/disconnect', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const result = await disconnectSlackIntegration(userId);
    
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ 
        error: 'Failed to disconnect Slack integration',
        details: result.errorMessage,
        errorCode: result.errorCode 
      });
    }
  } catch (error: unknown) {
    // Enhanced error handling with detailed logging
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error disconnecting Slack integration:', {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    
    res.status(500).json({ 
      error: 'Failed to disconnect Slack integration',
      errorCode: 'disconnect_integration_error',
      details: errorMessage
    });
  }
});

// Sync channels for a user
router.post('/sync-channels', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    await syncSlackChannels(userId);
    
    // Get the updated integration with new channels
    const integration = await getSlackIntegration(userId);
    
    res.json({ success: true, channels: integration.availableChannels });
  } catch (error: unknown) {
    // Enhanced error handling with detailed logging
    let errorMessage = 'Unknown error';
    let errorCode = 'channel_sync_error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Identify specific error types
      if (errorMessage.includes('token_revoked')) {
        errorCode = 'token_revoked';
      } else if (errorMessage.includes('invalid_auth')) {
        errorCode = 'invalid_auth';
      } else if (errorMessage.includes('account_inactive')) {
        errorCode = 'account_inactive';
      }
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error syncing Slack channels:', {
      userId: req.user?.id,
      errorCode,
      errorDetails: errorMessage
    });
    
    res.status(500).json({ 
      error: 'Failed to sync Slack channels',
      errorCode,
      details: errorMessage
    });
  }
});

// Update notification preferences
router.post('/preferences', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const preferences = req.body;
    
    // Update user preferences
    await storage.updateUserPreferences(userId, {
      slackNotifications: preferences
    });
    
    res.json({ success: true });
  } catch (error: unknown) {
    // Enhanced error handling with detailed logging
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error updating Slack preferences:', {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    
    res.status(500).json({
      error: 'Failed to update Slack preferences',
      errorCode: 'update_preferences_error',
      details: errorMessage
    });
  }
});

// Send a test message to verify the integration
router.post('/test-message', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const { channel, notificationType } = req.body;
    
    // Check if integration exists (but don't require it anymore since we have system fallback)
    const integration = await getSlackIntegration(userId);
    const useFallback = !integration || !integration.connected;
    
    // If we're using fallback, let the client know
    const message = useFallback 
      ? "👋 This is a test message from Binate AI. Using system-level Slack integration as fallback!"
      : "👋 This is a test message from Binate AI. Your Slack integration is working correctly!";
    
    // Now we can use sendSlackMessage directly since we're importing it from the module
    // Convert the string notification type to enum if provided
    let notificationTypeEnum: NotificationType | undefined = undefined;
    if (notificationType && Object.keys(NotificationType).includes(notificationType)) {
      notificationTypeEnum = NotificationType[notificationType as keyof typeof NotificationType];
    }
    
    // For test messages, ensure we have a channel - use system default if none provided
    const testChannel = channel || process.env.SLACK_CHANNEL_ID;
    
    // Verify we have a valid channel before proceeding
    if (!testChannel) {
      return res.status(500).json({
        error: 'Failed to send test message',
        details: 'No Slack channel specified and no default system channel configured'
      });
    }
    
    console.log(`Attempting to send Slack test message to channel: ${testChannel}`);
    
    const result = await sendSlackMessage(
      userId,
      message,
      testChannel,
      notificationTypeEnum
    );
    
    if (result.success) {
      res.json({ 
        success: true, 
        usedFallback: useFallback,
        message: useFallback ? 'Message sent using system fallback' : 'Message sent using your Slack integration'
      });
    } else {
      // Use the detailed error information from the result object
      res.status(500).json({ 
        error: 'Failed to send test message', 
        details: result.errorMessage || 'No Slack integration is available. Please connect Slack or ensure system fallback is configured.',
        errorCode: result.errorCode || 'unknown_error',
        debugDetails: result.debugDetails || 'No additional debug information available'
      });
    }
  } catch (error: unknown) {
    console.error('Error sending test message:', error);
    
    let errorDetails = 'Unknown error';
    let errorCode = 'unknown_error';
    let debugDetails = 'No detailed error available';
    
    // Extract detailed debug information 
    if (error instanceof Error) {
      debugDetails = error.message;
    } else if (error !== null && error !== undefined) {
      debugDetails = String(error);
    }
    
    const slackError = error as any;
    
    // Handle specific Slack API errors with user-friendly messages
    if (slackError?.data?.error === 'not_in_channel') {
      errorDetails = 'The Slack bot needs to be invited to the channel. Please add the bot to your channel with /invite @BinateAI.';
      errorCode = 'not_in_channel';
    } else if (slackError?.data?.error === 'channel_not_found') {
      errorDetails = 'The specified Slack channel could not be found. Please check the channel ID.';
      errorCode = 'channel_not_found';
    } else if (slackError?.data?.error === 'invalid_auth') {
      errorDetails = 'Invalid Slack authentication. Please reconnect your Slack account.';
      errorCode = 'invalid_auth';
    } else if (slackError?.data?.error === 'token_revoked') {
      errorDetails = 'Slack access has been revoked. Please reconnect your Slack account.';
      errorCode = 'token_revoked';
    } else if (error instanceof Error) {
      errorDetails = error.message;
    }
    
    res.status(500).json({ 
      error: 'Failed to send test message', 
      details: errorDetails,
      errorCode: errorCode,
      debugDetails: debugDetails
    });
  }
});

// Get default Slack channel
router.get('/default-channel', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const defaultChannel = await storage.getDefaultSlackChannel(userId);
    
    res.json({
      defaultChannel: defaultChannel || null
    });
  } catch (error: unknown) {
    // Enhanced error handling with detailed logging
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error getting default Slack channel:', {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    
    res.status(500).json({ 
      error: 'Failed to get default Slack channel',
      errorCode: 'default_channel_fetch_error',
      details: errorMessage
    });
  }
});

// Set default Slack channel
router.post('/default-channel', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const { channelId } = req.body;
    
    if (!channelId) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'Channel ID is required'
      });
    }
    
    const success = await storage.setDefaultSlackChannel(userId, channelId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({
        error: 'Failed to set default Slack channel',
        details: 'Database operation failed'
      });
    }
  } catch (error: unknown) {
    // Enhanced error handling with detailed logging
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error setting default Slack channel:', {
      userId: req.user?.id,
      errorDetails: errorMessage
    });
    
    res.status(500).json({ 
      error: 'Failed to set default Slack channel',
      errorCode: 'default_channel_update_error',
      details: errorMessage
    });
  }
});

export default router;