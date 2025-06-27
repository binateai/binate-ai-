/**
 * Microsoft Outlook Integration Service
 * 
 * This service provides integration with Microsoft Outlook via Microsoft Graph API
 * and handles OAuth authentication, message retrieval, and email operations.
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import {
  ConfidentialClientApplication,
  Configuration,
  AuthorizationUrlRequest,
  AuthorizationCodeRequest
} from '@azure/msal-node';
import config from '../config';
import { storage } from '../storage';

// Microsoft Graph permissions scope required
const OUTLOOK_SCOPES = [
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.Read',
  'Calendars.ReadWrite'
];

// MSAL configuration for Microsoft authentication
const msalConfig: Configuration = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    authority: 'https://login.microsoftonline.com/common'
  }
};

// Create MSAL client application for authentication
const cca = new ConfidentialClientApplication(msalConfig);

/**
 * Generate an authorization URL for Microsoft OAuth flow
 */
export async function generateMicrosoftAuthUrl(userId: number, redirectUri: string): Promise<string> {
  // Log environment details for troubleshooting
  console.log(`Generating Microsoft auth URL with redirectUri: ${redirectUri}`);
  console.log(`Microsoft client ID status: ${process.env.MICROSOFT_CLIENT_ID ? 'Available' : 'Missing'}`);
  
  const authUrlParameters: AuthorizationUrlRequest = {
    scopes: OUTLOOK_SCOPES,
    redirectUri,
    state: userId.toString(),
    // Add these specific parameters to improve compatibility
    prompt: 'select_account', // Force account selection every time
    responseMode: 'query' // Ensure response comes as query parameters
  };

  try {
    // Explicitly await and catch any errors
    const authUrl = await cca.getAuthCodeUrl(authUrlParameters);
    console.log('Generated Microsoft auth URL successfully');
    return authUrl;
  } catch (error) {
    console.error('Error generating Microsoft auth URL:', error);
    throw new Error(`Failed to generate Microsoft auth URL: ${(error as Error).message || 'Unknown error'}`);
  }
}

/**
 * Exchange an authorization code for access and refresh tokens
 */
export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
  try {
    console.log(`Attempting to exchange code for token with redirect URI: ${redirectUri}`);
    
    const tokenRequest: AuthorizationCodeRequest = {
      code,
      scopes: OUTLOOK_SCOPES,
      redirectUri
    };

    const response = await cca.acquireTokenByCode(tokenRequest);
    console.log("Successfully acquired token from Microsoft");
    return response;
  } catch (error: any) {
    console.error('Error exchanging code for token:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Check for specific error conditions
    if (error.errorCode === 'invalid_grant') {
      throw new Error('Invalid authorization code. Please try connecting again.');
    } else if (error.errorCode === 'invalid_client') {
      throw new Error('Invalid client configuration. Please check Microsoft app credentials.');
    }
    
    throw new Error(`Authentication error: ${error.message || 'Unknown error during Microsoft authentication'}`);
  }
}

/**
 * Store Microsoft OAuth credentials for a user
 */
export async function storeOutlookCredentials(userId: number, tokenData: any): Promise<void> {
  try {
    // Calculate proper expiration time (add buffer for safety)
    const expiresAt = tokenData.expiresOn ? 
      tokenData.expiresOn.getTime() : 
      Date.now() + (3600 * 1000); // Default 1 hour if no expiry provided

    // Process and format the token data for storage
    const credentials = {
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      expires_at: expiresAt,
      scope: Array.isArray(tokenData.scopes) ? tokenData.scopes.join(' ') : (tokenData.scopes || OUTLOOK_SCOPES.join(' ')),
      id_token: tokenData.idToken,
      email: tokenData.account?.username || tokenData.account?.homeAccountId || '',
      token_type: 'Bearer',
      provider: 'microsoft'
    };

    console.log('Storing Microsoft credentials for user:', userId);
    console.log('Token expires at:', new Date(expiresAt).toISOString());
    console.log('User email:', credentials.email);
    
    await storage.storeEmailIntegration(userId, 'microsoft', JSON.stringify(credentials));
    console.log('Microsoft credentials stored successfully to database');
    
    // Verify the storage worked by attempting to retrieve it
    const verification = await storage.getEmailIntegration(userId, 'microsoft');
    if (verification) {
      console.log('✓ Microsoft integration verified in database');
    } else {
      console.error('✗ Microsoft integration verification failed - not found in database');
      throw new Error('Failed to verify Microsoft integration storage');
    }
  } catch (error) {
    console.error('Error storing Microsoft credentials:', error);
    throw error;
  }
}

/**
 * Refresh the Microsoft access token if expired
 */
export async function refreshMicrosoftToken(userId: number): Promise<string | null> {
  try {
    // Retrieve user's email integration
    const integration = await storage.getEmailIntegration(userId, 'microsoft');
    if (!integration || !integration.connected) {
      console.log(`No active Microsoft integration found for user ${userId}`);
      return null;
    }

    let credentials;
    try {
      credentials = JSON.parse(integration.credentials);
    } catch (parseError) {
      console.error(`Failed to parse Microsoft credentials for user ${userId}:`, parseError);
      return null;
    }
    
    // Validate credentials format
    if (!credentials || !credentials.refresh_token) {
      console.error(`Invalid Microsoft credentials format for user ${userId} - missing refresh token`);
      
      // Mark the connection as having issues
      await storage.updateEmailIntegration(userId, 'microsoft', JSON.stringify({
        ...credentials,
        connection_error: true,
        error_message: 'Invalid credentials format. Please reconnect your Microsoft account.',
        error_time: new Date().toISOString()
      }));
      
      return null;
    }
    
    // Check if token is expired or about to expire (within 30 minutes)
    // Extended buffer time to ensure we refresh before expiration
    if (credentials.expires_at && credentials.expires_at > Date.now() + 30 * 60 * 1000) {
      const expiresInMinutes = Math.floor((credentials.expires_at - Date.now()) / 60000);
      console.log(`Using existing Microsoft token for user ${userId} (expires in ${expiresInMinutes} minutes)`);
      
      // Log a warning if token is going to expire in less than 2 hours
      if (expiresInMinutes < 120) {
        console.log(`Warning: Microsoft token for user ${userId} will expire soon (${expiresInMinutes} minutes)`);
      }
      
      return credentials.access_token;
    }

    console.log(`Microsoft token expired or expiring soon for user ${userId}, refreshing...`);
    
    // Add a timestamp for tracking refresh attempts
    const refreshStartTime = Date.now();

    // Token is expired, refresh it
    const response = await cca.acquireTokenByRefreshToken({
      refreshToken: credentials.refresh_token,
      scopes: OUTLOOK_SCOPES
    });

    if (!response || !response.accessToken) {
      console.error(`Failed to refresh Microsoft token for user ${userId}: No valid token received`);
      
      // Mark the connection as having issues
      await storage.updateEmailIntegration(userId, 'microsoft', JSON.stringify({
        ...credentials,
        connection_error: true,
        error_message: 'Token refresh failed. Please reconnect your Microsoft account.',
        error_time: new Date().toISOString()
      }));
      
      return null;
    }

    console.log(`Successfully refreshed Microsoft token for user ${userId}`);
    
    // Calculate proper expiration - if expiresOn is available use it, otherwise use default 1 hour
    const expiresAt = response.expiresOn 
      ? response.expiresOn.getTime() 
      : Date.now() + 3600 * 1000;
    
    // Always keep the existing refresh token if the new one isn't provided
    // This ensures we don't lose refresh capability
    const refreshToken = response.refreshToken || credentials.refresh_token;
    
    // Store the new tokens with all required fields
    const updatedCredentials = {
      access_token: response.accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      scope: Array.isArray(response.scopes) ? response.scopes.join(' ') : response.scopes || credentials.scope,
      id_token: response.idToken || credentials.id_token,
      email: response.account?.username || credentials.email || '',
      last_refreshed: new Date().toISOString(),
      connection_error: false // Reset any previous error state
    };

    // Update storage with new credentials
    await storage.updateEmailIntegration(userId, 'microsoft', JSON.stringify(updatedCredentials));
    console.log(`Updated Microsoft credentials stored for user ${userId}, expires in ${Math.round((expiresAt - Date.now())/60000)} minutes`);
    
    return updatedCredentials.access_token;
  } catch (error) {
    console.error(`Error refreshing Microsoft token for user ${userId}:`, error);
    
    // Get the integration to update with error info
    const integration = await storage.getEmailIntegration(userId, 'microsoft');
    if (integration) {
      let credentials;
      try {
        credentials = JSON.parse(integration.credentials);
      } catch (e) {
        credentials = {};
      }
      
      // For specific token errors, mark the connection as having problems
      const errorMessage = typeof error === 'string' ? error.toLowerCase() : 
        ((error as any)?.message ? (error as any).message.toLowerCase() : error.toString().toLowerCase());
      
      // Handle a wider range of Microsoft token errors more gracefully
      if (errorMessage.includes('invalid_grant') || 
          errorMessage.includes('token expired') || 
          errorMessage.includes('interaction_required') ||
          errorMessage.includes('aadsts') || // Catch all AADSTS error codes
          errorMessage.includes('expired') ||
          errorMessage.includes('invalid token') ||
          errorMessage.includes('unauthorized')) {
        
        console.error(`Microsoft refresh token invalid or expired for user ${userId}, marking as problematic`);
        console.error(`Detailed error message: ${errorMessage}`);
        
        // Mark the integration as having connection issues rather than disconnecting
        // This allows us to prompt the user to reconnect while preserving their settings
        await storage.updateEmailIntegration(userId, 'microsoft', JSON.stringify({
          ...credentials,
          connection_error: true,
          error_message: 'Authentication token expired. Please reconnect your Microsoft account.',
          error_time: new Date().toISOString(),
          error_details: errorMessage.substring(0, 200) // Store limited details for debugging
        }));
      }
    }
    
    return null; // Return null instead of throwing to prevent cascade failures
  }
}

/**
 * Create a Microsoft Graph client for a user
 */
export async function createMicrosoftGraphClient(userId: number): Promise<Client | null> {
  try {
    const accessToken = await refreshMicrosoftToken(userId);
    if (!accessToken) {
      return null;
    }

    // Create an authentication provider using the access token
    const authProvider = {
      getAccessToken: async () => accessToken
    };

    // Initialize the Microsoft Graph client
    const client = Client.initWithMiddleware({
      authProvider
    });

    return client;
  } catch (error) {
    console.error(`Error creating Microsoft Graph client for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get user profile information
 */
export async function getUserProfile(userId: number): Promise<any | null> {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return null;
    }

    const profile = await client.api('/me').get();
    return profile;
  } catch (error) {
    console.error(`Error fetching Microsoft user profile for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get messages from the user's Outlook inbox
 */
export async function getMessages(userId: number, options: { maxResults?: number, filter?: string } = {}): Promise<any[]> {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return [];
    }

    // Build the query
    let query = client.api('/me/messages')
      .select('id,subject,bodyPreview,receivedDateTime,from,toRecipients,hasAttachments,importance,isRead')
      .orderby('receivedDateTime DESC');

    // Apply filter if provided
    if (options.filter) {
      query = query.filter(options.filter);
    }

    // Apply limit if provided
    if (options.maxResults) {
      query = query.top(options.maxResults);
    }

    const response = await query.get();
    return response.value || [];
  } catch (error) {
    console.error(`Error fetching Outlook messages for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get a specific message by ID
 */
export async function getMessage(userId: number, messageId: string): Promise<any | null> {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return null;
    }

    const message = await client.api(`/me/messages/${messageId}`)
      .select('id,subject,body,receivedDateTime,from,toRecipients,ccRecipients,hasAttachments')
      .expand('attachments')
      .get();

    return message;
  } catch (error) {
    console.error(`Error fetching Outlook message for user ${userId}:`, error);
    return null;
  }
}

/**
 * Send an email via Outlook
 */
export async function sendEmail(userId: number, emailData: {
  subject: string,
  body: string,
  toRecipients: string[],
  ccRecipients?: string[],
  bccRecipients?: string[],
  isHtml?: boolean
}): Promise<boolean> {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      throw new Error('Microsoft account not connected. Please connect your Microsoft account in Settings to use this feature.');
    }

    const message = {
      subject: emailData.subject,
      body: {
        contentType: emailData.isHtml ? 'html' : 'text',
        content: emailData.body
      },
      toRecipients: emailData.toRecipients.map(email => ({
        emailAddress: { address: email }
      }))
    };

    // Add CC recipients if provided
    if (emailData.ccRecipients && emailData.ccRecipients.length > 0) {
      message['ccRecipients'] = emailData.ccRecipients.map(email => ({
        emailAddress: { address: email }
      }));
    }

    // Add BCC recipients if provided
    if (emailData.bccRecipients && emailData.bccRecipients.length > 0) {
      message['bccRecipients'] = emailData.bccRecipients.map(email => ({
        emailAddress: { address: email }
      }));
    }

    await client.api('/me/sendMail').post({
      message,
      saveToSentItems: true
    });

    return true;
  } catch (error) {
    console.error(`Error sending email for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get calendar events
 */
export async function getCalendarEvents(userId: number, options: { 
  startDateTime?: string, 
  endDateTime?: string,
  maxResults?: number
} = {}): Promise<any[]> {
  try {
    const client = await createMicrosoftGraphClient(userId);
    if (!client) {
      return [];
    }

    let query = client.api('/me/calendar/events')
      .select('id,subject,bodyPreview,start,end,location,attendees,organizer')
      .orderby('start/dateTime');
    
    // Apply date filters if provided
    if (options.startDateTime && options.endDateTime) {
      query = query.filter(`start/dateTime ge '${options.startDateTime}' and end/dateTime le '${options.endDateTime}'`);
    }

    // Apply limit if provided
    if (options.maxResults) {
      query = query.top(options.maxResults);
    }

    const response = await query.get();
    return response.value || [];
  } catch (error) {
    console.error(`Error fetching Outlook calendar events for user ${userId}:`, error);
    return [];
  }
}

/**
 * Check if a user has connected their Microsoft account
 * Also attempts to refresh token and sync emails if connection is valid
 */
export async function isOutlookConnected(userId: number): Promise<boolean> {
  try {
    console.log(`[Microsoft] Checking connection status for user ${userId}`);
    
    // Get integration details
    const integration = await storage.getEmailIntegration(userId, 'microsoft');
    if (!integration || !integration.connected) {
      console.log(`[Microsoft] No active integration found for user ${userId}`);
      return false;
    }
    
    // Try to parse credentials to check for connection_error flag
    try {
      const credentials = JSON.parse(integration.credentials);
      
      // If there's a connection error flag, we need to check if we can recover
      if (credentials.connection_error) {
        console.log(`[Microsoft] Connection for user ${userId} has error flag: ${credentials.error_message}`);
        
        // Try to refresh the token to see if we can recover
        const refreshedToken = await refreshMicrosoftToken(userId);
        if (!refreshedToken) {
          console.log(`[Microsoft] Could not recover connection for user ${userId}, token refresh failed`);
          return false;
        }
        
        console.log(`[Microsoft] Successfully recovered connection for user ${userId}`);
        
        // Update the credentials to clear the error flag
        try {
          credentials.connection_error = false;
          credentials.error_message = '';
          credentials.last_refreshed = new Date().toISOString();
          await storage.updateEmailIntegration(userId, 'microsoft', JSON.stringify(credentials));
          
          // Also update the last synced timestamp
          await storage.updateEmailIntegrationLastSynced(userId, 'microsoft');
        } catch (updateError) {
          console.error(`[Microsoft] Error updating credentials after recovery for user ${userId}:`, updateError);
          // Continue anyway since we have a valid token
        }
      }
      
      // Attempt to refresh token and sync recent emails when checking connection
      // This ensures emails are loaded even if the user just checks the connection
      try {
        console.log(`[Microsoft] Refreshing token and syncing emails for user ${userId}`);
        const token = await refreshMicrosoftToken(userId);
        
        if (token) {
          // Token refresh was successful, update the last synced timestamp
          await storage.updateEmailIntegrationLastSynced(userId, 'microsoft');
          
          // Sync a small batch of emails without slowing down the connection check
          syncRecentEmails(userId, 10).then(result => {
            if (result.success) {
              console.log(`[Microsoft] Auto-synced ${result.count} emails during connection check for user ${userId}`);
            } else {
              console.warn(`[Microsoft] Auto-sync during connection check failed for user ${userId}: ${result.error}`);
            }
          }).catch(err => {
            console.error(`[Microsoft] Error in auto-sync during connection check for user ${userId}:`, err);
          });
          
          return true;
        } else {
          console.log(`[Microsoft] Token refresh failed for user ${userId} during connection check`);
          
          // Mark the connection as having an error
          try {
            credentials.connection_error = true;
            credentials.error_message = 'Token refresh failed. Please reconnect your Microsoft account.';
            credentials.error_time = new Date().toISOString();
            await storage.updateEmailIntegration(userId, 'microsoft', JSON.stringify(credentials));
          } catch (updateError) {
            console.error(`[Microsoft] Error updating credentials with error state for user ${userId}:`, updateError);
          }
          
          return false;
        }
      } catch (refreshError) {
        console.error(`[Microsoft] Error refreshing token during connection check for user ${userId}:`, refreshError);
        
        // Mark the connection as having an error
        try {
          credentials.connection_error = true;
          credentials.error_message = 'Token refresh failed. Please reconnect your Microsoft account.';
          credentials.error_time = new Date().toISOString();
          await storage.updateEmailIntegration(userId, 'microsoft', JSON.stringify(credentials));
        } catch (updateError) {
          console.error(`[Microsoft] Error updating credentials with error state for user ${userId}:`, updateError);
        }
        
        return false;
      }
    } catch (parseError) {
      console.error(`[Microsoft] Error parsing credentials for user ${userId}:`, parseError);
      return false;
    }
  } catch (error) {
    console.error(`[Microsoft] Error checking connection for user ${userId}:`, error);
    return false;
  }
}

/**
 * Disconnect a user's Microsoft account
 */
export async function disconnectOutlook(userId: number): Promise<boolean> {
  try {
    await storage.deleteEmailIntegration(userId, 'microsoft');
    return true;
  } catch (error) {
    console.error(`Error disconnecting Outlook for user ${userId}:`, error);
    return false;
  }
}

/**
 * Convert Outlook message format to our internal email format for consistency
 */
export function convertOutlookMessageToInternalFormat(message: any): any {
  return {
    id: message.id,
    threadId: message.conversationId || message.id,
    messageId: message.id,
    subject: message.subject || '(No subject)',
    from: message.from?.emailAddress?.address || '',
    fromName: message.from?.emailAddress?.name || '',
    to: message.toRecipients?.map(r => r.emailAddress.address).join(', ') || '',
    cc: message.ccRecipients?.map(r => r.emailAddress.address).join(', ') || '',
    date: new Date(message.receivedDateTime),
    body: message.body?.content || message.bodyPreview || '',
    bodyType: message.body?.contentType || 'text',
    hasAttachments: message.hasAttachments || false,
    isRead: message.isRead || false,
    importance: message.importance || 'normal',
    source: 'microsoft'
  };
}

/**
 * Sync recent emails from Outlook
 */
export async function syncRecentEmails(userId: number, maxResults = 100): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    console.log(`Starting Microsoft email sync for user ${userId}, fetching up to ${maxResults} emails...`);
    
    // Get the user's last sync timestamp
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User ${userId} not found when attempting to sync Microsoft emails`);
      return { success: false, count: 0, error: 'User not found' };
    }

    // First verify connection and refresh token if needed
    try {
      const accessToken = await refreshMicrosoftToken(userId);
      if (!accessToken) {
        console.error(`Unable to refresh Microsoft token for user ${userId}, connection may be broken`);
        return { 
          success: false, 
          count: 0, 
          error: 'Microsoft connection is not valid. Please reconnect your Microsoft account.' 
        };
      }
      console.log(`Successfully verified Microsoft token for user ${userId}`);
    } catch (tokenError) {
      console.error(`Token refresh failed for Microsoft sync for user ${userId}:`, tokenError);
      return { 
        success: false, 
        count: 0, 
        error: 'Failed to authenticate with Microsoft. Please reconnect your account.' 
      };
    }

    // Get recent messages
    console.log(`Fetching Microsoft messages for user ${userId}...`);
    const messages = await getMessages(userId, { maxResults });
    
    if (!messages || !messages.length) {
      console.log(`No Microsoft messages found for user ${userId}`);
      // Still mark as success but with 0 count
      // Update the last sync timestamp even if no emails were found
      await storage.updateUserLastEmailSyncDate(userId, new Date());
      return { success: true, count: 0 };
    }
    
    console.log(`Found ${messages.length} Microsoft messages for user ${userId}`);

    let count = 0;
    let errorCount = 0;
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 20;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      console.log(`Processing Microsoft email batch ${i / batchSize + 1} (${batch.length} emails) for user ${userId}`);
      
      for (const message of batch) {
        try {
          // Convert to our internal format
          const email = convertOutlookMessageToInternalFormat(message);
          
          if (!email.messageId) {
            console.warn(`Skipping Microsoft email with missing messageId for user ${userId}`);
            continue;
          }
          
          // Check if this email already exists in our database
          const existingEmail = await storage.getEmailByMessageId(userId, email.messageId);
          if (!existingEmail) {
            // Get full message with body content if not already complete
            let fullBody = email.body;
            if (!fullBody || fullBody.length < 100) {
              try {
                const fullMessage = await getMessage(userId, email.messageId);
                if (fullMessage && fullMessage.body && fullMessage.body.content) {
                  fullBody = fullMessage.body.content;
                }
              } catch (bodyError) {
                console.warn(`Failed to get full body for message ${email.messageId}:`, bodyError);
                // Continue with the preview we have
              }
            }
            
            // Store the new email
            await storage.storeEmail({
              userId,
              threadId: email.threadId,
              messageId: email.messageId,
              subject: email.subject,
              from: email.from,
              to: email.to,
              body: fullBody || email.body,
              date: email.date,
              hasAttachments: email.hasAttachments,
              isRead: email.isRead,
              processed: false,
              source: 'microsoft'
            });
            count++;
            
            console.log(`Saved Microsoft email ${email.messageId} from ${email.from} with subject "${email.subject.substring(0, 30)}..." to database`);
          } else {
            console.log(`Skipping already imported Microsoft email ${email.messageId}`);
          }
        } catch (emailError) {
          console.error(`Error processing Microsoft email for user ${userId}:`, emailError);
          errorCount++;
        }
      }
    }

    // Update the last sync timestamp
    await storage.updateUserLastEmailSyncDate(userId, new Date());
    
    console.log(`Microsoft email sync complete for user ${userId}: ${count} new emails imported, ${errorCount} errors`);
    return { 
      success: true, 
      count, 
      error: errorCount > 0 ? `Sync completed with ${errorCount} errors` : undefined 
    };
  } catch (error) {
    console.error(`Error syncing Microsoft emails for user ${userId}:`, error);
    return { 
      success: false, 
      count: 0, 
      error: `Failed to sync Microsoft emails: ${error.message || 'Unknown error'}` 
    };
  }
}