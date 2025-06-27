import { storage } from "../storage";
import { getClaudeResponse, generateMeetingPrep } from "../ai-service";
import { Event, Email, User, InsertEvent } from "@shared/schema";
import { log } from "../vite";

/**
 * Automatically scan emails for potential meetings and suggest calendar events
 */
export async function scanEmailsForMeetings(userId: number): Promise<Partial<Event>[]> {
  try {
    // Get user's unprocessed emails
    const emails = await storage.getEmailsByUserId(userId);
    if (!emails || emails.length === 0) {
      return [];
    }

    // Get user preferences
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    log(`Scanning ${emails.length} emails for meeting requests for user ${userId}`);
    
    // Check if auto event creation is enabled in user preferences
    let preferences = {};
    try {
      // Handle both string JSON and already-parsed objects
      if (user.preferences) {
        preferences = typeof user.preferences === 'string' 
          ? JSON.parse(user.preferences) 
          : user.preferences;
      }
    } catch (e) {
      log(`Error parsing user preferences: ${e}`, "error");
    }
    
    // Make sure we check preferences safely
    const autoScheduleEnabled = preferences && 
      (preferences as any).autoScheduleMeetings === true;
      
    if (!autoScheduleEnabled) {
      log(`Auto meeting scheduling is disabled for user ${userId}`);
      return [];
    }

    const suggestedEvents: Partial<Event>[] = [];

    // Process each email to detect meeting requests
    for (const email of emails) {
      if (email.processed || !email.body) continue;
      
      const event = await detectMeetingRequest(email, user);
      if (event) {
        suggestedEvents.push(event);
        
        // Mark email as processed
        await storage.updateEmail(userId, email.id, { processed: true });
      }
    }

    log(`Found ${suggestedEvents.length} meeting suggestions in emails for user ${userId}`);
    return suggestedEvents;
  } catch (error) {
    log(`Error in scanEmailsForMeetings: ${error}`, "error");
    return [];
  }
}

/**
 * Detect if an email contains a meeting request and extract meeting details
 * This function returns a partial Event object or null
 */
async function detectMeetingRequest(email: Email, user: User): Promise<Partial<Event> | null> {
  try {
    // More comprehensive meeting keywords for improved detection
    const meetingKeywords = [
      // Direct meeting terms
      "meeting", "call", "discussion", "appointment", "schedule", "meet", 
      "sync", "catch up", "talk", "conference", "interview", "zoom", 
      "google meet", "teams", "webex",
      // Indirect meeting intentions
      "availability", "when are you free", "let's connect", "get together",
      "let me know when", "would you have time", "find a time", "calendar",
      // Time-related terms that suggest scheduling
      "next week", "this week", "tomorrow", "morning", "afternoon", "evening",
      // Days of week that might indicate scheduling
      "monday", "tuesday", "wednesday", "thursday", "friday"
    ];
    
    const subjectLower = email.subject.toLowerCase();
    const bodyLower = email.body.toLowerCase();
    
    // Check if email contains common meeting indicators
    let containsMeetingKeywords = meetingKeywords.some(keyword => 
      subjectLower.includes(keyword) || bodyLower.includes(keyword)
    );
    
    // Look for time patterns even if keywords aren't found
    // e.g., "3pm", "15:00", "3:30 PM"
    const timePatterns = [
      /\b\d{1,2}[\s]?(am|pm)\b/i,                    // 3pm, 3 pm, 11am
      /\b\d{1,2}:\d{2}[\s]?(am|pm)?\b/i,             // 3:30pm, 15:00, 3:30 PM
      /\b(at|from|between)[\s]+\d{1,2}[\s]?(am|pm|:\d{2})/i  // at 3pm, from 3:30
    ];
    
    const containsTimePatterns = timePatterns.some(pattern => 
      pattern.test(bodyLower)
    );
    
    // Look for date patterns
    const datePatterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}(st|nd|rd|th)?\b/i,  // Jan 15th, December 3
      /\b\d{1,2}(st|nd|rd|th)?[\s]+(of[\s]+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i,  // 15th of January, 3 Dec
      /\bnext (mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i,  // next Monday
      /\b(this|next) week\b/i,  // this week, next week
      /\btomorrow\b/i,  // tomorrow
      /\b\d{4}-\d{2}-\d{2}\b/  // ISO format: 2025-04-22
    ];
    
    const containsDatePatterns = datePatterns.some(pattern => 
      pattern.test(bodyLower)
    );
    
    // Determine if this might be a meeting request based on combined signals
    // We'll process it if it contains meeting keywords OR (time patterns AND date patterns)
    const mightBeMeetingRequest = containsMeetingKeywords || (containsTimePatterns && containsDatePatterns);
    
    if (!mightBeMeetingRequest) {
      return null;
    }

    // Get any previous emails in the same thread for better context
    // TODO: This will require thread handling in the email service
    // For now, we'll just use the current email

    // Enhanced Claude prompt with better context awareness
    const prompt = `
    You are an intelligent executive assistant that analyzes emails to detect and extract meeting requests.
    
    Email Subject: ${email.subject}
    Email Body: ${email.body}
    Sender: ${email.from}
    
    First, determine if this email contains or implies a meeting request, call, appointment, or any form of scheduled discussion.
    Look for both explicit and implicit meeting requests. An implicit request might be someone asking about availability or suggesting a discussion without specifically using the word "meeting".
    
    If you detect a meeting request, extract the following information with high precision:
    1. Meeting title (make it descriptive and professional)
    2. Proposed date(s) and time(s) - extract ALL possible options mentioned
    3. Expected duration (default to 30 minutes if not specified)
    4. Proposed location or virtual meeting link
    5. All potential attendees mentioned (emails or names)
    6. Meeting purpose/agenda (be detailed and specific)
    7. Priority level (high, medium, low) based on language urgency and sender importance
    
    Return your response in JSON format:
    {
      "isMeetingRequest": true/false,
      "confidence": 0.0-1.0,
      "title": "Meeting title",
      "proposedTimes": ["YYYY-MM-DDTHH:MM:SS", ...],
      "duration": "minutes",
      "location": "location or link",
      "attendees": ["email1", "email2", ...],
      "agenda": "brief description of meeting purpose",
      "priority": "high/medium/low",
      "followUpNeeded": true/false,
      "suggestedResponse": "A brief suggested response to confirm the meeting time"
    }
    
    If it's not a meeting request, return { "isMeetingRequest": false, "confidence": 0.0-1.0 }
    
    Be especially careful with date and time extraction - make sure to handle relative dates like "tomorrow", "next Tuesday", etc. correctly.
    For time zones, assume the recipient's local time if not specified.
    If multiple times are suggested, include all of them in proposedTimes.
    `;

    const response = await getClaudeResponse(prompt);
    // Import our helper function to extract JSON from Claude's response
    const { extractJsonFromResponse } = await import('../ai-service');
    const result = extractJsonFromResponse(response);
    
    // Lower the confidence threshold to catch more potential meetings,
    // but add the confidence score to the notes for transparency
    if (!result.isMeetingRequest || result.confidence < 0.6) {
      return null;
    }
    
    // Handle multiple proposed times - select the first one for now
    // In a future enhancement, we could create multiple event options
    let startTime = new Date();
    if (result.proposedTimes && result.proposedTimes.length > 0) {
      startTime = new Date(result.proposedTimes[0]);
    }
    
    // Calculate end time based on duration
    let endTime = new Date(startTime);
    const durationMinutes = parseInt(result.duration) || 30;
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    
    // Process attendees to ensure proper format
    let attendees = result.attendees || [email.from];
    // Make sure the user is included as an attendee
    if (user.email && !attendees.includes(user.email)) {
      attendees.push(user.email);
    }
    
    // Create a more detailed context for the event
    const contextNotes = `
Detected from email: "${email.subject}" from ${email.from}
Confidence score: ${result.confidence.toFixed(2)}
${result.proposedTimes.length > 1 ? `Alternative times: ${result.proposedTimes.slice(1).join(', ')}` : ''}
${result.suggestedResponse ? `Suggested response: ${result.suggestedResponse}` : ''}
${result.followUpNeeded ? 'Follow-up recommended after meeting' : ''}
Priority: ${result.priority || 'medium'}
    `.trim();
    
    // Create enhanced event object
    const event: InsertEvent = {
      userId: user.id,
      title: result.title || `Meeting: ${email.subject}`,
      description: result.agenda || "",
      startTime: startTime,
      endTime: endTime,
      location: result.location || "",
      meetingUrl: result.location?.startsWith("http") ? result.location : "",
      attendees: attendees,
      emailId: email.id,
      aiNotes: `Auto-detected from email with ${(result.confidence*100).toFixed(0)}% confidence.`,
      contextNotes: contextNotes,
      // Mark as temporary by default for confirmation flow
      temporary: true,
      // Store AI confidence as integer percentage (0-100)
      aiConfidence: Math.round(result.confidence * 100)
    };
    
    // Generate comprehensive meeting preparation notes
    const prepNotes = await generateMeetingPrep(event);
    if (prepNotes) {
      event.aiNotes = prepNotes.summary;
      // Append additional context from the original analysis
      event.contextNotes = prepNotes.context + '\n\n' + contextNotes;
    }
    
    // Return a properly formatted event object that matches the required InsertEvent interface
    const formattedEvent = {
      userId: event.userId,
      title: event.title,
      description: event.description || "",
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || "",
      meetingUrl: event.meetingUrl || "",
      attendees: event.attendees || [],
      emailId: event.emailId || undefined, // Use undefined instead of null
      aiNotes: event.aiNotes || "",
      contextNotes: event.contextNotes || "",
      temporary: true,
      aiConfidence: event.aiConfidence || 0 // Provide a default confidence
    };
    
    return formattedEvent;
  } catch (error) {
    log(`Error in detectMeetingRequest: ${error}`, "error");
    return null;
  }
}

/**
 * Automatically generate preparation materials for upcoming meetings
 */
export async function prepareMeetingNotes(userId: number): Promise<void> {
  try {
    // Get upcoming meetings in the next 24 hours without AI notes
    const events = await storage.getEventsByUserId(userId);
    if (!events || events.length === 0) {
      return;
    }
    
    const now = new Date();
    const in24Hours = new Date(now);
    in24Hours.setHours(in24Hours.getHours() + 24);
    
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate > now && eventDate < in24Hours && !event.aiNotes;
    });
    
    if (upcomingEvents.length === 0) {
      return;
    }
    
    log(`Generating meeting prep notes for ${upcomingEvents.length} upcoming events for user ${userId}`);
    
    // Process each upcoming event
    for (const event of upcomingEvents) {
      const prepNotes = await generateMeetingPrep(event);
      if (prepNotes) {
        await storage.updateEvent(userId, event.id, { 
          aiNotes: prepNotes.summary,
          contextNotes: prepNotes.context
        });
      }
    }
  } catch (error) {
    log(`Error in prepareMeetingNotes: ${error}`, "error");
  }
}

/**
 * Run automated calendar management for all users
 */
export async function runAutoCalendarManagement(): Promise<void> {
  try {
    // Get all users
    const users = await storage.getAllUsers();
    
    for (const user of users) {
      let preferences = {};
      try {
        // Handle both string JSON and already-parsed objects
        if (user.preferences) {
          preferences = typeof user.preferences === 'string' 
            ? JSON.parse(user.preferences) 
            : user.preferences;
        }
      } catch (e) {
        log(`Error parsing user preferences: ${e}`, "error");
      }
      
      // Make sure we check preferences safely
      const autoScheduleEnabled = preferences && 
        (preferences as any).autoScheduleMeetings === true;
        
      if (!autoScheduleEnabled) {
        continue;
      }
      
      // Generate suggested events from emails
      const suggestedEvents = await scanEmailsForMeetings(user.id);
      
      // Create events in the calendar
      for (const event of suggestedEvents) {
        // Ensure userId is always defined
        if (!event.userId) {
          log(`Missing userId for event ${event.title}, skipping...`, "error");
          continue;
        }
        
        // Convert event to a proper InsertEvent
        const eventToInsert = {
          userId: event.userId,
          title: event.title || "Untitled Meeting",
          description: event.description || "",
          startTime: event.startTime || new Date(),
          endTime: event.endTime || new Date(Date.now() + 30 * 60 * 1000), // Add 30 mins if missing
          location: event.location || "",
          meetingUrl: event.meetingUrl || "",
          attendees: event.attendees || [],
          emailId: typeof event.emailId === 'number' ? event.emailId : undefined,
          aiNotes: event.aiNotes || "",
          contextNotes: event.contextNotes || "",
          temporary: event.temporary === true,
          aiConfidence: event.aiConfidence || 0 // Provide a default confidence
        };
        
        await storage.createEvent(eventToInsert);
      }
      
      // Prepare meeting notes for upcoming events
      await prepareMeetingNotes(user.id);
    }
    
    log("Automated calendar management completed");
  } catch (error) {
    log(`Error in runAutoCalendarManagement: ${error}`, "error");
  }
}