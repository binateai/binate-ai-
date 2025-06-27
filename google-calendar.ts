import { calendar_v3, google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import config from '../config';

// Google Calendar API scopes are already in google-auth.ts SCOPES array
// This file implements Google Calendar specific functionality

/**
 * Create OAuth2 client specifically for Calendar operations
 * Using the centralized config approach for consistent callback URL
 */
export function createOAuth2Client(): OAuth2Client {
  // Use the centralized config that correctly detects the Replit domain
  const callbackUrl = config.google.callbackUrl;
  
  console.log(`[Calendar] Using OAuth callback URL: ${callbackUrl}`);
  
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    callbackUrl
  );
  return oauth2Client;
}

/**
 * Get authenticated Calendar client for a user
 */
export async function getCalendarClient(userId: number): Promise<calendar_v3.Calendar | null> {
  try {
    const service = await storage.getConnectedService(userId, 'google');
    
    if (!service || service.connected === false || !service.credentials) {
      console.log(`No valid Google service found for user ${userId}`);
      return null;
    }
    
    const tokens = service.credentials;
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);
    
    // Set up callback for token refresh
    oauth2Client.on('tokens', async (newTokens) => {
      // Save the new tokens
      const updatedTokens = { ...tokens, ...newTokens };
      
      // Update stored tokens
      await storage.updateConnectedService(userId, 'google', {
        credentials: updatedTokens,
        connected: true
      });
      
      console.log(`Calendar tokens refreshed for user ${userId}`);
    });
    
    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error(`Error getting Calendar client for user ${userId}:`, error);
    return null;
  }
}

/**
 * Get upcoming events from Google Calendar
 */
export async function fetchGoogleCalendarEvents(userId: number, maxResults = 20): Promise<any[]> {
  try {
    const calendarClient = await getCalendarClient(userId);
    if (!calendarClient) {
      console.log(`Could not get Calendar client for user ${userId}`);
      return [];
    }
    
    const now = new Date();
    const response = await calendarClient.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching Google Calendar events for user ${userId}:`, error);
    return [];
  }
}

/**
 * Create an event in Google Calendar
 */
export async function createGoogleCalendarEvent(userId: number, event: any): Promise<any | null> {
  try {
    const calendarClient = await getCalendarClient(userId);
    if (!calendarClient) {
      console.log(`Could not get Calendar client for user ${userId}`);
      return null;
    }
    
    // Format the event according to Google Calendar API requirements
    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: new Date(event.startTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(event.endTime).toISOString(),
        timeZone: 'UTC',
      },
      location: event.location,
      attendees: event.attendees?.map((email: string) => ({ email })) || [],
    };
    
    const response = await calendarClient.events.insert({
      calendarId: 'primary',
      requestBody: googleEvent,
      sendUpdates: 'all', // Send updates to all attendees
    });
    
    console.log(`Created Google Calendar event for user ${userId}: ${response.data.htmlLink}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating Google Calendar event for user ${userId}:`, error);
    return null;
  }
}

/**
 * Sync a local event to Google Calendar
 */
export async function syncEventToGoogleCalendar(userId: number, eventId: number): Promise<boolean> {
  try {
    const event = await storage.getEvent(eventId);
    if (!event || event.userId !== userId) {
      console.error(`Event ${eventId} not found or does not belong to user ${userId}`);
      return false;
    }
    
    // Create the event in Google Calendar
    const googleEvent = await createGoogleCalendarEvent(userId, event);
    if (!googleEvent) {
      return false;
    }
    
    // Update the local event with the Google Calendar event meeting URL if available
    // Note: We can't store googleEventId directly since it's not in our schema
    // Instead, we can store it in contextNotes for reference
    const updatedContextNotes = event.contextNotes ? 
      `${event.contextNotes}\n\nGoogle Calendar Event ID: ${googleEvent.id}` : 
      `Google Calendar Event ID: ${googleEvent.id}`;
    
    await storage.updateEvent(userId, eventId, {
      meetingUrl: googleEvent.hangoutLink || event.meetingUrl,
      contextNotes: updatedContextNotes
    });
    
    return true;
  } catch (error) {
    console.error(`Error syncing event ${eventId} to Google Calendar for user ${userId}:`, error);
    return false;
  }
}