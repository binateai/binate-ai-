import { Router } from 'express';
import { getAuthClientForUser } from '../services/google-auth';
import { google } from 'googleapis';

const LOG_PREFIX = '[GmailTest]';
const router = Router();

/**
 * Test Gmail API access
 */
router.get('/test', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  try {
    const userId = req.user!.id;
    console.log(`${LOG_PREFIX} Testing Gmail API access for user ${userId}`);
    
    // Get auth client
    const authClient = await getAuthClientForUser(userId);
    if (!authClient) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create auth client. Google connection may not be set up properly.'
      });
    }
    
    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: authClient });
    
    // Try to get user profile (simple test)
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    if (!profile.data || !profile.data.emailAddress) {
      return res.json({
        success: false,
        error: 'Received empty profile from Gmail API'
      });
    }
    
    return res.json({
      success: true,
      message: `Successfully connected to Gmail API for ${profile.data.emailAddress}`,
      messagesTotal: profile.data.messagesTotal || 0,
      threadsTotal: profile.data.threadsTotal || 0,
      historyId: profile.data.historyId
    });
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Gmail API test error:`, error);
    
    let errorMessage = error.message;
    
    // Check for specific error types
    if (error.code === 401 || error.response?.status === 401) {
      errorMessage = 'Authentication error: The access token may be invalid or expired';
    } else if (error.code === 403 || error.response?.status === 403) {
      errorMessage = 'Permission error: The app does not have the required Gmail permissions';
    }
    
    // If there's a detailed error message in the response, use that
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data?.error || error.code || error.status
    });
  }
});

export default router;