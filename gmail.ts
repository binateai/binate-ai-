import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { storage } from '../storage';
import { generateEmailReply } from '../ai-service';
import { User, Email } from '@shared/schema';
import { processEmailForLeads } from './lead-detection';
import config from '../config';

// Gmail API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'openid',
  'email',
  'profile'
];

// Create OAuth2 client
export function createOAuth2Client(): OAuth2Client {
  // Use the centralized config that correctly detects the Replit domain
  const callbackUrl = config.google.callbackUrl;
  
  console.log(`[Gmail] Using OAuth callback URL: ${callbackUrl}`);
  
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    callbackUrl
  );
  return oauth2Client;
}

// Get authorization URL
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force to get refresh_token every time
  });
  
  console.log('Generated Google auth URL:', authUrl);
  return authUrl;
}

// Set tokens for a user
export async function setTokensForUser(userId: number, tokens: any): Promise<boolean> {
  try {
    await storage.updateConnectedService(userId, 'google', {
      credentials: tokens,
      connected: true
    });
    return true;
  } catch (error) {
    console.error('Error saving tokens:', error);
    return false;
  }
}

// Get authenticated Gmail client for a user
export async function getGmailClient(userId: number): Promise<gmail_v1.Gmail | null> {
  try {
    const service = await storage.getConnectedService(userId, 'google');
    
    if (!service || service.connected === false) {
      console.log(`No Google service found for user ${userId} or service not connected`);
      return null;
    }
    
    if (!service.credentials) {
      console.log(`No credentials found for user ${userId}'s Google service`);
      return null;
    }
    
    const tokens = service.credentials as {
      access_token?: string;
      refresh_token?: string;
      expiry_date?: number;
      token_type?: string;
      id_token?: string;
      scope?: string;
    };
    
    // Check if tokens exist and contain required fields
    if (!tokens || typeof tokens !== 'object') {
      console.error(`Invalid tokens for user ${userId}: null or not an object`);
      return null;
    }
    
    if (!tokens.access_token) {
      console.error(`Missing access_token for user ${userId}`);
      
      // If we have a refresh token, try to refresh even though the access token is missing
      if (tokens.refresh_token) {
        console.log(`No access token but found refresh token for user ${userId}. Attempting refresh...`);
        try {
          const oauth2Client = createOAuth2Client();
          oauth2Client.setCredentials({ refresh_token: tokens.refresh_token });
          const { credentials } = await oauth2Client.refreshAccessToken();
          console.log(`Successfully refreshed token for user ${userId} from refresh_token only`);
          await setTokensForUser(userId, credentials);
          tokens.access_token = credentials.access_token;
          tokens.expiry_date = credentials.expiry_date;
        } catch (refreshError) {
          console.error(`Failed to refresh token for user ${userId} from refresh_token only:`, refreshError);
          return null;
        }
      } else {
        console.error(`No refresh token available for user ${userId}, cannot recover`);
        return null;
      }
    }
    
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials(tokens);
    
    // Set up callback for token refresh
    oauth2Client.on('tokens', async (newTokens) => {
      console.log(`Token refresh event for user ${userId}`);
      // Save the new tokens
      const updatedTokens = { ...tokens, ...newTokens };
      await setTokensForUser(userId, updatedTokens);
    });
    
    // Check if token is expired and needs refreshing
    const now = Date.now();
    if (tokens.expiry_date && tokens.expiry_date < now) {
      if (tokens.refresh_token) {
        try {
          console.log(`Token expired for user ${userId} (expired at ${new Date(tokens.expiry_date).toISOString()}, now ${new Date(now).toISOString()}), refreshing...`);
          const { credentials } = await oauth2Client.refreshAccessToken();
          console.log(`Successfully refreshed expired token for user ${userId}`);
          await setTokensForUser(userId, credentials);
          
          // Create a new client with the refreshed credentials
          const refreshedOauth2Client = createOAuth2Client();
          refreshedOauth2Client.setCredentials(credentials);
          return google.gmail({ version: 'v1', auth: refreshedOauth2Client });
        } catch (refreshError) {
          console.error(`Error refreshing expired token for user ${userId}:`, refreshError);
          // Mark the service as disconnected since the refresh token is invalid
          await storage.updateConnectedService(userId, 'google', {
            connected: false,
            lastError: 'Failed to refresh token: ' + (refreshError as Error).message
          });
          return null;
        }
      } else {
        console.warn(`Token expired for user ${userId} but no refresh token available`);
        // Mark the service as disconnected since we can't refresh
        await storage.updateConnectedService(userId, 'google', {
          connected: false,
          lastError: 'Token expired and no refresh token available'
        });
        return null;
      }
    }
    
    // Create the Gmail client with the validated token
    const gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Verify the client works by making a simple API call
    try {
      console.log(`Testing Gmail connection for user ${userId}...`);
      await gmailClient.users.getProfile({ userId: 'me' });
      console.log(`Gmail connection test successful for user ${userId}`);
      return gmailClient;
    } catch (testError: any) {
      console.error(`Gmail connection test failed for user ${userId}:`, testError);
      
      // Check if this is an auth error
      if (testError.code === 401 || (testError.response && testError.response.status === 401)) {
        console.error(`Authorization error with Gmail API for user ${userId}`);
        
        // Mark the service as disconnected
        await storage.updateConnectedService(userId, 'google', {
          connected: false,
          lastError: 'Gmail API authorization failed: ' + testError.message
        });
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Unexpected error getting Gmail client for user ${userId}:`, error);
    return null;
  }
}

// Fetch and process emails for a user
export async function fetchEmails(userId: number, maxResults = 20): Promise<Email[]> {
  console.log(`Fetching emails for user ${userId}, max results: ${maxResults}`);
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    console.error(`Failed to get Gmail client for user ${userId}`);
    throw new Error('Google account not connected. Please connect your Google account in Settings to use this feature.');
  }
  
  try {
    console.log('Fetching message list from Gmail API...');
    
    // Get user settings to determine if we should use advanced email query options
    const user = await storage.getUser(userId);
    const userPreferences = user?.preferences || {};
    const lastSyncDate = userPreferences.lastEmailSyncDate 
      ? new Date(userPreferences.lastEmailSyncDate) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days if no sync date
      
    // Format date for Gmail query (YYYY/MM/DD)
    const formattedDate = `${lastSyncDate.getFullYear()}/${(lastSyncDate.getMonth() + 1).toString().padStart(2, '0')}/${lastSyncDate.getDate().toString().padStart(2, '0')}`;
    
    console.log(`Using date filter: after:${formattedDate}`);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: `after:${formattedDate}` // Get all emails after last sync date
    });
    
    if (!response || !response.data) {
      console.error('Gmail API returned empty response');
      return [];
    }
    
    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} messages to process`);
    
    const emails: Email[] = [];
    
    for (const message of messages) {
      if (!message.id) {
        console.log('Skipping message with no ID');
        continue;
      }
      
      try {
        console.log(`Fetching full message ${message.id}...`);
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        if (!fullMessage.data.payload) {
          console.log(`Message ${message.id} has no payload, skipping`);
          continue;
        }
        
        // Extract headers
        const headers = fullMessage.data.payload.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const from = headers.find(h => h.name === 'From')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        
        // Extract body
        let body = '';
        let bodyHtml = '';
        
        if (fullMessage.data.payload.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString();
        } else if (fullMessage.data.payload.parts) {
          // Try to find text parts
          for (const part of fullMessage.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = Buffer.from(part.body.data, 'base64').toString();
            } else if (part.mimeType === 'text/html' && part.body?.data) {
              bodyHtml = Buffer.from(part.body.data, 'base64').toString();
            }
          }
        }
        
        // If we only have HTML, use it as the body
        if (!body && bodyHtml) {
          body = bodyHtml;
        }
        
        // Format message ID to ensure it's a valid integer
        let messageIdAsInt: number;
        try {
          // Try to use just numeric portion if the ID has non-numeric characters
          const numericPart = message.id.replace(/\D/g, '');
          messageIdAsInt = parseInt(numericPart);
          
          // If the parsed integer is NaN or not a valid ID, generate a hash-based ID
          if (isNaN(messageIdAsInt) || messageIdAsInt <= 0) {
            // Create a simple hash from the message ID string
            messageIdAsInt = Math.abs(
              message.id.split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
              }, 0)
            );
          }
        } catch (parseError) {
          // Fallback to a timestamp-based ID if all else fails
          messageIdAsInt = Date.now();
        }
        
        // Create email object with all required fields
        const email: Email = {
          id: messageIdAsInt,
          userId,
          messageId: message.id,
          threadId: fullMessage.data.threadId || '',
          subject,
          from,
          to,
          body,
          isRead: !(fullMessage.data.labelIds || []).includes('UNREAD'),
          date: new Date(date),
          labels: fullMessage.data.labelIds || [],
          isDeleted: false,
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          aiSummary: '', // Add missing required field
          processed: false // Add missing required field
        };
        
        console.log(`Successfully processed email "${subject}" from ${from}`);
        emails.push(email);
        
        // Store email in our database for future reference
        try {
          await storage.createOrUpdateEmail(email);
          console.log(`Email ${messageIdAsInt} saved to database`);
        } catch (err) {
          console.error(`Error storing email ${messageIdAsInt}:`, err);
        }
      } catch (messageError) {
        console.error(`Error processing message ${message.id}:`, messageError);
        // Continue with next message
      }
    }
    
    console.log(`Successfully fetched and processed ${emails.length} emails`);
    
    // Update the lastEmailSyncDate in user preferences to current time
    try {
      const user = await storage.getUser(userId);
      const preferences = user?.preferences || {};
      
      // Create updated preferences object
      const updatedPreferences = {
        ...preferences,
        lastEmailSyncDate: new Date().toISOString()
      };
      
      // Save updated preferences
      await storage.updateUserSettings(userId, updatedPreferences);
      console.log(`Updated lastEmailSyncDate for user ${userId} to ${new Date().toISOString()}`);
    } catch (prefError) {
      console.error(`Error updating lastEmailSyncDate for user ${userId}:`, prefError);
      // Continue anyway as this is not critical
    }
    
    return emails;
  } catch (error) {
    console.error(`Error fetching emails for user ${userId}:`, error);
    throw error;
  }
}

// Analyze email content to detect intent and extract relevant information
export enum EmailIntent {
  INVOICE_REQUEST = 'INVOICE_REQUEST',
  MEETING_REQUEST = 'MEETING_REQUEST',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  TASK_REQUEST = 'TASK_REQUEST',
  UNKNOWN = 'UNKNOWN'
}

interface EmailAnalysisResult {
  intent: EmailIntent;
  summary: string;
  suggestedReply?: string;
  extractedData?: {
    invoiceDetails?: {
      clientName?: string;
      amount?: number;
      dueDate?: string;
      services?: Array<{description: string, amount: number}>;
    };
    meetingDetails?: {
      proposedTimes?: string[];
      topic?: string;
      attendees?: string[];
      location?: string;
    };
    taskDetails?: {
      taskName?: string;
      dueDate?: string;
      priority?: string;
    };
  };
}

// Analyze email using Claude AI
export async function analyzeEmail(userId: number, emailIdOrMessageId: number | string): Promise<EmailAnalysisResult> {
  try {
    // Get the email from storage - try both methods
    let email: Email | undefined;
    
    if (typeof emailIdOrMessageId === 'string') {
      // If it's a string, it's a messageId
      email = await storage.getEmailByMessageId(userId, emailIdOrMessageId);
    } else {
      // If it's a number, it's the database ID
      email = await storage.getEmail(emailIdOrMessageId);
    }
    
    if (!email || email.userId !== userId) {
      throw new Error('Email not found or access denied');
    }
    
    // Import the AI service
    const { getClaudeResponse } = await import('../ai-service');
    
    // Get the user for their preferences
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Craft the system prompt
    const systemPrompt = `You are an AI executive assistant analyzing emails. 
    Response style preference: ${user.preferences?.aiResponseStyle || 'friendly'}.
    Analyze the following email and provide:
    1. The email's primary intent: INVOICE_REQUEST, MEETING_REQUEST, GENERAL_INQUIRY, TASK_REQUEST, or UNKNOWN
    2. A concise summary (max 50 words)
    3. Extracted structured data based on intent (invoice details, meeting details, task details)
    4. A suggested professional reply if appropriate
    
    Respond with JSON only in this exact format:
    {
      "intent": "INTENT_TYPE",
      "summary": "Brief summary of the email",
      "suggestedReply": "Suggested reply text if applicable",
      "extractedData": {
        // Fields based on intent type
      }
    }`;
    
    // Format the email for analysis
    const emailContent = `
    From: ${email.from}
    To: ${email.to}
    Subject: ${email.subject}
    Date: ${email.date.toISOString()}
    
    ${email.body}`;
    
    // COMPLETELY DISABLED: Stop ALL AI analysis to prevent charges
    console.log('AI analysis disabled to protect API credits');
    const claudeResponse = JSON.stringify({
      intent: 'GENERAL',
      summary: 'Email processed without AI analysis to protect credits',
      priority: 'medium',
      actionRequired: false,
      lead: null,
      task: null,
      meeting: null,
      invoice: null
    });
    
    try {
      // Use our improved JSON parsing helper function
      const { extractJsonFromResponse } = await import('../ai-service');
      const result = extractJsonFromResponse(claudeResponse);
      
      // Validate the result has the required fields
      if (!result.intent || !result.summary) {
        throw new Error('Invalid AI response format');
      }
      
      return result as EmailAnalysisResult;
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      
      // Fallback response
      return {
        intent: EmailIntent.UNKNOWN,
        summary: 'Could not analyze email content',
      };
    }
  } catch (error) {
    console.error('Error analyzing email:', error);
    
    // Return default analysis
    return {
      intent: EmailIntent.UNKNOWN,
      summary: 'Error occurred while analyzing the email',
    };
  }
}

// Send email reply
// Send a new email (not a reply)
export async function sendEmail(
  userId: number,
  toOrOptions: string | { to: string; subject: string; html?: string; text?: string },
  subject?: string,
  content?: string
): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Google account not connected. Please connect your Google account in Settings to use this feature.');
  }
  
  try {
    let to: string;
    let emailSubject: string;
    let emailContent: string;
    
    // Handle both the object and individual parameters API
    if (typeof toOrOptions === 'object') {
      // Object format - recipient can be under 'to' or 'recipient' property
      to = toOrOptions.to || '';
      emailSubject = toOrOptions.subject || '';
      emailContent = toOrOptions.html || toOrOptions.text || '';
    } else {
      // Individual parameters format
      to = toOrOptions;
      emailSubject = subject || '';
      emailContent = content || '';
    }
    
    // Validate recipient
    if (!to) {
      throw new Error('Recipient address required');
    }
    
    // Create email content
    const email = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${emailSubject}`,
      '',
      emailContent
    ].join('\r\n');
    
    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });
    
    console.log(`Email sent to ${to} with subject "${subject}"`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendReply(
  userId: number,
  originalMessageId: string,
  replyContent: string,
  options: { forceImmediateSend?: boolean } = {}
): Promise<boolean> {
  try {
    // First check user preferences for autonomous mode
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Default to semi-manual if not specified
    const preferences = user.preferences || {};
    const autonomousMode = preferences.autonomousMode || 'semi_manual';
    
    const gmail = await getGmailClient(userId);
    if (!gmail) {
      throw new Error('Google account not connected. Please connect your Google account in Settings to use this feature.');
    }
  
    // Get original email to extract headers for proper reply
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: originalMessageId,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'To', 'Message-ID', 'References', 'In-Reply-To']
    });
    
    if (!originalMessage.data || !originalMessage.data.payload) {
      throw new Error('Could not fetch original message');
    }
    
    const headers = originalMessage.data.payload.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const originalFrom = headers.find(h => h.name === 'From')?.value || '';
    const originalTo = headers.find(h => h.name === 'To')?.value || '';
    const messageId = headers.find(h => h.name === 'Message-ID')?.value || '';
    const references = headers.find(h => h.name === 'References')?.value || '';
    
    // Extract email address from the From field
    const fromEmailMatch = originalFrom.match(/<([^>]+)>/) || originalFrom.match(/([^\s]+@[^\s]+)/);
    const toEmail = fromEmailMatch ? fromEmailMatch[1] : originalFrom;
    
    // Construct reply
    const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    
    // Check if we should queue this for approval instead of sending immediately
    if (autonomousMode === 'semi_manual' && !options.forceImmediateSend) {
      // Add to pending replies queue
      console.log(`Queueing email reply for approval (semi-manual mode) to: ${toEmail}, subject: ${replySubject}`);
      
      try {
        await storage.createPendingEmailReply({
          userId, 
          messageId: originalMessageId,
          to: toEmail, // Using 'to' property for backward compatibility with existing code
          subject: replySubject,
          content: replyContent,
          originalMessageData: JSON.stringify({
            from: originalFrom,
            subject: subject,
            messageId: messageId,
            references: references,
            threadId: originalMessage.data.threadId
          }),
          createdAt: new Date(),
          status: 'pending'
        });
        
        // Log the queued reply
        await storage.createEmailLog({
          userId,
          type: 'reply_queued',
          recipient: toEmail,
          subject: replySubject,
          status: 'pending',
          metadata: JSON.stringify({
            originalMessageId: originalMessageId,
            replyLength: replyContent.length
          }),
          timestamp: new Date()
        });
        
        // Return true because we successfully queued it
        return true;
      } catch (queueError) {
        console.error('Error queueing email for approval:', queueError);
        return false;
      }
    }
    
    // In autonomous mode or with forceImmediateSend, send immediately
    
    // Create email with all proper headers for threading
    let emailContent = 
      `From: me\r\n` +
      `To: ${toEmail}\r\n` +
      `Subject: ${replySubject}\r\n` +
      `In-Reply-To: ${messageId}\r\n` +
      `References: ${references ? references + ' ' : ''}${messageId}\r\n` +
      `\r\n` +
      `${replyContent}`;
    
    // Convert to base64
    const encodedEmail = Buffer.from(emailContent).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send email
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: originalMessage.data.threadId
      }
    });
    
    // Log the successful reply
    await storage.createEmailLog({
      userId,
      type: 'reply',
      recipient: toEmail,
      subject: replySubject,
      status: 'sent',
      metadata: JSON.stringify({
        originalMessageId: originalMessageId,
        replyLength: replyContent.length
      }),
      timestamp: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error sending reply:', error);
    
    // Log the failed reply
    try {
      await storage.createEmailLog({
        userId,
        type: 'reply',
        recipient: 'unknown', // We might not have been able to extract recipient
        subject: 'Reply to email',
        status: 'failed',
        metadata: JSON.stringify({
          originalMessageId: originalMessageId,
          error: (error as Error).message
        }),
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Error logging failed reply:', logError);
    }
    
    return false;
  }
}

// Automatically process emails - fully autonomous mode with selective processing option
export async function autoProcessEmails(userId: number, options?: { selectiveMode?: boolean; limitToEssentials?: boolean }): Promise<{
  processed: number;
  replied: number;
  tasksCreated: number;
  invoicesCreated: number;
  meetingsScheduled: number;
  leadsDetected: number;
}> {
  try {
    // Get user preferences for autonomous operation
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Default settings if preferences not set
    const preferences = user.preferences || {};
    
    // Check if user has set autonomousMode to semi_manual or fully_autonomous
    const autonomousMode = preferences.autonomousMode || 'semi_manual';
    
    // In semi_manual mode, we don't auto-reply or auto-schedule without approval
    const autonomousSettings = {
      autoReplyToEmails: autonomousMode === 'fully_autonomous',
      autoCreateTasks: true, // We still create tasks in both modes
      autoDetectLeads: true, // We still detect leads in both modes
      autoGenerateInvoices: autonomousMode === 'fully_autonomous',
      autoScheduleMeetings: autonomousMode === 'fully_autonomous',
      priorityResponseTime: preferences.priorityResponseTime || 'high' // high, medium, low
    };
    
    console.log(`Running auto email processing for user ${userId} with settings:`, 
      JSON.stringify(autonomousSettings));
    
    // Fetch unread emails - increase limit from 10 to 25 for more comprehensive processing
    const emails = await fetchEmails(userId, 25);
    
    // Init counters
    const result = {
      processed: 0,
      replied: 0,
      tasksCreated: 0,
      invoicesCreated: 0,
      meetingsScheduled: 0,
      leadsDetected: 0
    };
    
    if (emails.length === 0) {
      return result;
    }
    
    console.log(`Found ${emails.length} unread emails to process`);
    
    // Sort emails by priority (based on sender and subject)
    const sortedEmails = prioritizeEmails(emails, user);
    console.log('Emails prioritized. Processing highest priority emails first.');
    
    // If selective mode is enabled, filter for business-critical emails only
    let emailsToProcess = sortedEmails;
    if (options?.selectiveMode && options?.limitToEssentials) {
      emailsToProcess = sortedEmails.filter(email => {
        const subject = email.subject.toLowerCase();
        const from = email.from.toLowerCase();
        
        // Focus on business-critical emails: invoices, receipts, payments, important notifications
        return (
          subject.includes('invoice') || 
          subject.includes('receipt') || 
          subject.includes('payment') || 
          subject.includes('bill') || 
          subject.includes('expense') ||
          subject.includes('anthropic') ||
          from.includes('anthropic') ||
          from.includes('stripe') ||
          from.includes('paypal') ||
          from.includes('billing') ||
          subject.includes('urgent') ||
          subject.includes('action required')
        );
      });
      console.log(`Selective mode: Processing ${emailsToProcess.length} business-critical emails out of ${sortedEmails.length} total emails`);
    }
    
    // Use the filtered emails for processing
    for (const email of emailsToProcess) {
      try {
        // Analyze the email using messageId (string) instead of the database ID (number)
        // This fixes the PostgreSQL integer overflow issue with large Gmail message IDs
        const analysis = await analyzeEmail(userId, email.messageId);
        result.processed++;
        
        // Get user preferences for customizing responses
        const user = await storage.getUser(userId);
        if (!user) continue;
        
        // Process based on intent
        // Process email for potential leads (regardless of intent)
        try {
          const lead = await processEmailForLeads(email);
          if (lead) {
            result.leadsDetected++;
            console.log(`Lead detected in email "${email.subject}": ${lead.name} (${lead.email})`);
          }
        } catch (leadError) {
          console.error('Error detecting leads in email:', leadError);
        }

        switch (analysis.intent) {
          case EmailIntent.TASK_REQUEST:
            // Create a task
            if (analysis.extractedData?.taskDetails) {
              const details = analysis.extractedData.taskDetails;
              await storage.createTask({
                userId,
                title: details.taskName || 'Task from email',
                description: analysis.summary,
                priority: details.priority as any || 'medium',
                dueDate: details.dueDate ? new Date(details.dueDate) : undefined,
                aiGenerated: true,
                completed: false
              });
              result.tasksCreated++;
            }
            
            // Send reply if available
            if (analysis.suggestedReply) {
              // Import the AI service directly to avoid dynamic import issues
              const { generateEmailReply } = await import('../ai-service');
              const customizedReply = await generateEmailReply(analysis.suggestedReply, {
                userPreferences: user.preferences
              });
              
              if (await sendReply(userId, email.messageId, customizedReply)) {
                result.replied++;
              }
            }
            break;
            
          case EmailIntent.INVOICE_REQUEST:
            try {
              // Import needed AI services
              const { analyzeInvoiceRequest, generateInvoice, generateInvoiceEmailReply } = await import('../ai-service');
              
              // Analyze the email for invoice details
              const invoiceAnalysis = await analyzeInvoiceRequest(email);
              
              if (invoiceAnalysis.isInvoiceRequest && invoiceAnalysis.data) {
                // Generate invoice HTML
                const userPreferences = user.preferences || {};
                const invoiceResult = await generateInvoice(invoiceAnalysis.data, {
                  fullName: user.fullName,
                  email: user.email,
                  ...userPreferences
                });
                
                // Create invoice in database
                const invoiceData = {
                  userId,
                  number: invoiceResult.invoiceNumber,
                  client: invoiceAnalysis.data.clientName,
                  amount: invoiceAnalysis.data.totalAmount,
                  status: 'pending',
                  dueDate: new Date(invoiceAnalysis.data.dueDate),
                  issueDate: new Date(),
                  items: invoiceResult.invoiceItems
                };
                
                const invoice = await storage.createInvoice(invoiceData);
                
                // Generate email reply with invoice attached
                const emailReply = await generateInvoiceEmailReply(
                  email,
                  invoiceAnalysis.data,
                  invoiceResult.invoiceNumber,
                  {
                    fullName: user.fullName,
                    email: user.email,
                    ...userPreferences
                  }
                );
                
                // Send the reply with invoice
                // Note: In a future update, we would attach the actual invoice PDF/HTML
                if (await sendReply(userId, email.messageId, emailReply)) {
                  // Update invoice status to sent
                  await storage.updateInvoice(userId, invoice.id, {
                    status: 'sent',
                    lastEmailDate: new Date()
                  });
                  
                  result.invoicesCreated++;
                  result.replied++;
                }
              }
            } catch (invoiceError) {
              console.error('Error processing invoice request:', invoiceError);
            }
            break;
            
          case EmailIntent.MEETING_REQUEST:
            // For meeting requests, we'll handle in a future iteration
            // Mark that we processed it
            result.meetingsScheduled++;
            break;
            
          case EmailIntent.GENERAL_INQUIRY:
            // Send reply for general inquiries
            if (analysis.suggestedReply) {
              // Import the AI service directly to avoid dynamic import issues
              const { generateEmailReply } = await import('../ai-service');
              const customizedReply = await generateEmailReply(analysis.suggestedReply, {
                userPreferences: user.preferences
              });
              
              if (await sendReply(userId, email.messageId, customizedReply)) {
                result.replied++;
              }
            }
            break;
        }
        
        // Mark the email as read
        await markAsRead(userId, email.messageId);
      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError);
        // Continue processing other emails
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in auto processing emails:', error);
    return {
      processed: 0,
      replied: 0,
      tasksCreated: 0,
      invoicesCreated: 0,
      meetingsScheduled: 0,
      leadsDetected: 0
    };
  }
}

// Mark email as read
/**
 * Prioritize emails based on importance
 * This function sorts emails by priority based on sender, subject, and date
 */
function prioritizeEmails(emails: Email[], user: User): Email[] {
  // Set default important contacts and keywords
  const defaultImportantKeywords = ['urgent', 'important', 'deadline', 'asap', 'payment'];
  
  // Type guard to ensure safe access to user preferences
  const preferences = user.preferences || {};
  
  // Get important contacts and keywords with fallbacks
  const importantContacts: string[] = 
    Array.isArray((preferences as any).importantContacts) ? 
    (preferences as any).importantContacts : [];
    
  const importantKeywords: string[] = 
    Array.isArray((preferences as any).importantKeywords) ? 
    (preferences as any).importantKeywords : defaultImportantKeywords;
  
  // Score each email
  const scoredEmails = emails.map(email => {
    let score = 0;
    
    // Base score on recency (newer emails get higher priority)
    const ageInHours = (Date.now() - new Date(email.date).getTime()) / (1000 * 60 * 60);
    // Emails in the last hour get +50 points, reduces by 10 points per hour up to 5 hours
    score += Math.max(0, 50 - (ageInHours * 10));
    
    // Check if sender is in important contacts
    const senderEmail = email.from.toLowerCase();
    if (importantContacts.some((contact: string) => 
      senderEmail.includes(contact.toLowerCase())
    )) {
      score += 40;
    }
    
    // Check for important keywords in subject
    if (email.subject) {
      const subjectLower = email.subject.toLowerCase();
      for (const keyword of importantKeywords) {
        if (subjectLower.includes(keyword.toLowerCase())) {
          score += 30;
          break;
        }
      }
    }
    
    // Prioritize potential leads
    if (email.subject && email.body) {
      const combined = `${email.subject} ${email.body}`.toLowerCase();
      if (
        combined.includes('project') || 
        combined.includes('inquiry') || 
        combined.includes('service') ||
        combined.includes('quote') ||
        combined.includes('proposal')
      ) {
        score += 25;
      }
    }
    
    // Prioritize payment-related emails
    if (email.subject && email.body) {
      const combined = `${email.subject} ${email.body}`.toLowerCase();
      if (
        combined.includes('invoice') || 
        combined.includes('payment') || 
        combined.includes('bill') ||
        combined.includes('receipt')
      ) {
        score += 20;
      }
    }
    
    return { email, score };
  });
  
  // Sort by score (highest first)
  scoredEmails.sort((a, b) => b.score - a.score);
  
  // Return sorted emails
  return scoredEmails.map(item => item.email);
}

export async function markAsRead(userId: number, messageId: string): Promise<boolean> {
  const gmail = await getGmailClient(userId);
  if (!gmail) {
    throw new Error('Google account not connected. Please connect your Google account in Settings to use this feature.');
  }
  
  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
    
    // Update our local database as well
    try {
      const email = await storage.getEmailByMessageId(userId, messageId);
      if (email) {
        await storage.updateEmail(userId, email.id, { isRead: true });
      }
    } catch (err) {
      console.error('Error updating email status in database:', err);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking email as read:', error);
    return false;
  }
}