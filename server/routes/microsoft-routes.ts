/**
 * Microsoft OAuth Routes
 * Handles authentication flow for Microsoft/Outlook integration
 */
import express from 'express';
import { 
  generateMicrosoftAuthUrl, 
  exchangeCodeForToken, 
  storeOutlookCredentials,
  getUserProfile,
  isOutlookConnected,
  disconnectOutlook,
  syncRecentEmails
} from '../services/outlook-service';
import config from '../config';
import { storage } from '../storage';

// For debugging Microsoft auth issues
console.log("Microsoft routes loaded successfully");

const router = express.Router();

// Get the Microsoft auth URL for the OAuth flow
router.get('/auth-url', async (req, res) => {
  try {
    // Get the authenticated user's ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Log the full environment details for debugging
    console.log('Microsoft OAuth Environment Details:');
    console.log(`- Base URL: ${config.baseUrl}`);
    console.log(`- User ID: ${userId}`);
    console.log(`- Microsoft Client ID exists: ${!!process.env.MICROSOFT_CLIENT_ID}`);
    console.log(`- Microsoft Client Secret exists: ${!!process.env.MICROSOFT_CLIENT_SECRET}`);
    
    // Double check client credentials
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
      console.error('Microsoft OAuth credentials missing');
      return res.status(500).json({ 
        error: 'Microsoft API credentials are not configured properly on the server' 
      });
    }

    // Generate the redirect URI based on the current environment
    const redirectUri = `${config.baseUrl}/api/auth/microsoft/callback`;
    console.log(`Redirect URI for Microsoft OAuth: ${redirectUri}`);
    
    try {
      // Generate the authorization URL with extra debugging
      const authUrl = await generateMicrosoftAuthUrl(userId, redirectUri);
      console.log(`Successfully generated Microsoft auth URL: ${authUrl}`);
      
      // Return the URL to the client
      return res.json({ url: authUrl, authUrl: authUrl });
    } catch (msalError) {
      console.error('MSAL Error generating auth URL:', msalError);
      return res.status(500).json({ 
        error: 'Failed to generate Microsoft authentication URL',
        details: msalError.message || 'Unknown MSAL error'
      });
    }
  } catch (error) {
    console.error('Error in Microsoft auth URL route:', error);
    res.status(500).json({ 
      error: 'Failed to generate Microsoft auth URL',
      details: (error as Error).message || 'Unknown server error'
    });
  }
});

// Handle the OAuth callback from Microsoft
router.get('/callback', async (req, res) => {
  try {
    // Extract the authorization code and state (userId) from the query parameters
    const { code, state, error, error_description } = req.query;
    
    // Enhanced logging for troubleshooting auth issues
    console.log(`Microsoft OAuth callback received with state: ${state}`);
    console.log(`Code present: ${!!code}, Error present: ${!!error}`);
    
    // Log detailed error information if present
    if (error) {
      console.error(`Microsoft OAuth error: ${error}, Description: ${error_description}`);
      return res.redirect('/app/settings/email?error=microsoft_auth_failed&reason=' + encodeURIComponent(String(error_description || error)));
    }
    console.log('Microsoft OAuth callback received:', { 
      code: code ? '[REDACTED]' : undefined, 
      state, 
      error, 
      error_description 
    });
    
    // Handle OAuth errors
    if (error) {
      console.error(`Microsoft OAuth error: ${error}: ${error_description}`);
      return res.redirect(`/app/settings/email?error=${encodeURIComponent(error_description as string || 'Authentication failed')}`);
    }
    
    if (!code || !state) {
      return res.redirect('/app/settings/email?error=Missing%20required%20parameters');
    }
    
    // Convert state to userId
    const userId = parseInt(state as string, 10);
    if (isNaN(userId)) {
      return res.redirect('/app/settings/email?error=Invalid%20state%20parameter');
    }
    
    // Generate the redirect URI based on the current environment
    const redirectUri = `${config.baseUrl}/api/auth/microsoft/callback`;
    console.log('Using redirect URI:', redirectUri);
    
    // Exchange the code for access and refresh tokens
    const tokenData = await exchangeCodeForToken(code as string, redirectUri);
    console.log('Successfully obtained Microsoft token data');
    
    // Store the credentials in the database
    await storeOutlookCredentials(userId, tokenData);
    console.log('Microsoft credentials stored for user:', userId);
    
    // Immediately trigger an initial sync to fetch emails
    try {
      const { syncRecentEmails } = await import('../services/outlook-service');
      console.log('Starting initial Microsoft email sync after connection...');
      
      // Fire off sync without awaiting (don't delay the redirect)
      syncRecentEmails(userId, 50)
        .then(result => {
          console.log(`Initial Microsoft email sync completed with ${result.count} emails imported`);
        })
        .catch(syncError => {
          console.error('Error during initial Microsoft email sync:', syncError);
        });
    } catch (syncInitError) {
      console.error('Failed to start initial Microsoft email sync:', syncInitError);
      // Continue with redirect even if sync initialization fails
    }
    
    // Get user profile info to verify connection
    try {
      const userProfile = await getUserProfile(userId);
      console.log(`Successfully verified Microsoft connection for ${userProfile.email || 'user'}`);
      
      // Redirect to the settings page with success message and email
      const userEmail = encodeURIComponent(userProfile.email || '');
      res.redirect(`/app/settings/email?microsoft=connected&email=${userEmail}`);
    } catch (profileError) {
      console.error("Error getting Microsoft user profile:", profileError);
      // Still redirect to success page even if profile fetch fails
      res.redirect('/app/settings/email?microsoft=connected');
    }
  } catch (error: any) {
    console.error('Error in Microsoft OAuth callback:', error);
    const errorMessage = error.message || 'Failed to authenticate with Microsoft';
    res.redirect(`/app/settings/email?error=${encodeURIComponent(errorMessage)}`);
  }
});

// Check if the user is connected to Microsoft
router.get('/connected', async (req, res) => {
  try {
    // Get the authenticated user's ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    console.log(`Checking Microsoft connection status for user ${userId}`);
    
    // Get integration details
    const integration = await storage.getEmailIntegration(userId, 'microsoft');
    let connectionError = null;
    let connectionDetails = null;
    
    if (integration && integration.credentials) {
      try {
        const credentials = JSON.parse(integration.credentials);
        connectionDetails = {
          email: credentials.email || '',
          lastRefreshed: credentials.last_refreshed || null,
          expiresAt: credentials.expires_at ? new Date(credentials.expires_at).toISOString() : null
        };
        
        if (credentials.connection_error) {
          connectionError = credentials.error_message || 'Connection requires attention';
          console.log(`Microsoft connection for user ${userId} has error flag: ${connectionError}`);
        }
      } catch (parseError) {
        console.error(`Error parsing Microsoft credentials for user ${userId}:`, parseError);
      }
    }
    
    // Check if the user is connected to Microsoft
    // This will also attempt to refresh the token and may trigger an automatic sync
    const connected = await isOutlookConnected(userId);
    
    // If connected and there's no auto-sync happening from the isOutlookConnected call,
    // trigger a sync if it's been over 15 minutes since last sync or if lastSynced is null
    if (connected && integration) {
      // Force a sync if we've never synced before or it's been a while
      try {
        const lastSyncedAt = integration.last_synced_at || null;
        const now = new Date();
        const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
        
        if (!lastSyncedAt || new Date(lastSyncedAt) < fifteenMinutesAgo) {
          console.log(`Triggering Microsoft email sync for user ${userId} - last sync was ${lastSyncedAt || 'never'}`);
          // Don't await this call so we don't block the response
          syncRecentEmails(userId).catch(err => {
            console.error(`Error during auto-sync for Microsoft (user ${userId}):`, err);
          });
          
          // Update the last synced timestamp
          await storage.updateEmailIntegrationLastSynced(userId, 'microsoft');
        }
      } catch (syncError) {
        console.error(`Error checking sync status for Microsoft (user ${userId}):`, syncError);
      }
      try {
        const lastSyncTime = integration.lastSynced ? new Date(integration.lastSynced) : null;
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        
        if (!lastSyncTime || lastSyncTime < fifteenMinutesAgo) {
          console.log(`Triggering Microsoft email sync for user ${userId} (last sync was over 15 minutes ago or never)`);
          
          // Don't await this to keep the response fast
          syncRecentEmails(userId, 20).then(result => {
            if (result.success) {
              console.log(`Auto-synced ${result.count} Microsoft emails during connection check for user ${userId}`);
              
              // Update the last synced time
              storage.updateEmailIntegrationLastSynced(userId, 'microsoft').catch(err => {
                console.error(`Failed to update last synced time for user ${userId}:`, err);
              });
            }
          }).catch(err => {
            console.error(`Error syncing emails during connection check for user ${userId}:`, err);
          });
        } else {
          console.log(`Skipping auto-sync for user ${userId}, last sync was less than 15 minutes ago`);
        }
      } catch (syncCheckError) {
        console.error(`Error checking sync state for user ${userId}:`, syncCheckError);
      }
    }
    
    // Return the connected status and any error message
    res.json({ 
      connected,
      error: connectionError,
      details: connectionDetails,
      provider: 'microsoft',
      lastChecked: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Error checking Microsoft connection:', error);
    res.status(500).json({ 
      error: 'Failed to check Microsoft connection',
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Get user profile from Microsoft
router.get('/profile', async (req, res) => {
  try {
    // Get the authenticated user's ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get the user profile from Microsoft
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'Microsoft profile not found' });
    }
    
    // Return the profile to the client
    res.json({ profile });
  } catch (error) {
    console.error('Error getting Microsoft profile:', error);
    res.status(500).json({ error: 'Failed to get Microsoft profile' });
  }
});

// Disconnect from Microsoft
router.post('/disconnect', async (req, res) => {
  try {
    // Get the authenticated user's ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Disconnect from Microsoft
    const success = await disconnectOutlook(userId);
    if (!success) {
      return res.status(500).json({ error: 'Failed to disconnect from Microsoft' });
    }
    
    // Return success to the client
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting from Microsoft:', error);
    res.status(500).json({ error: 'Failed to disconnect from Microsoft' });
  }
});

// Sync emails from Microsoft
router.post('/sync-emails', async (req, res) => {
  try {
    // Get the authenticated user's ID
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if the user has Microsoft connected
    const connected = await isOutlookConnected(userId);
    if (!connected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Microsoft account not connected', 
        count: 0 
      });
    }
    
    // Get max results from request or use default
    const { maxResults = 100 } = req.body || {};
    
    // Sync emails
    console.log(`Syncing Microsoft emails for user ${userId}, max results: ${maxResults}`);
    const result = await syncRecentEmails(userId, maxResults);
    
    // Return the sync result
    res.json(result);
  } catch (error) {
    console.error('Error syncing Microsoft emails:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to sync Microsoft emails: ${error.message || 'Unknown error'}`,
      count: 0
    });
  }
});

export default router;