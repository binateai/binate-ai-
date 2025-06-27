/**
 * Multi-tenant Slack integration service
 * Allows each client to connect their own Slack workspace
 * with notifications sent only to their authorized channels
 */
import { WebClient } from '@slack/web-api';
import { storage } from '../../storage';
import config from '../../config';

// Initialize a default WebClient for system-level notifications
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_DEFAULT_CHANNEL = process.env.SLACK_CHANNEL_ID;
const systemWebClient = SLACK_BOT_TOKEN ? new WebClient(SLACK_BOT_TOKEN) : null;

// Interface for client Slack configuration
export interface ClientSlackConfig {
  id: number;
  userId: number;
  clientId: number;
  clientName: string;
  teamId: string;
  teamName: string;
  accessToken: string;
  channels: SlackChannel[];
  isDefault: boolean;
}

// Interface for Slack channel
export interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
}

/**
 * Get all Slack integrations for a user
 */
export async function getAllClientIntegrations(userId: number): Promise<ClientSlackConfig[]> {
  try {
    // Use the storage interface to get integrations
    const integrations = await storage.getAllSlackIntegrations(userId);
    
    // Map storage results to our interface
    return integrations.map(integration => ({
      id: integration.id,
      userId: integration.userId,
      clientId: integration.clientId || 0, // Default to 0 if not set
      clientName: integration.clientName || 'Default',
      teamId: integration.teamId,
      teamName: integration.teamName || 'Unknown Team',
      accessToken: integration.accessToken,
      channels: integration.availableChannels || [],
      isDefault: integration.isDefault || false
    }));
  } catch (error) {
    console.error('Error getting client integrations:', error);
    return [];
  }
}

/**
 * Get a specific client integration
 */
export async function getClientIntegration(userId: number, clientId: number): Promise<ClientSlackConfig | null> {
  try {
    // Try to find specific client integration
    const integrations = await getAllClientIntegrations(userId);
    return integrations.find(integration => integration.clientId === clientId) || null;
  } catch (error) {
    console.error('Error getting client integration:', error);
    return null;
  }
}

/**
 * Get the default integration for a user
 */
export async function getDefaultIntegration(userId: number): Promise<ClientSlackConfig | null> {
  try {
    const integrations = await getAllClientIntegrations(userId);
    
    // First try to find one marked as default
    const defaultIntegration = integrations.find(integration => integration.isDefault);
    if (defaultIntegration) return defaultIntegration;
    
    // Otherwise return first integration if any exist
    return integrations.length > 0 ? integrations[0] : null;
  } catch (error) {
    console.error('Error getting default integration:', error);
    return null;
  }
}

/**
 * Send a notification to a specific client's Slack
 */
export async function sendClientNotification(
  userId: number, 
  clientId: number | null, 
  message: string,
  channelId?: string,
  options?: any // For blocks, attachments, etc.
): Promise<{ success: boolean; error?: string }> {
  try {
    let client: WebClient | null = null;
    let targetChannelId = channelId || null;
    
    // If clientId provided, use that client's Slack
    if (clientId) {
      const clientConfig = await getClientIntegration(userId, clientId);
      
      if (clientConfig && clientConfig.accessToken) {
        // Create client from config
        client = new WebClient(clientConfig.accessToken);
        
        // If no channel specified, use first available channel
        if (!targetChannelId && clientConfig.channels && clientConfig.channels.length > 0) {
          targetChannelId = clientConfig.channels[0].id;
        }
      }
    } else {
      // Try to get user's default integration
      const defaultConfig = await getDefaultIntegration(userId);
      
      if (defaultConfig && defaultConfig.accessToken) {
        client = new WebClient(defaultConfig.accessToken);
        
        // If no channel specified, use first available channel
        if (!targetChannelId && defaultConfig.channels && defaultConfig.channels.length > 0) {
          targetChannelId = defaultConfig.channels[0].id;
        }
      }
    }
    
    // If we couldn't create a client-specific instance, fall back to system client
    if (!client && systemWebClient) {
      client = systemWebClient;
      
      // If no channel specified, use system default
      if (!targetChannelId) {
        targetChannelId = SLACK_DEFAULT_CHANNEL || null;
      }
    }
    
    // Check if we have a client and channel to send to
    if (!client) {
      return { 
        success: false, 
        error: 'No Slack integration available' 
      };
    }
    
    if (!targetChannelId) {
      return { 
        success: false, 
        error: 'No Slack channel available to send notification' 
      };
    }
    
    // Prepare message params
    const messageParams: any = {
      channel: targetChannelId,
      text: message
    };
    
    // Add advanced options if provided
    if (options) {
      if (options.blocks) messageParams.blocks = options.blocks;
      if (options.attachments) messageParams.attachments = options.attachments;
      if (options.thread_ts) messageParams.thread_ts = options.thread_ts;
      if (options.mrkdwn !== undefined) messageParams.mrkdwn = options.mrkdwn;
      // Add other options as needed
    }
    
    // Send the message
    const result = await client.chat.postMessage(messageParams);
    
    return { success: !!result.ok };
  } catch (error) {
    console.error('Error sending client notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send a digest notification to all client integrations
 */
export async function sendDigestToAllClients(
  userId: number,
  message: string,
  options?: any // For blocks, attachments, etc.
): Promise<{ success: boolean; sent: number; errors: number }> {
  try {
    const integrations = await getAllClientIntegrations(userId);
    let sent = 0;
    let errors = 0;
    
    // If user has no integrations, try to send via system client
    if (integrations.length === 0 && systemWebClient && SLACK_DEFAULT_CHANNEL) {
      try {
        // Prepare message params
        const messageParams: any = {
          channel: SLACK_DEFAULT_CHANNEL,
          text: message
        };
        
        // Add advanced options if provided
        if (options) {
          if (options.blocks) messageParams.blocks = options.blocks;
          if (options.attachments) messageParams.attachments = options.attachments;
          // Add other options as needed
        }
        
        const result = await systemWebClient.chat.postMessage(messageParams);
        
        if (result.ok) {
          sent++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error('Error sending digest via system client:', error);
        errors++;
      }
    } else {
      // Send to each client integration
      for (const integration of integrations) {
        try {
          // Create client from integration config
          const client = new WebClient(integration.accessToken);
          
          // Find appropriate channel
          let channelId = null;
          
          // Try to use first available channel
          if (integration.channels && integration.channels.length > 0) {
            channelId = integration.channels[0].id;
          }
          
          // Skip if we don't have a channel
          if (!channelId) {
            console.warn(`No channel found for client ${integration.clientName}, skipping`);
            continue;
          }
          
          // Prepare message params
          const messageParams: any = {
            channel: channelId,
            text: message
          };
          
          // Add advanced options if provided
          if (options) {
            if (options.blocks) messageParams.blocks = options.blocks;
            if (options.attachments) messageParams.attachments = options.attachments;
            // Add other options as needed
          }
          
          // Send message
          const result = await client.chat.postMessage(messageParams);
          
          if (result.ok) {
            sent++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`Error sending digest to client ${integration.clientName}:`, error);
          errors++;
        }
      }
    }
    
    return {
      success: sent > 0,
      sent,
      errors
    };
  } catch (error) {
    console.error('Error sending digest to all clients:', error);
    return {
      success: false,
      sent: 0,
      errors: 1
    };
  }
}