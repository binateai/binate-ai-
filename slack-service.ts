import { WebClient, WebClientOptions } from '@slack/web-api';
import { storage } from '../storage';
import config from '../config';
import { userPreferences } from '@shared/schema';
import { z } from 'zod';

// Check if Slack environment variables are set
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_DEFAULT_CHANNEL = process.env.SLACK_CHANNEL_ID;

// Initialize a default WebClient for system-level notifications
const systemWebClient = SLACK_BOT_TOKEN ? new WebClient(SLACK_BOT_TOKEN) : null;

// Default scope for Slack OAuth
const DEFAULT_SCOPE = [
  'chat:write',
  'channels:read',
  'channels:join',
  'chat:write.public',
  'incoming-webhook',
];

// Notification types for channel customization
export enum NotificationType {
  TASK_REMINDER = 'task_reminder',
  MEETING_REMINDER = 'meeting_reminder',
  INVOICE_DUE = 'invoice_due',
  LEAD_DETECTED = 'lead_detected',
  DAILY_SUMMARY = 'daily_summary',
  EXPENSE_ALERT = 'expense_alert'
}

/**
 * Generate the Slack OAuth URL for authorizing the app
 */
export function generateSlackOAuthUrl(): string {
  if (!SLACK_CLIENT_ID) {
    throw new Error('Slack client ID is not configured');
  }
  
  // Dynamically use the current domain for the redirect URI
  const redirectUri = `${config.appUrl}/api/integrations/slack/callback`;
  
  // Encode the state parameter with timestamp to prevent CSRF
  const state = Buffer.from(Date.now().toString()).toString('base64');

  // Build the OAuth URL
  const url = new URL('https://slack.com/oauth/v2/authorize');
  url.searchParams.append('client_id', SLACK_CLIENT_ID);
  url.searchParams.append('scope', DEFAULT_SCOPE.join(' '));
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('state', state);
  
  return url.toString();
}

/**
 * Exchange the temporary code for an access token
 */
export async function exchangeCodeForToken(code: string): Promise<any> {
  try {
    if (!SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
      throw new Error('Slack client credentials are not configured');
    }
    
    const redirectUri = `${config.appUrl}/api/integrations/slack/callback`;
    
    // Use fetch to make the API call
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });
    
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown HTTP error';
      console.error(`HTTP error during Slack OAuth: ${response.status} ${statusText}`);
      throw new Error(`HTTP error during Slack OAuth: ${response.status} ${statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.ok) {
      const errorDetails = data.error || 'Unknown API error';
      console.error(`Slack OAuth API error: ${errorDetails}`);
      throw new Error(`Slack OAuth error: ${errorDetails}`);
    }
    
    return data;
  } catch (error: unknown) {
    // Enhanced error handling
    let errorMessage = 'Unknown error during OAuth flow';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error('Error exchanging code for Slack token:', {
      errorDetails: errorMessage,
      codeProvided: !!code,
      clientIdConfigured: !!SLACK_CLIENT_ID,
      clientSecretConfigured: !!SLACK_CLIENT_SECRET
    });
    
    // Create a new error with more context to help with debugging
    const enhancedError = new Error(`Slack OAuth exchange failed: ${errorMessage}`);
    throw enhancedError;
  }
}

/**
 * Create a Slack WebClient instance for a user with optional client ID for multi-tenant support
 */
export async function createWebClient(userId: number, clientId?: number): Promise<WebClient | null> {
  try {
    const integration = await storage.getSlackIntegration(userId, clientId);
    
    if (!integration?.accessToken) {
      console.log(`Using system WebClient for user ${userId} (no ${clientId ? 'client-specific' : 'personal'} integration found)`);
      // Return system WebClient if available
      if (process.env.SLACK_BOT_TOKEN) {
        return new WebClient(process.env.SLACK_BOT_TOKEN);
      }
      return null;
    }
    
    // Create the WebClient with the access token
    return new WebClient(integration.accessToken);
  } catch (error: unknown) {
    // Enhanced error handling
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error(`Error creating Slack WebClient for user ${userId} and client ${clientId || 'default'}:`, errorMessage);
    return null;
  }
}

/**
 * Store the Slack integration for a user
 */
export async function saveSlackIntegration(userId: number, data: any): Promise<void> {
  try {
    // Validate required data
    if (!data.access_token) {
      throw new Error('Missing required Slack access token in OAuth response');
    }
    
    if (!data.team?.id || !data.team?.name) {
      throw new Error('Missing required Slack team information in OAuth response');
    }
    
    const integration = {
      userId,
      accessToken: data.access_token,
      scope: data.scope,
      teamId: data.team.id,
      teamName: data.team.name,
      botUserId: data.bot_user_id,
      authedUser: data.authed_user,
      incomingWebhook: data.incoming_webhook,
      connected: true,
      connectedAt: new Date(),
      availableChannels: [], // Will be filled by syncChannels
    };
    
    await storage.saveSlackIntegration(userId, integration);
    console.log(`Successfully saved Slack integration for user ${userId} (team: ${data.team.name})`);
    
    // Sync channels after saving integration
    await syncSlackChannels(userId);
  } catch (error: unknown) {
    // Enhanced error handling
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error(`Error saving Slack integration for user ${userId}:`, {
      errorDetails: errorMessage,
      hasAccessToken: !!data.access_token,
      hasTeamInfo: !!(data.team?.id && data.team?.name),
      debugInfo: {
        teamId: data.team?.id || 'missing',
        teamName: data.team?.name || 'missing',
        botUserId: data.bot_user_id || 'missing',
        hasWebhook: !!data.incoming_webhook
      }
    });
    
    // Create an enhanced error with more context
    const enhancedError = new Error(`Failed to save Slack integration: ${errorMessage}`);
    throw enhancedError;
  }
}

/**
 * Sync available channels for a user's Slack workspace
 */
export async function syncSlackChannels(userId: number): Promise<void> {
  try {
    const webClient = await createWebClient(userId);
    
    if (!webClient) {
      throw new Error('Failed to create Slack web client');
    }
    
    // Get all channels the bot has access to
    const result = await webClient.conversations.list({
      types: 'public_channel,private_channel',
    });
    
    if (!result.ok) {
      throw new Error(`Failed to get channels: ${result.error}`);
    }
    
    const channels = result.channels?.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
    })) || [];
    
    // Update integration with available channels
    await storage.updateSlackIntegration(userId, {
      availableChannels: channels,
      lastSyncedAt: new Date(),
    });
  } catch (error: unknown) {
    // Enhanced error handling
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.error(`Error syncing Slack channels for user ${userId}:`, errorMessage);
    
    // Rethrow with more context
    if (error instanceof Error) {
      throw new Error(`Failed to sync Slack channels: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Send a message to a user's Slack workspace with multi-tenant support
 */
export async function sendSlackMessage(
  userId: number,
  message: string,
  channelId?: string,
  notificationType?: NotificationType,
  clientId?: number
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  try {
    // Try to get client-specific or user's connected Slack client
    let webClient = await createWebClient(userId, clientId);
    
    // Fall back to system client if no integration is found
    // and only if we have a system level Slack bot token configured
    if (!webClient && systemWebClient) {
      console.log(`Using system WebClient for user ${userId} (no personal integration found)`);
      webClient = systemWebClient;
    }
    
    if (!webClient) {
      console.error('No Slack integration available for user', userId, clientId ? `and client ${clientId}` : '');
      return { 
        success: false, 
        errorCode: 'no_client', 
        errorMessage: 'No Slack integration available for this user'
      };
    }
    
    let targetChannelId = channelId;
    
    // If no specific channel is provided but notification type is set,
    // try to use the channel configured for that notification type
    if (!targetChannelId && notificationType) {
      const user = await storage.getUser(userId);
      
      // Use a type assertion to handle the preferences safely without full Zod validation
      // which might be too strict for legacy data
      let slackSettings: Record<string, string | undefined> = {};
      
      try {
        if (user?.preferences) {
          const prefs = user.preferences as Record<string, any>;
          
          if (prefs.slackNotifications) {
            // Extract channel settings from preferences
            slackSettings = {
              taskAlertChannel: prefs.slackNotifications.taskAlertChannel,
              meetingReminderChannel: prefs.slackNotifications.meetingReminderChannel,
              invoiceFollowUpChannel: prefs.slackNotifications.invoiceFollowUpChannel,
              leadUpdateChannel: prefs.slackNotifications.leadUpdateChannel,
              dailySummaryChannel: prefs.slackNotifications.dailySummaryChannel
            };
          }
        }
      } catch (err) {
        console.error('Error extracting Slack notification settings:', err);
      }
      
      // Map notification types to their respective channel settings
      const channelMap = {
        [NotificationType.TASK_REMINDER]: slackSettings.taskAlertChannel,
        [NotificationType.MEETING_REMINDER]: slackSettings.meetingReminderChannel,
        [NotificationType.INVOICE_DUE]: slackSettings.invoiceFollowUpChannel,
        [NotificationType.LEAD_DETECTED]: slackSettings.leadUpdateChannel,
        [NotificationType.DAILY_SUMMARY]: slackSettings.dailySummaryChannel,
        [NotificationType.EXPENSE_ALERT]: slackSettings.dailySummaryChannel // Default to daily summary channel
      };
      
      // Use the appropriate channel based on notification type
      targetChannelId = channelMap[notificationType];
    }
    
    // If still no channel ID, try to get the user's default channel
    if (!targetChannelId) {
      try {
        const defaultChannel = await storage.getDefaultSlackChannel(userId);
        if (defaultChannel) {
          console.log(`Using user's default Slack channel for user ${userId}`);
          targetChannelId = defaultChannel;
        }
      } catch (err) {
        console.error(`Error getting default Slack channel for user ${userId}:`, err);
      }
    }
    
    // If still no channel ID, use the system default channel
    if (!targetChannelId && SLACK_DEFAULT_CHANNEL) {
      console.log(`Using system default channel (${SLACK_DEFAULT_CHANNEL}) for user ${userId}`);
      targetChannelId = SLACK_DEFAULT_CHANNEL;
    }
    
    // If still no channel, use the default webhook channel from OAuth
    if (!targetChannelId) {
      const integration = await storage.getSlackIntegration(userId);
      
      if (integration?.incomingWebhook?.channel_id) {
        targetChannelId = integration.incomingWebhook.channel_id;
      } else {
        console.error('No target channel found for Slack message');
        return {
          success: false,
          errorCode: 'no_channel',
          errorMessage: 'No target channel found for Slack message'
        };
      }
    }
    
    // Ensure we have a valid channel ID before sending
    if (!targetChannelId) {
      console.error('No target channel ID available for Slack message');
      return {
        success: false,
        errorCode: 'no_channel',
        errorMessage: 'No Slack channel specified for this message'
      };
    }
    
    // Send the message
    const result = await webClient.chat.postMessage({
      channel: targetChannelId,
      text: message,
    });
    
    if (result.ok) {
      return { success: true };
    } else {
      return { 
        success: false,
        errorCode: 'api_response_error',
        errorMessage: `Slack API returned unsuccessful response: ${result.error || 'Unknown error'}`
      };
    }
  } catch (error: unknown) {
    console.error('Error sending Slack message:', error);
    
    let errorCode = 'unknown';
    let errorMessage = 'An unknown error occurred';
    
    // Extract detailed error info for debugging
    let debugMessage = 'No detailed error available';
    if (error instanceof Error) {
      debugMessage = error.message;
    } else if (error !== null && error !== undefined) {
      debugMessage = String(error);
    }
    
    // Cast to any for checking Slack-specific error properties
    const slackError = error as any;
    
    // Better error handling for common Slack API errors
    if (slackError?.data?.error === 'not_in_channel') {
      errorCode = 'not_in_channel';
      errorMessage = 'Bot is not in the channel. Please add the bot to the channel first with /invite @BinateAI';
      console.error(errorMessage);
    } else if (slackError?.data?.error === 'channel_not_found') {
      errorCode = 'channel_not_found';
      errorMessage = 'Channel not found. Please check the channel ID.';
      console.error(errorMessage);
    } else if (slackError?.data?.error === 'invalid_auth') {
      errorCode = 'invalid_auth';
      errorMessage = 'Invalid authentication credentials for Slack API.';
      console.error(errorMessage);
    } else if (slackError?.data?.error === 'token_revoked') {
      errorCode = 'token_revoked';
      errorMessage = 'Slack token has been revoked. The user needs to reconnect their Slack account.';
      console.error(errorMessage);
      // Could update the user's integration status here
    }
    
    console.debug('Original Slack error details:', debugMessage);
    
    return { 
      success: false, 
      errorCode, 
      errorMessage,
      debugDetails: debugMessage 
    };
  }
}

/**
 * Disconnect a user's Slack integration
 */
export async function disconnectSlackIntegration(userId: number): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  try {
    const success = await storage.deleteSlackIntegration(userId);
    return { success };
  } catch (error: unknown) {
    // Extract error details once to avoid duplication
    let errorDetails = 'Unknown error';
    if (error instanceof Error) {
      errorDetails = error.message;
    } else if (error !== null && error !== undefined) {
      errorDetails = String(error);
    }
    
    // Enhanced structured error logging
    console.error('Error disconnecting Slack integration:', {
      userId,
      errorDetails,
      timestamp: new Date().toISOString()
    });
    
    // Return standardized error response
    return { 
      success: false, 
      errorCode: 'integration_deletion_failed',
      errorMessage: 'Failed to disconnect Slack integration. Please try again.',
      debugDetails: errorDetails
    };
  }
}

/**
 * Get a user's Slack integration
 * With multi-tenant support, users can have multiple integrations
 * If clientId is provided, return that specific integration
 * If not, return the default integration (isDefault=true) or the first integration if no default exists
 */
export async function getSlackIntegration(userId: number, clientId?: number): Promise<any> {
  try {
    // If clientId is provided, get that specific integration
    if (clientId) {
      // Get integrations for this user and client
      const clientIntegration = await storage.getSlackIntegrationByClient(userId, clientId);
      
      if (clientIntegration) {
        // Strip sensitive data from the response
        const { accessToken, ...safeIntegration } = clientIntegration;
        return {
          ...safeIntegration,
          connected: !!clientIntegration.accessToken,
        };
      }
      return null;
    }
    
    // Otherwise get all integrations for this user
    const integrations = await storage.getAllSlackIntegrations(userId);
    
    if (!integrations || integrations.length === 0) {
      return null;
    }
    
    // Try to find the default integration first
    const defaultIntegration = integrations.find(integration => integration.isDefault);
    
    // If default found, return it
    if (defaultIntegration) {
      const { accessToken, ...safeIntegration } = defaultIntegration;
      return {
        ...safeIntegration,
        connected: !!defaultIntegration.accessToken,
      };
    }
    
    // Otherwise, fall back to the first integration (backward compatibility)
    const firstIntegration = integrations[0];
    const { accessToken, ...safeIntegration } = firstIntegration;
    return {
      ...safeIntegration,
      connected: !!firstIntegration.accessToken,
    };
  } catch (error: unknown) {
    console.error('Error getting Slack integration:', error);
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      errorMessage = String(error);
    }
    
    console.debug('Detailed Slack integration error:', errorMessage);
    return null;
  }
}

/**
 * Get all Slack integrations for a user
 */
export async function getAllSlackIntegrations(userId: number): Promise<any[]> {
  try {
    const integrations = await storage.getAllSlackIntegrations(userId);
    
    if (!integrations || integrations.length === 0) {
      return [];
    }
    
    // Strip sensitive data from each integration
    return integrations.map(integration => {
      const { accessToken, ...safeIntegration } = integration;
      return {
        ...safeIntegration,
        connected: !!integration.accessToken,
      };
    });
  } catch (error: unknown) {
    console.error('Error getting all Slack integrations:', error);
    return [];
  }
}

/**
 * Send a single task reminder notification via Slack
 */
export async function sendSingleTaskReminderNotification(
  userId: number,
  taskTitle: string,
  dueDate: Date,
  taskId: number
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const message = `📋 *Task Reminder*\n` +
    `Task: "${taskTitle}" is due on ${formattedDate}\n` + 
    `View it in Binate AI: ${config.appUrl}/app/tasks/${taskId}`;
  
  return await sendSlackMessage(userId, message, undefined, NotificationType.TASK_REMINDER);
}

/**
 * Send a meeting reminder notification via Slack
 */
export async function sendMeetingReminderNotification(
  userId: number,
  meetingTitle: string,
  startTime: Date,
  meetingId: number,
  location?: string,
  meetingUrl?: string
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  const formattedTime = startTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  
  let message = `📅 *Meeting Reminder*\n` +
    `Meeting: "${meetingTitle}" starts at ${formattedTime}\n`;
  
  if (location) {
    message += `Location: ${location}\n`;
  }
  
  if (meetingUrl) {
    message += `Meeting URL: ${meetingUrl}\n`;
  }
  
  message += `View it in Binate AI: ${config.appUrl}/app/calendar/${meetingId}`;
  
  return await sendSlackMessage(userId, message, undefined, NotificationType.MEETING_REMINDER);
}

/**
 * Send an invoice due notification via Slack
 */
export async function sendInvoiceDueNotification(
  userId: number,
  invoiceNumber: string,
  client: string,
  amount: number,
  dueDate: Date,
  invoiceId: number
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
  
  const message = `💰 *Invoice Due Reminder*\n` +
    `Invoice #${invoiceNumber} for ${client} is due on ${formattedDate}\n` +
    `Amount: ${formattedAmount}\n` +
    `View it in Binate AI: ${config.appUrl}/app/invoices/${invoiceId}`;
  
  return await sendSlackMessage(userId, message, undefined, NotificationType.INVOICE_DUE);
}

/**
 * Send a lead detection notification via Slack
 */
export async function sendLeadDetectedNotification(
  userId: number,
  leadName: string,
  leadEmail: string,
  source: string,
  estimatedValue: number,
  leadId: number
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(estimatedValue);
  
  const message = `🔍 *New Lead Detected*\n` +
    `Name: ${leadName}\n` +
    `Email: ${leadEmail}\n` +
    `Source: ${source}\n` +
    `Estimated Value: ${formattedValue}\n` +
    `View it in Binate AI: ${config.appUrl}/app/leads/${leadId}`;
  
  return await sendSlackMessage(userId, message, undefined, NotificationType.LEAD_DETECTED);
}

/**
 * Send a daily summary notification via Slack
 */
export async function sendDailySummaryNotification(
  userId: number,
  summary: {
    date: Date,
    taskCount: number,
    completedTaskCount: number,
    upcomingMeetings: number,
    pendingInvoices: number,
    newLeads: number
  },
  blocks?: any[]
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  // If blocks are provided, use them for a rich message format
  if (blocks && blocks.length > 0) {
    try {
      // Create WebClient
      let webClient = await createWebClient(userId);
      
      // Fall back to system client if needed
      if (!webClient && systemWebClient) {
        console.log(`Using system WebClient for user ${userId} (no personal integration found)`);
        webClient = systemWebClient;
      }
      
      if (!webClient) {
        console.error('No Slack integration available for user', userId);
        return { 
          success: false, 
          errorCode: 'no_client', 
          errorMessage: 'No Slack integration available for this user'
        };
      }
      
      // Get target channel
      let targetChannelId;
      const user = await storage.getUser(userId);
      let slackSettings: Record<string, string | undefined> = {};
      
      try {
        if (user?.preferences) {
          const prefs = user.preferences as Record<string, any>;
          
          if (prefs.slackNotifications) {
            slackSettings = {
              dailySummaryChannel: prefs.slackNotifications.dailySummaryChannel
            };
          }
        }
      } catch (err) {
        console.error('Error extracting Slack notification settings:', err);
      }
      
      // Try to get daily summary channel
      targetChannelId = slackSettings.dailySummaryChannel;
      
      // If no specific channel, get default
      if (!targetChannelId) {
        try {
          const defaultChannel = await storage.getDefaultSlackChannel(userId);
          if (defaultChannel) {
            console.log(`Using user's default Slack channel for user ${userId}`);
            targetChannelId = defaultChannel;
          }
        } catch (err) {
          console.error(`Error getting default Slack channel for user ${userId}:`, err);
        }
      }
      
      // Use system default if still no channel
      if (!targetChannelId && SLACK_DEFAULT_CHANNEL) {
        console.log(`Using system default channel for user ${userId}`);
        targetChannelId = SLACK_DEFAULT_CHANNEL;
      }
      
      if (!targetChannelId) {
        return {
          success: false,
          errorCode: 'no_channel',
          errorMessage: 'No Slack channel found for daily summary notification'
        };
      }
      
      // Send with blocks format
      const result = await webClient.chat.postMessage({
        channel: targetChannelId,
        text: `Binate AI Daily Summary - ${new Date().toLocaleDateString()}`,
        blocks: blocks
      });
      
      if (result.ok) {
        return { success: true };
      } else {
        return { 
          success: false,
          errorCode: 'api_response_error',
          errorMessage: `Slack API returned unsuccessful response: ${result.error || 'Unknown error'}`
        };
      }
    } catch (error: unknown) {
      console.error('Error sending Slack blocks message:', error);
      return { 
        success: false, 
        errorCode: 'unknown', 
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  // Fallback to simple text message
  const message = `📊 *Binate AI Daily Summary*\n` +
    `👋 Here's your daily summary for ${summary.date.toLocaleDateString()}:\n\n` +
    `📋 Tasks due: ${summary.taskCount} (${summary.completedTaskCount} completed)\n` +
    `📅 Meetings: ${summary.upcomingMeetings}\n` +
    `💰 Invoices pending: ${summary.pendingInvoices}\n` +
    `🔍 New leads: ${summary.newLeads}\n\n` +
    `View all in Binate AI: ${config.appUrl}/app/dashboard`;
  
  return await sendSlackMessage(userId, message, undefined, NotificationType.DAILY_SUMMARY);
}

/**
 * Send a task reminder notification via Slack
 */
export async function sendTaskReminderNotification(
  userId: number,
  tasks: Array<{
    id: number,
    title: string,
    dueDate: Date,
    priority: string,
    estimatedTime?: number
  }>
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  if (!tasks || tasks.length === 0) {
    return { success: false, errorCode: 'NO_TASKS', errorMessage: 'No tasks to notify about' };
  }

  // Sort by priority (high to low) and due date (earliest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority] ?? 1;
    const bPriority = priorityOrder[b.priority] ?? 1;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Format due dates
  const formatDate = (date: Date): string => {
    const now = new Date();
    const taskDate = new Date(date);
    const diffDays = Math.floor((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Create task list with priorities and due dates
  let taskList = '';
  sortedTasks.forEach(task => {
    const priorityEmoji = {
      high: '🔴',
      medium: '🟠',
      low: '🟢'
    }[task.priority] || '⚪️';
    
    taskList += `${priorityEmoji} *<${config.appUrl}/app/tasks/${task.id}|${task.title}>*\n`;
    taskList += `   Due: ${formatDate(task.dueDate)}`;
    
    if (task.estimatedTime) {
      taskList += ` • Est. ${task.estimatedTime} min`;
    }
    
    taskList += '\n\n';
  });

  const message = `📋 *Task Reminders*\n` +
    `The following tasks are coming up soon:\n\n` +
    `${taskList}` +
    `View all tasks in <${config.appUrl}/app/tasks|Binate AI>`;

  return await sendSlackMessage(userId, message, undefined, NotificationType.TASK_REMINDER);
}

/**
 * Send a task status update notification via Slack
 */
export async function sendTaskStatusUpdateNotification(
  userId: number,
  task: {
    id: number,
    title: string,
    completed: boolean,
    priority?: string,
    dueDate?: Date,
    completedBy?: string,
    completedAt?: Date
  }
): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; debugDetails?: string }> {
  // Format the status message
  const statusEmoji = task.completed ? '✅' : '🔄';
  const statusText = task.completed ? 'Completed' : 'Updated';
  
  let message = `${statusEmoji} *Task ${statusText}*\n`;
  message += `Task: *<${config.appUrl}/app/tasks/${task.id}|${task.title}>*\n`;
  
  if (task.completed) {
    message += `Completed: ${task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Just now'}\n`;
    
    if (task.completedBy) {
      message += `Completed by: ${task.completedBy === 'binate_ai' ? 'Binate AI' : 'You'}\n`;
    }
  } else {
    // For task updates
    if (task.priority) {
      const priorityEmoji = {
        high: '🔴',
        medium: '🟠',
        low: '🟢'
      }[task.priority] || '⚪️';
      
      message += `Priority: ${priorityEmoji} ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}\n`;
    }
    
    if (task.dueDate) {
      message += `Due: ${new Date(task.dueDate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })}\n`;
    }
  }

  return await sendSlackMessage(userId, message, undefined, NotificationType.TASK_REMINDER);
}