import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import config from "./config";
import slackRoutes from "./routes/slack-routes";
import notificationRoutes from "./routes/notifications";
import slackTestRoutes from "./routes/slack-test-routes";
import clientRoutes from './routes/clients';
import microsoftRoutes from './routes/microsoft-routes';
import { previewAuthMiddleware, handlePreviewLogin, isReplitPreview } from './preview-auth';
// Remove the scheduled notifications import since we're using notification-scheduler instead
import { 
  insertTaskSchema, 
  insertEventSchema, 
  insertInvoiceSchema, 
  insertAIChatSchema, 
  insertAIMessageSchema,
  insertLeadSchema,
  insertExpenseSchema,
  insertUserSettingsSchema,
  insertBetaSignupSchema,
  InsertExpense,
  InsertUserSettings,
  InsertBetaSignup
} from "@shared/schema";
import { ZodError } from "zod";
import { getGoogleAuthUrl, getTokensFromCode, getUserInfo } from "./services/google-auth";
import { google } from "googleapis";
import { upload, downloadFile, getPublicFileUrl } from "./services/file-service";

// Automated tasks that run periodically
const scheduledTasks: { [key: string]: NodeJS.Timeout } = {};
import { 
  generateEmailReply, 
  summarizeEmail, 
  generateMeetingPrep, 
  handleAssistantQuery,
  generateInvoiceFollowUpEmail,
  estimateTaskTime,
  extractInvoiceRequestFromEmail,
  generateTasksFromEmailContent
} from './ai-service';
import {
  getAuthUrl,
  setTokensForUser,
  fetchEmails,
  analyzeEmail,
  sendReply,
  autoProcessEmails,
  markAsRead,
  createOAuth2Client
} from './services/gmail';
import {
  processLeadsForUser,
  processLeadsForAllUsers
} from './services/lead-management';
import {
  runAutoCalendarManagement,
  scanEmailsForMeetings,
  prepareMeetingNotes
} from './services/auto-calendar';
import {
  createTaskFromChat, 
  createTaskFromEmail,
  getTasksForEmailThread
} from './services/task-service';
import leadsRouter from './routes/leads';
import googleAuthRouter from './routes/google-auth';
import googleDiagnosticRouter from './routes/google-diagnostic';
import dbDiagnosticRouter from './routes/db-diagnostic';
import domainSyncRouter from './routes/domain-sync-check';

export async function registerRoutes(app: Express): Promise<Server> {
  // Healthcheck endpoint - doesn't require authentication
  app.get("/api/healthcheck", (req, res) => {
    // Add debug logging
    console.log("\n===== HEALTHCHECK ENVIRONMENT VARS =====");
    console.log("FORCE_PRODUCTION_DOMAIN:", process.env.FORCE_PRODUCTION_DOMAIN);
    console.log("DISABLE_DOMAIN_OVERRIDE:", process.env.DISABLE_DOMAIN_OVERRIDE);
    console.log("CUSTOM_DOMAIN:", process.env.CUSTOM_DOMAIN);
    console.log("======================================\n");
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      server: "Binate AI",
      environment: process.env.NODE_ENV || "development",
      request: {
        host: req.get('host'),
        origin: req.get('origin'),
        forwarded: req.get('x-forwarded-host'),
        protocol: req.protocol,
        ip: req.ip,
        fullUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      },
      replit: {
        replId: process.env.REPL_ID,
        replSlug: process.env.REPL_SLUG,
        replOwner: process.env.REPL_OWNER
      },
      config: {
        baseUrl: config.baseUrl,
        forceProductionDomain: process.env.FORCE_PRODUCTION_DOMAIN === 'true',
        customDomain: process.env.CUSTOM_DOMAIN,
        disableDomainOverride: process.env.DISABLE_DOMAIN_OVERRIDE === 'true'
      },
      env_variables: {
        FORCE_PRODUCTION_DOMAIN: process.env.FORCE_PRODUCTION_DOMAIN,
        DISABLE_DOMAIN_OVERRIDE: process.env.DISABLE_DOMAIN_OVERRIDE,
        CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN,
        BASE_URL: process.env.BASE_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  });
  
  // Config endpoint for debugging OAuth (no authentication required)
  app.get("/api/config", (req, res) => {
    // Return a safe subset of the config (no secrets)
    res.json({
      baseUrl: config.baseUrl,
      google: {
        callbackUrl: config.google.callbackUrl,
        callbackPath: config.google.callbackPath
      }
    });
  });
  
  // Special preview login route - only available in Replit preview environment
  app.post("/api/preview-login", (req, res) => {
    handlePreviewLogin(req, res);
  });
  
  // Preview authentication middleware to help with Replit preview testing
  app.use(previewAuthMiddleware);
  
  // Set up authentication routes FIRST
  setupAuth(app);
  
  // Special debug route for checking Google OAuth configuration details
  app.get("/api/debug/google/test", (req, res) => {
    try {
      console.log("Testing Google OAuth configuration");
      
      // Check for required environment variables
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      const environmentCheck = {
        googleClientIdPresent: !!googleClientId,
        googleClientSecretPresent: !!googleClientSecret,
        googleClientIdPrefix: googleClientId ? `${googleClientId.substring(0, 8)}...` : 'missing',
        nodeEnv: process.env.NODE_ENV || 'not set',
        platform: process.env.REPL_SLUG ? 'Replit' : 'Other',
        hostname: req.headers.host,
        protocol: req.headers['x-forwarded-proto'] || 'https'
      };
      
      // Get callback URL settings
      const configCallbackUrl = config.google.callbackUrl;
      
      // Test dynamic detection
      const actualHost = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const actualOrigin = `${protocol}://${actualHost}`;
      const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
      
      const redirectUriTest = {
        configuredCallbackUrl: configCallbackUrl,
        detectedCallbackUrl: dynamicCallbackUrl,
        match: configCallbackUrl === dynamicCallbackUrl,
        headers: {
          host: req.headers.host,
          'x-forwarded-proto': req.headers['x-forwarded-proto'],
          'x-forwarded-host': req.headers['x-forwarded-host'],
          'x-replit-user-name': req.headers['x-replit-user-name']
        }
      };
      
      // Try generating an auth URL with both methods
      
      // 1. With default config
      const defaultAuthUrl = getGoogleAuthUrl();
      
      // 2. With dynamic detection
      process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
      const dynamicAuthUrl = getGoogleAuthUrl();
      delete process.env.TEMP_CALLBACK_URL;
      
      // Extract key parts from both URLs
      const defaultUrlParams = new URL(defaultAuthUrl).searchParams;
      const dynamicUrlParams = new URL(dynamicAuthUrl).searchParams;
      
      const urlComparison = {
        defaultRedirectUri: defaultUrlParams.get('redirect_uri'),
        dynamicRedirectUri: dynamicUrlParams.get('redirect_uri'), 
        redirectUriMatches: defaultUrlParams.get('redirect_uri') === dynamicUrlParams.get('redirect_uri'),
        defaultClientId: defaultUrlParams.get('client_id')?.substring(0, 8) + '...',
        dynamicClientId: dynamicUrlParams.get('client_id')?.substring(0, 8) + '...',
        clientIdMatches: defaultUrlParams.get('client_id') === dynamicUrlParams.get('client_id')
      };
      
      res.json({
        timestamp: new Date().toISOString(),
        environment: environmentCheck,
        redirectUri: redirectUriTest,
        urlGeneration: urlComparison,
        status: "OK",
        message: "Google OAuth configuration test completed"
      });
    } catch (error) {
      console.error("Debug Google OAuth test error:", error);
      res.status(500).json({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // CRITICAL FIX: Show all possible redirect URIs for Google Cloud Console
  app.get("/api/show-all-redirect-uris", (req, res) => {
    try {
      console.log("Generating all possible redirect URIs for Google Cloud Console");
      
      // Get actual origin from request
      const actualHost = req.headers.host || 'localhost:5000';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const actualOrigin = `${protocol}://${actualHost}`;
      const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
      
      // Get configured callback URL
      const configuredCallbackUrl = config.google.callbackUrl;
      
      // Special domain with random ID from replit environment
      const replitRandomDomain = actualHost; // This already contains the random domain
      const replitRandomCallbackUrl = `${protocol}://${replitRandomDomain}/api/auth/google/callback`;
      
      // Also add the binateai.replit.dev domain
      const binateaiCallbackUrl = "https://binateai.replit.dev/api/auth/google/callback";
      
      // Also add the preview domain from Replit
      const replitPreviewCallbackUrl = "https://binateai.replit.app/api/auth/google/callback";
      
      console.log("Detected host:", actualHost);
      console.log("Using protocol:", protocol);
      console.log("Full origin:", actualOrigin);
      
      // Response with all possible URLs
      res.json({
        current_request_info: {
          host: actualHost,
          protocol: protocol,
          origin: actualOrigin
        },
        possibleRedirectURIs: [
          {
            type: "configured",
            url: configuredCallbackUrl,
            description: "The URL configured in config.ts"
          },
          {
            type: "dynamic",
            url: dynamicCallbackUrl,
            description: "The URL dynamically detected from this request"
          },
          {
            type: "replit_random",
            url: replitRandomCallbackUrl,
            description: "The URL with Replit's random domain pattern"
          },
          {
            type: "binateai_domain",
            url: binateaiCallbackUrl,
            description: "The binateai.replit.dev domain"
          },
          {
            type: "replit_preview",
            url: replitPreviewCallbackUrl,
            description: "The Replit preview domain"
          }
        ],
        instructions: "Add ALL of these URLs to the Authorized Redirect URIs in Google Cloud Console to ensure OAuth works in all environments",
        next_steps: "Open the Google Cloud Console, go to the OAuth consent screen, and add these URIs to the list of authorized redirect URIs"
      });
    } catch (error: any) {
      console.error("Error generating redirect URIs:", error);
      res.status(500).json({
        error: "Failed to generate redirect URIs",
        message: error.message
      });
    }
  });
  
  // Google OAuth test endpoint - useful for checking configuration
  app.get("/api/google-oauth-test", async (req, res) => {
    try {
      console.log("Google OAuth test endpoint accessed");
      
      // Check if environment variables are set
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      const environmentCheck = {
        googleClientIdSet: !!googleClientId,
        googleClientSecretSet: !!googleClientSecret,
        googleClientIdPrefix: googleClientId ? googleClientId.substring(0, 8) + "..." : "Not set",
        nodeEnv: process.env.NODE_ENV || "Not set",
        isReplit: !!(process.env.REPLIT_SLUG || process.env.REPL_ID || process.env.REPLIT_OWNER)
      };
      
      // Check redirect URI
      let redirectUrl = "https://binateai.replit.dev/api/auth/google/callback";
      const redirectUriTest = {
        redirectUriUsed: redirectUrl,
        redirectUriEncoded: encodeURIComponent(redirectUrl)
      };
      
      // Generate test auth URL but don't return it directly
      const authUrl = await getGoogleAuthUrl();
      
      // Extract key parts from the URL for verification
      const urlParams = new URL(authUrl).searchParams;
      const urlTest = {
        clientIdMatches: urlParams.get('client_id') === googleClientId,
        redirectUriEncoded: urlParams.get('redirect_uri'),
        redirectUriDecoded: decodeURIComponent(urlParams.get('redirect_uri') || ""),
        redirectUriMatches: decodeURIComponent(urlParams.get('redirect_uri') || "") === redirectUrl,
        scopeIncludes: {
          gmail: !!urlParams.get('scope')?.includes('gmail'),
          calendar: !!urlParams.get('scope')?.includes('calendar')
        },
        promptConsent: urlParams.get('prompt') === 'consent'
      };
      
      res.json({
        timestamp: new Date().toISOString(),
        environment: environmentCheck,
        redirectUri: redirectUriTest,
        urlGeneration: urlTest,
        status: "OK",
        message: "Google OAuth configuration test completed"
      });
    } catch (error) {
      console.error("Google OAuth test error:", error);
      res.status(500).json({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Special debug OAuth route for testing without authentication requirement
  app.get("/api/debug/google/auth", (req, res) => {
    try {
      console.log("Generating debug Google auth URL without authentication");
      
      // Check for required environment variables
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment");
        return res.status(500).json({
          error: "Google integration is not properly configured. Please contact support."
        });
      }
      
      // Get headers for debugging
      const headers = {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
      };
      
      console.log("Debug headers:", headers);
      
      // Detect the actual hostname from the request
      const actualHost = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const actualOrigin = `${protocol}://${actualHost}`;
      
      // Use this for the callback URL
      const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
      console.log(`Debug detected host: ${actualHost}`);
      console.log(`Debug using callback URL: ${dynamicCallbackUrl}`);
      
      // Check if we should use the default config (for testing)
      if (req.query.useDefault === 'true') {
        console.log('[Debug] Using default configuration (from config.ts) for OAuth');
        // Don't set TEMP_CALLBACK_URL, let it use the default
      } else {
        // Set temp callback URL for auth URL generation
        process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
        
        // Override with query param if specified
        if (req.query.origin) {
          const originFromQuery = req.query.origin as string;
          process.env.TEMP_CALLBACK_URL = `${originFromQuery}/api/auth/google/callback`;
          console.log(`Debug using origin from query: ${process.env.TEMP_CALLBACK_URL}`);
        }
      }
      
      // Generate the auth URL (this will use our temp callback URL)
      const authUrl = getGoogleAuthUrl();
      
      // Clean up
      delete process.env.TEMP_CALLBACK_URL;
      
      // Return full debug info
      res.json({
        requestInfo: {
          headers: headers,
          detectedOrigin: actualOrigin,
          url: req.url,
          query: req.query
        },
        authUrl: authUrl,
        note: "This endpoint is for debugging only"
      });
    } catch (error) {
      console.error("Error generating debug Google auth URL:", error);
      res.status(500).json({ 
        error: error.message,
        details: "There was an error setting up Google authentication"
      });
    }
  });
  
  // Direct Google OAuth URL generation endpoint - with auth check but still works without authentication
  app.get("/api/google-auth-direct", async (req, res) => {
    try {
      // Check if user is authenticated and log for debugging
      const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
      console.log("Google Auth Direct endpoint - User authenticated:", isAuthenticated);
      
      if (isAuthenticated && req.user) {
        console.log("Authenticated user:", {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email || 'not set'
        });
      }
      
      // Use the official redirect URL from environment variable or default to domain
      let redirectUrl: string = process.env.GOOGLE_REDIRECT_URI || "https://binateai.replit.dev/api/auth/google/callback";
      
      console.log("Using redirect URL:", redirectUrl);
      
      // Check for required environment variables
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment variables:");
        console.error("GOOGLE_CLIENT_ID present:", !!process.env.GOOGLE_CLIENT_ID);
        console.error("GOOGLE_CLIENT_SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET);
        
        return res.status(500).json({
          error: "Google integration is not properly configured",
          authConfigured: false,
          isAuthenticated: isAuthenticated,
          timestamp: new Date().toISOString()
        });
      }
      
      // Generate the Google auth URL
      const authUrl = await getGoogleAuthUrl();
      
      // Log the URL components for debugging
      console.log("FULL GOOGLE AUTH URL:", authUrl);
      console.log("REDIRECT URI parameter:", redirectUrl);
      
      // Extract the actual redirect URL used in the authUrl 
      const match = authUrl.match(/redirect_uri=([^&]+)/);
      console.log("Original match:", match ? match[1] : "No match found");
      
      // Provide detailed response including authentication status
      res.json({
        authUrl,
        redirectUrl: redirectUrl,
        isAuthenticated: isAuthenticated,
        userId: isAuthenticated && req.user ? req.user.id : null,
        userEmail: isAuthenticated && req.user ? req.user.email : null,
        authConfigured: true,
        note: isAuthenticated 
          ? "You're logged in. Use this URL to connect your Google account directly" 
          : "WARNING: You are not logged in. Authentication is required to save Google connection",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Google Auth Direct error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Tasks API
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const leadId = req.query.leadId ? parseInt(req.query.leadId as string) : undefined;
    
    if (leadId) {
      const tasks = await storage.getTasksByLeadId(userId, leadId);
      res.json(tasks);
    } else {
      const tasks = await storage.getTasksByUserId(userId);
      res.json(tasks);
    }
  });
  
  // Dedicated route for getting tasks by lead ID
  app.get("/api/leads/:leadId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const leadId = parseInt(req.params.leadId);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    
    try {
      const tasks = await storage.getTasksByLeadId(userId, leadId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks by lead ID:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const taskData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const taskId = parseInt(req.params.id);
      const task = await storage.updateTask(userId, taskId, req.body);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const taskId = parseInt(req.params.id);
      const success = await storage.deleteTask(userId, taskId);
      
      if (!success) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Create task from chat/assistant conversation
  app.post("/api/tasks/from-chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const { chatContent, parsedTask } = req.body;
      
      if (!chatContent) {
        return res.status(400).json({ error: "Chat content is required" });
      }
      
      const task = await createTaskFromChat(userId, chatContent, parsedTask);
      
      if (!task) {
        return res.status(400).json({ error: "Failed to create task from chat" });
      }
      
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task from chat:", error);
      res.status(500).json({ error: error.message || "Failed to create task from chat" });
    }
  });
  
  // Get tasks related to an email thread
  app.get("/api/emails/:threadId/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const threadId = req.params.threadId;
      
      const tasks = await getTasksForEmailThread(userId, threadId);
      res.json(tasks);
    } catch (error: any) {
      console.error("Error fetching tasks for email thread:", error);
      res.status(500).json({ error: error.message || "Failed to fetch tasks for email thread" });
    }
  });
  
  // Create task from email
  app.post("/api/emails/:emailId/create-task", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const emailId = parseInt(req.params.emailId);
      
      // Get the email content
      const email = await storage.getEmailById(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      
      // Create task from email
      const task = await createTaskFromEmail(
        userId, 
        emailId, 
        {
          subject: email.subject,
          body: email.body,
          from: email.from,
          date: email.date
        }
      );
      
      if (!task) {
        return res.status(400).json({ error: "Failed to create task from email" });
      }
      
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task from email:", error);
      res.status(500).json({ error: error.message || "Failed to create task from email" });
    }
  });

  // Calendar Events API
  app.get("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const events = await storage.getEventsByUserId(userId);
    res.json(events);
  });

  app.post("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Get the raw request body and add userId
      const rawEventData = { ...req.body, userId };
      
      // Log the received data for debugging
      console.log("Received event data:", rawEventData);
      
      // Parse with our schema
      const eventData = insertEventSchema.parse(rawEventData);
      
      // Log parsed data
      console.log("Parsed event data:", eventData);
      
      // Create the event locally
      const event = await storage.createEvent(eventData);
      
      // Get connected services to check if Google is connected
      const services = await storage.getConnectedServicesByUserId(userId);
      const googleConnected = services.some(s => s.service === 'google' && s.connected);
      
      // If Google is connected, sync the event to Google Calendar
      if (googleConnected) {
        try {
          // Import calendar service
          const { syncEventToGoogleCalendar } = await import('./services/google-calendar');
          
          // Sync to Google Calendar
          const synced = await syncEventToGoogleCalendar(userId, event.id);
          
          if (synced) {
            console.log(`Event ${event.id} synced to Google Calendar for user ${userId}`);
          } else {
            console.log(`Failed to sync event ${event.id} to Google Calendar for user ${userId}`);
          }
        } catch (syncError) {
          console.error("Error syncing to Google Calendar:", syncError);
          // Don't fail the request if Google sync fails
        }
      }
      
      res.status(201).json(event);
    } catch (error: any) {
      console.error("Error creating event:", error.message);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Manual trigger for auto calendar management
  app.post("/api/calendar/auto-detect", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Get user preferences
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Temporarily enable auto schedule meetings if not already enabled
      const preferences = user.preferences ? JSON.parse(user.preferences as string) : {};
      const originalPreference = preferences.autoScheduleMeetings || false;
      
      // Update user preferences if needed
      if (!originalPreference) {
        const updatedPreferences = {
          ...preferences,
          autoScheduleMeetings: true
        };
        await storage.updateUserPreferences(userId, updatedPreferences);
      }
      
      // Run the auto calendar detection only for this user
      const suggestedEvents = await scanEmailsForMeetings(userId);
      
      // Instead of creating events directly, assign temporary IDs and return them for confirmation
      const detectedEvents = [];
      for (let i = 0; i < suggestedEvents.length; i++) {
        // Ensure required properties are present and handle types safely
        const event = suggestedEvents[i];
        if (!event.userId) {
          console.error(`Missing userId for event, skipping...`);
          continue;
        }
        
        // Get current or default time values as ISO strings
        const currentTimeISO = new Date().toISOString();
        const thirtyMinLaterISO = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        
        // Convert event to a proper InsertEvent with guaranteed values as strings
        const eventToInsert = {
          userId: event.userId,
          title: event.title || "Untitled Meeting",
          description: event.description || "",
          // Make sure dates are strings
          startTime: typeof event.startTime === 'string' ? event.startTime : 
                    (event.startTime instanceof Date ? event.startTime.toISOString() : currentTimeISO),
          endTime: typeof event.endTime === 'string' ? event.endTime : 
                  (event.endTime instanceof Date ? event.endTime.toISOString() : thirtyMinLaterISO),
          location: event.location || "",
          meetingUrl: event.meetingUrl || "",
          attendees: event.attendees || [],
          emailId: typeof event.emailId === 'number' ? event.emailId : undefined,
          aiNotes: event.aiNotes || "",
          contextNotes: event.contextNotes || "",
          temporary: true, // Mark as temporary for confirmation
          aiConfidence: event.aiConfidence || 0 // Provide default confidence
        };
        // Create event in database
        const createdEvent = await storage.createEvent(eventToInsert);
        
        detectedEvents.push(createdEvent);
      }
      
      // Restore original preference if it was temporarily changed
      if (!originalPreference) {
        const restoredPreferences = {
          ...preferences,
          autoScheduleMeetings: originalPreference
        };
        await storage.updateUserPreferences(userId, restoredPreferences);
      }
      
      res.json({
        eventsDetected: suggestedEvents.length,
        eventsCreated: detectedEvents,
        requiresConfirmation: true, // Indicate that these events need confirmation
        message: "Please review and confirm the detected meetings"
      });
    } catch (error: any) {
      console.error('Error in auto-detect meetings:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Confirm detected meetings endpoint
  app.post("/api/calendar/confirm-meetings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const { meetingIds } = req.body;
      
      if (!Array.isArray(meetingIds) || meetingIds.length === 0) {
        return res.status(400).json({ error: "No meeting IDs provided" });
      }
      
      // Get connected services to check if Google is connected
      const services = await storage.getConnectedServicesByUserId(userId);
      const googleConnected = services.some(s => s.service === 'google' && s.connected);
      
      // Get events by IDs and verify they belong to the user
      const confirmedEvents = [];
      
      for (const meetingId of meetingIds) {
        const event = await storage.getEvent(meetingId);
        
        if (!event) {
          continue; // Skip if event not found
        }
        
        if (event.userId !== userId) {
          continue; // Skip if event doesn't belong to the user
        }
        
        // Confirm the event by generating meeting notes if not already present
        if (!event.aiNotes) {
          try {
            const notes = await generateMeetingPrep(event);
            
            // Update the event with meeting notes and mark as permanent
            const updatedEvent = await storage.updateEvent(userId, meetingId, {
              aiNotes: notes.summary || "",
              contextNotes: notes.context || "",
              temporary: false // Mark as confirmed/permanent
            });
            
            confirmedEvents.push(updatedEvent);
          } catch (error) {
            console.error(`Error generating meeting notes for event ${meetingId}:`, error);
            // Still consider it confirmed even if notes generation fails
            confirmedEvents.push(event);
          }
        } else {
          // Event already has notes but might still be temporary
          if (event.temporary) {
            // Mark as permanent
            const updatedEvent = await storage.updateEvent(userId, meetingId, {
              temporary: false
            });
            confirmedEvents.push(updatedEvent);
          } else {
            // Already permanent, just add to confirmed list
            confirmedEvents.push(event);
          }
        }
        
        // If Google is connected, sync the event to Google Calendar
        if (googleConnected) {
          try {
            // Import calendar service
            const { syncEventToGoogleCalendar } = await import('./services/google-calendar');
            
            // Sync to Google Calendar
            const synced = await syncEventToGoogleCalendar(userId, event.id);
            
            if (synced) {
              console.log(`Event ${event.id} synced to Google Calendar for user ${userId}`);
            } else {
              console.log(`Failed to sync event ${event.id} to Google Calendar for user ${userId}`);
            }
          } catch (syncError) {
            console.error(`Error syncing event ${event.id} to Google Calendar:`, syncError);
            // Don't fail the request if Google sync fails
          }
        }
      }
      
      res.json({
        success: true,
        confirmedCount: confirmedEvents.length,
        events: confirmedEvents,
        googleCalendarSynced: googleConnected
      });
    } catch (error: any) {
      console.error('Error confirming meetings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Invoices API
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const leadId = req.query.leadId ? parseInt(req.query.leadId as string) : undefined;
    
    if (leadId) {
      const invoices = await storage.getInvoicesByLeadId(userId, leadId);
      res.json(invoices);
    } else {
      const invoices = await storage.getInvoicesByUserId(userId);
      res.json(invoices);
    }
  });
  
  // Dedicated route for getting invoices by lead ID
  app.get("/api/leads/:leadId/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    const leadId = parseInt(req.params.leadId);
    
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }
    
    try {
      const invoices = await storage.getInvoicesByLeadId(userId, leadId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices by lead ID:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const invoiceData = insertInvoiceSchema.parse({ ...req.body, userId });
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Auto-generate invoice from email
  app.post("/api/invoices/generate-from-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { emailId } = req.body;
      const userId = req.user!.id;
      
      // Get the email details
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      
      // Analyze the email for invoice request
      const analysis = await extractInvoiceRequestFromEmail(email);
      
      if (!analysis.isInvoiceRequest || !analysis.data) {
        return res.status(400).json({ 
          error: "Email doesn't contain a valid invoice request", 
          confidence: analysis.confidence 
        });
      }
      
      // Generate invoice HTML
      const userPreferences = req.user!.preferences || {};
      const invoiceResult = await generateInvoice(analysis.data, {
        fullName: req.user!.fullName,
        email: req.user!.email,
        ...userPreferences
      });
      
      // Create invoice in database
      const invoiceData = {
        userId,
        number: invoiceResult.invoiceNumber,
        client: analysis.data.clientName,
        amount: analysis.data.totalAmount,
        status: 'pending',
        dueDate: new Date(analysis.data.dueDate),
        issueDate: new Date(),
        items: invoiceResult.invoiceItems
      };
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // Generate email reply with invoice attached
      const emailReply = await generateInvoiceEmailReply(
        email,
        analysis.data,
        invoiceResult.invoiceNumber,
        {
          fullName: req.user!.fullName,
          email: req.user!.email,
          ...userPreferences
        }
      );
      
      // Return the result
      res.status(201).json({
        invoice,
        invoiceHtml: invoiceResult.invoiceHtml,
        emailReply
      });
    } catch (error: any) {
      console.error('Error generating invoice from email:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Send invoice email
  app.post("/api/invoices/:id/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { emailBody, recipient } = req.body;
      
      // Get the invoice
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Check if user has Gmail connected
      const googleService = await storage.getConnectedService(userId, 'google');
      
      if (!googleService || !googleService.connected) {
        return res.status(400).json({ error: "Google service not connected" });
      }
      
      // Send the email with invoice attached
      // This part will be implemented when we update the Gmail service
      // For now, we'll just mark the invoice as sent
      
      const updatedInvoice = await storage.updateInvoice(userId, invoiceId, {
        status: 'sent',
        lastEmailDate: new Date()
      });
      
      res.json({ success: true, invoice: updatedInvoice });
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Generate invoice follow-up email (preview only)
  app.post("/api/invoices/:id/follow-up", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the invoice
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
        return res.status(400).json({ error: "Invoice must be in 'sent' or 'overdue' status to send a follow-up" });
      }
      
      // Calculate days past due
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date();
      const now = new Date();
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue <= 0) {
        return res.status(400).json({ error: "Invoice is not past due yet" });
      }
      
      // Get user preferences
      const userPreferences = req.user!.preferences || {};
      
      // Extract invoice data for the follow-up email
      const invoiceData = {
        clientName: invoice.client,
        totalAmount: invoice.amount,
        currency: 'USD', // Default to USD for now
        dueDate: dueDate.toISOString().split('T')[0]
      };
      
      // Generate the follow-up email
      const emailContent = await generateInvoiceFollowUpEmail(
        invoiceData,
        invoice.number,
        daysPastDue,
        {
          fullName: req.user!.fullName,
          email: req.user!.email,
          ...userPreferences
        }
      );
      
      // Update invoice status to overdue if not already
      if (invoice.status !== 'overdue') {
        await storage.updateInvoice(userId, invoiceId, {
          status: 'overdue'
        });
      }
      
      // Return the generated email content
      res.json({
        emailContent,
        invoiceId,
        daysPastDue
      });
    } catch (error: any) {
      console.error('Error generating follow-up email:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Send invoice email using Gmail API
  app.post("/api/invoices/:id/send-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { recipientEmail } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required" });
      }
      
      // Get the invoice
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      // Import email sender service
      const { sendInvoiceEmail } = await import('./services/email-sender');
      
      // Send the invoice email
      const sentEmail = await sendInvoiceEmail(req.user!, invoice, recipientEmail);
      
      if (!sentEmail) {
        return res.status(500).json({ error: "Failed to send invoice email" });
      }
      
      // Update invoice status to sent
      await storage.updateInvoice(userId, invoiceId, {
        status: 'sent',
        lastEmailDate: new Date()
      });
      
      res.json({
        success: true,
        sentEmailId: sentEmail.id,
        message: `Invoice ${invoice.number} sent to ${recipientEmail}`
      });
    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Send payment reminder email using Gmail API
  app.post("/api/invoices/:id/send-reminder", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const invoiceId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { recipientEmail } = req.body;
      
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required" });
      }
      
      // Get the invoice
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== userId) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      
      if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
        return res.status(400).json({ error: "Invoice must be in 'sent' or 'overdue' status to send a reminder" });
      }
      
      // Calculate days past due
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date();
      const now = new Date();
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Import email sender service
      const { sendPaymentReminder } = await import('./services/email-sender');
      
      // Send the payment reminder
      const sentEmail = await sendPaymentReminder(req.user!, invoice, recipientEmail);
      
      if (!sentEmail) {
        return res.status(500).json({ error: "Failed to send payment reminder" });
      }
      
      // Update invoice status and reminder info
      await storage.updateInvoice(userId, invoiceId, {
        status: 'overdue',
        lastEmailDate: new Date(),
        remindersSent: (invoice.remindersSent || 0) + 1,
        reminderDates: [...(invoice.reminderDates || []), new Date()]
      });
      
      res.json({
        success: true,
        sentEmailId: sentEmail.id,
        message: `Payment reminder for invoice ${invoice.number} sent to ${recipientEmail}`,
        reminderCount: (invoice.remindersSent || 0) + 1,
        daysPastDue
      });
    } catch (error: any) {
      console.error('Error sending payment reminder:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Automated invoice follow-ups
  app.post("/api/invoices/auto-follow-up", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const { daysPastDue = 7 } = req.body;
      
      // Get all invoices for the user that are in 'sent' or 'overdue' status
      const allInvoices = await storage.getInvoicesByUserId(userId);
      const overdueInvoices = allInvoices.filter(invoice => 
        (invoice.status === 'sent' || invoice.status === 'overdue') && 
        invoice.dueDate && 
        new Date(invoice.dueDate) < new Date()
      );
      
      // Process each overdue invoice
      const results = [];
      for (const invoice of overdueInvoices) {
        // Skip if a follow-up was sent recently (within the last 3 days)
        if (invoice.lastEmailDate && 
            (new Date().getTime() - new Date(invoice.lastEmailDate).getTime() < 3 * 24 * 60 * 60 * 1000)) {
          results.push({
            invoiceId: invoice.id,
            result: 'skipped',
            reason: 'Follow-up sent recently'
          });
          continue;
        }
        
        // Calculate days past due
        const daysPast = invoice.dueDate 
          ? Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000)) 
          : 0;
        
        if (daysPast < daysPastDue) {
          results.push({
            invoiceId: invoice.id,
            result: 'skipped',
            reason: `Only ${daysPast} days past due, threshold is ${daysPastDue}`
          });
          continue;
        }
        
        try {
          // Import needed AI service
          const { generateInvoiceFollowUpEmail } = await import('./ai-service');
          
          // Generate follow-up email
          const invoiceData = {
            client: invoice.client,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            items: invoice.items
          };
          
          const followUpEmail = await generateInvoiceFollowUpEmail(
            invoiceData,
            invoice.number,
            daysPast,
            {
              fullName: req.user!.fullName,
              email: req.user!.email,
              preferences: req.user!.preferences
            }
          );
          
          // Check if user has Gmail connected
          const googleService = await storage.getConnectedService(userId, 'google');
          
          if (!googleService || !googleService.connected) {
            results.push({
              invoiceId: invoice.id,
              result: 'error',
              reason: 'Google service not connected'
            });
            continue;
          }
          
          // Get Gmail client
          const { getGmailClient, sendEmail } = await import('./services/gmail');
          const gmail = await getGmailClient(userId);
          
          if (!gmail) {
            results.push({
              invoiceId: invoice.id,
              result: 'error',
              reason: 'Gmail client unavailable'
            });
            continue;
          }
          
          // Send the email using Gmail
          // In a real implementation, we would need to know the recipient email address
          // For now, we'll just update the invoice status
          await storage.updateInvoice(userId, invoice.id, {
            status: 'overdue',
            lastEmailDate: new Date()
          });
          
          results.push({
            invoiceId: invoice.id,
            result: 'success',
            emailBody: followUpEmail
          });
        } catch (error: any) {
          results.push({
            invoiceId: invoice.id,
            result: 'error',
            reason: error.message
          });
        }
      }
      
      res.json({ results });
    } catch (error: any) {
      console.error('Error sending automated follow-ups:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Expenses API
  app.get("/api/expenses", async (req, res) => {
    console.log("GET /api/expenses - Authentication status:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log("GET /api/expenses - User not authenticated, returning 401");
      return res.sendStatus(401);
    }
    
    const userId = req.user!.id;
    console.log(`GET /api/expenses - Fetching expenses for user ${userId}`);
    
    const expenses = await storage.getExpensesByUserId(userId);
    console.log(`GET /api/expenses - Found ${expenses.length} expenses`);
    
    res.json(expenses);
  });

  app.get("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expenseId = parseInt(req.params.id);
    if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
    
    const expense = await storage.getExpense(expenseId);
    
    if (!expense) return res.status(404).send("Expense not found");
    if (expense.userId !== req.user!.id) return res.sendStatus(403);
    
    res.json(expense);
  });

  // Upload receipt for an expense
  app.post("/api/receipts/upload", upload.single('receipt'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Make sure a file was provided
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Generate a direct URL to the file that can be accessed via the static middleware
      const downloadUrl = getPublicFileUrl(req.file.filename);
      
      console.log("File uploaded successfully:", {
        filename: req.file.filename,
        downloadUrl,
        path: req.file.path
      });
      
      res.status(201).json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        downloadUrl: downloadUrl,
        message: "Receipt uploaded successfully"
      });
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      res.status(500).json({ 
        error: "Error uploading receipt", 
        message: error.message 
      });
    }
  });
  
  // Download a receipt
  app.get("/api/receipts/download/:filename", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      downloadFile(req, res);
    } catch (error: any) {
      console.error("Error downloading receipt:", error);
      res.status(500).json({ 
        error: "Error downloading receipt", 
        message: error.message 
      });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
        userId
      });
      
      const expense = await storage.createExpense(expenseData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating expense:", error);
      res.status(500).send("Error creating expense");
    }
  });

  app.patch("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expenseId = parseInt(req.params.id);
    if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
    
    try {
      const userId = req.user!.id;
      const updates = req.body;
      
      const updatedExpense = await storage.updateExpense(userId, expenseId, updates);
      
      if (!updatedExpense) {
        return res.status(404).send("Expense not found or not owned by user");
      }
      
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).send("Error updating expense");
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const expenseId = parseInt(req.params.id);
    if (isNaN(expenseId)) return res.status(400).send("Invalid expense ID");
    
    try {
      const userId = req.user!.id;
      const success = await storage.deleteExpense(userId, expenseId);
      
      if (!success) {
        return res.status(404).send("Expense not found or not owned by user");
      }
      
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).send("Error deleting expense");
    }
  });

  // User Settings API
  app.get("/api/user-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user!.id;
    let settings = await storage.getUserSettings(userId);
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings: InsertUserSettings = {
        userId,
        country: "US",
        defaultTaxRate: 0,
        defaultCurrency: "USD",
        fiscalYearStart: "01-01",
      };
      
      settings = await storage.createUserSettings(defaultSettings);
    }
    
    res.json(settings);
  });

  app.patch("/api/user-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const updates = req.body;
      
      const updatedSettings = await storage.updateUserSettings(userId, updates);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).send("Error updating user settings");
    }
  });

  // Leads API
  app.use('/api/leads', leadsRouter);
  
  // Google Auth API
  app.use('/api/auth/google', googleAuthRouter);
  
  // Google Diagnostic API - no authentication required
  app.use('/api/auth/google', googleDiagnosticRouter);
  
  // Database Diagnostic API - no authentication required
  app.use('/api/db', dbDiagnosticRouter);
  
  // Domain synchronization check - no authentication required
  app.use('/api/domain-sync', domainSyncRouter);
  
  // Activity log endpoint for daily summaries
  app.get("/api/activity-log", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const activities = await storage.getActivityLog(req.user!.id);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activity log:', error);
      res.status(500).json({ error: 'Failed to fetch activity log' });
    }
  });

  // User preferences and connected services API
  app.post("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Get the existing user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update full name or email if provided
      if (req.body.fullName || req.body.email) {
        await storage.updateUser(userId, {
          fullName: req.body.fullName || user.fullName,
          email: req.body.email || user.email,
        });
      }
      
      // Update preferences if provided
      if (req.body.preferences) {
        const updatedUser = await storage.updateUserPreferences(userId, req.body.preferences);
        return res.json(updatedUser);
      }
      
      // If we got here, just return the user
      const updatedUser = await storage.getUser(userId);
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Connected services endpoints for multi-user functionality
  app.get("/api/user/connected-services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const services = await storage.getConnectedServicesByUserId(userId);
      
      // Add additional validation information for services
      const enhancedServices = services.map(service => {
        if (service.service === "google") {
          return {
            ...service,
            connectionValid: !!service.credentials && service.connected,
            displayName: "Google (Gmail, Calendar)",
            icon: "google"
          };
        } else if (service.service === "stripe") {
          return {
            ...service,
            connectionValid: !!service.credentials && service.connected,
            displayName: "Stripe",
            icon: "stripe"
          };
        }
        return service;
      });
      
      res.json(enhancedServices);
    } catch (error: any) {
      console.error('Error fetching connected services:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/disconnect-service/:service", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const service = req.params.service.toLowerCase();
      
      // Update the service to disconnected state
      await storage.updateConnectedService(userId, service, {
        connected: false,
        credentials: null
      });
      
      // Log success for debugging
      console.log(`Successfully disconnected ${service} for user ${userId}`);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Error disconnecting service ${req.params.service}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Lead management API
  app.post("/api/leads/auto-process", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      console.log(`Manual lead processing triggered for user ${userId}`);
      
      const result = await processLeadsForUser(userId);
      
      res.json({
        success: true,
        processed: result.processed,
        priorityUpdated: result.priorityUpdated,
        followUpSent: result.followUpSent,
        errors: result.errors
      });
    } catch (error: any) {
      console.error('Error in manual lead processing:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Connected Services API
  app.get("/api/connected-services", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const services = await storage.getConnectedServicesByUserId(userId);
      
      let enhancedServices = [];
      
      // Add additional validation information for services
      for (const service of services) {
        if (service.service === "google") {
          // Do a real connection test for Google
          let connectionValid = false;
          let username = "Not connected";
          
          if (service.credentials && service.connected) {
            try {
              // Import the gmail service
              const { getGmailClient } = await import('./services/gmail');
              const gmail = await getGmailClient(userId);
              
              if (gmail) {
                // Test the connection by trying to get the user profile
                try {
                  const profile = await gmail.users.getProfile({ userId: 'me' });
                  if (profile.data && profile.data.emailAddress) {
                    connectionValid = true;
                    username = profile.data.emailAddress;
                    
                    // Update the service record with the verified email
                    await storage.updateConnectedService(userId, "google", {
                      username: profile.data.emailAddress
                    });
                  }
                } catch (profileError) {
                  console.error(`Gmail API profile fetch error for user ${userId}:`, profileError);
                  connectionValid = false;
                }
              }
            } catch (googleError) {
              console.error(`Error testing Google connection for user ${userId}:`, googleError);
              connectionValid = false;
            }
          }
          
          enhancedServices.push({
            ...service,
            connectionValid,
            displayName: service.displayName || "Google (Gmail, Calendar)",
            username: service.username || username,
            icon: "google"
          });
        } else if (service.service === "stripe") {
          enhancedServices.push({
            ...service,
            connectionValid: !!service.credentials && service.connected,
            displayName: service.displayName || "Stripe",
            username: service.username || "Not connected",
            icon: "stripe"
          });
        } else {
          enhancedServices.push(service);
        }
      }
      
      res.json(enhancedServices);
    } catch (error: any) {
      console.error('Error fetching connected services:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Google Auth API for multi-user functionality
  // Dedicated endpoint for getting the Google auth URL
  app.get("/api/auth/google/url", (req, res) => {
    try {
      console.log("Generating Google auth URL for client");
      
      // DYNAMIC APPROACH: Use the origin from the request to match the actual browser's domain
      const origin = req.headers.origin;
      let dynamicRedirectUri = null;
      
      if (origin) {
        try {
          const originUrl = new URL(origin);
          dynamicRedirectUri = `${originUrl.origin}/api/auth/google/callback`;
          console.log(`Using dynamic callback URL from browser origin: ${dynamicRedirectUri}`);
          
          // Set it as a temporary environment variable
          process.env.TEMP_CALLBACK_URL = dynamicRedirectUri;
        } catch (e) {
          console.error(`Failed to parse origin ${origin}:`, e);
        }
      }
      
      // Fall back to config if we couldn't generate a dynamic URL
      if (!dynamicRedirectUri) {
        console.log(`Using fixed callback URL from config: ${config.google.callbackUrl}`);
      }
      
      // Get the auth URL (will use dynamicRedirectUri via environment variable if set)
      const authUrl = getGoogleAuthUrl();
      console.log("Generated auth URL");
      return res.json({ url: authUrl });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      return res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  app.get("/api/auth/google", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthorized attempt to access Google auth URL");
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      console.log(`Generating Google auth URL for user ${req.user!.id} (${req.user!.username})`);
      
      // Check for required environment variables
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment");
        return res.status(500).json({
          error: "Google integration is not properly configured. Please contact support."
        });
      }
      
      // FIXED APPROACH: Always use the callback URL from config
      // This ensures we match exactly with one of the redirect URIs
      // registered in Google Cloud Console
      console.log(`Using fixed callback URL from config: ${config.google.callbackUrl}`);
      
      const authUrl = getGoogleAuthUrl();
      console.log(`Generated Google auth URL for user ${req.user!.id}`);
      
      res.json({ authUrl });
    } catch (error: any) {
      console.error('Error generating Google auth URL:', error);
      res.status(500).json({ 
        error: error.message,
        details: "There was an error setting up Google authentication"
      });
    }
  });
  
  // This comment is kept to mark where the duplicated route was removed
  
  // Unified Google OAuth callback handler - exact match for the URI registered in Google Cloud Console
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      console.log("=== GOOGLE OAUTH CALLBACK RECEIVED ===");
      console.log("Full request URL:", req.originalUrl);
      console.log("Query parameters:", JSON.stringify(req.query));
      
      // Print referrer header if available for debugging
      if (req.headers.referer) {
        console.log("Referrer:", req.headers.referer);
      }
      
      // Print only selected headers to avoid logging sensitive data
      const relevantHeaders = {
        host: req.headers.host,
        origin: req.headers.origin,
        'user-agent': req.headers['user-agent']
      };
      console.log("Selected request headers:", JSON.stringify(relevantHeaders, null, 2));
      
      // Ensure our request is properly formatted
      console.log("Request isAuthenticated:", req.isAuthenticated());
      if (req.isAuthenticated()) {
        console.log("User info:", {
          id: req.user!.id,
          username: req.user!.username,
          email: req.user!.email
        });
      }
      
      // Parse query parameters properly
      const { code, error, state } = req.query;
      console.log("Auth code received:", code ? "YES (length: " + code.toString().length + ")" : "NO");
      console.log("Error code:", error || "none");
      console.log("State parameter:", state || "none");
      
      // Check if Google returned an error
      if (error) {
        console.error(`Google returned an OAuth error: ${error}`);
        // Show more descriptive errors for common issues
        let errorMessage = `Google OAuth error: ${error}`;
        
        if (error === 'access_denied') {
          errorMessage = 'You declined to give permission to access your Google account.';
        } else if (error === 'redirect_uri_mismatch') {
          errorMessage = 'There is a configuration issue with the redirect URI. Please contact support.';
        } else if (error === 'deleted_client' || error === 'invalid_client') {
          errorMessage = 'The Google OAuth client appears to be invalid or deleted. Please check your Google Cloud Console configuration.';
        }
        
        // Check for various possible referrer paths
        const referer = req.headers.referer || '';
        
        // First priority: oauth-external-test.html
        if (referer.includes('oauth-external-test.html') || req.query.from === 'oauth-external-test') {
          console.log("Redirecting to oauth-external-test.html with error");
          return res.redirect(`/oauth-external-test.html?error=${encodeURIComponent(errorMessage)}`);
        }
        // Second priority: google-connect.html (legacy)
        else if (referer.includes('google-connect.html')) {
          console.log("Redirecting to google-connect.html with error");
          return res.redirect(`/google-connect.html?error=${encodeURIComponent(errorMessage)}`);
        } 
        // Third priority: google-test (legacy)
        else if (referer.includes('google-test')) {
          console.log("Redirecting to google-test page with error");
          return res.redirect(`/google-test?error=${encodeURIComponent(errorMessage)}`);
        }
        
        // Default fallback: settings page
        return res.redirect(`/settings?error=${encodeURIComponent(errorMessage)}`);
      }
      
      if (!code || typeof code !== 'string') {
        console.error("No valid authorization code received from Google");
        const redirectURL = `/settings?error=${encodeURIComponent('Invalid or missing authorization code')}`;
        console.log("Redirecting to:", redirectURL);
        return res.redirect(redirectURL);
      }
      
      // Check for required environment variables
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Missing Google OAuth credentials in environment variables:");
        console.error("GOOGLE_CLIENT_ID present:", !!process.env.GOOGLE_CLIENT_ID);
        console.error("GOOGLE_CLIENT_SECRET present:", !!process.env.GOOGLE_CLIENT_SECRET);
        return res.redirect('/settings?error=Google integration is not properly configured');
      }
      
      console.log("Attempting to exchange authorization code for tokens");
      
      try {
        // FIXED APPROACH: Use consistent callback URL from config
        // This ensures we use one of the redirect URIs set in Google Cloud Console
        console.log(`[Callback] Using fixed callback URL from config: ${config.google.callbackUrl}`);
        
        // Exchange the code for tokens using the fixed callback URL
        const tokens = await getTokensFromCode(code);
        
        // No need to clean up any environment variables
        console.log("Successfully exchanged code for tokens:", { 
          access_token_prefix: tokens.access_token ? tokens.access_token.substring(0, 10) + '...' : 'missing',
          has_refresh_token: !!tokens.refresh_token,
          expiry_date: tokens.expiry_date
        });
        
        // CRITICAL FIX: Create a fresh OAuth client specifically for using the access token
        console.log(`[Routes] Creating fresh OAuth client for token usage`);
        
        // Get client ID and secret directly from environment
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        
        if (!clientId || !clientSecret) {
          console.error('CRITICAL ERROR: Missing Google OAuth credentials in callback handler');
          throw new Error('Google OAuth credentials not properly configured');
        }
        
        console.log(`[OAuth Debug] Using client ID in callback (starts with): ${clientId.substring(0, 6)}...`);
        
        // Use consistent callback URL from config
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          config.google.callbackUrl
        );
        
        // Set all available credentials including token_type and scope
        oauth2Client.setCredentials({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          token_type: 'Bearer',
          scope: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly'
        });
        
        // Log access token for debugging
        console.log(`[OAuth Debug] Access token prefix: ${tokens.access_token.substring(0, 10)}...`);
        
        // Store the complete credentials for future use
        const storedCredentials = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          token_type: 'Bearer',
          scope: 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly'
        };
        
        try {
          // Get user info from Google to confirm identity
          console.log("Getting user info from Google");
          const userInfo = await getUserInfo(oauth2Client);
          console.log("Successfully retrieved user info for:", userInfo.email);
          
          // Handle the redirect based on where the request originated
          const referer = req.headers.referer || '';
          const from = req.query.from as string || '';
          
          // First priority: simple-connect
          if (from === 'simple-connect') {
            console.log("Request originated from simple-connect page");
            
            // We need to check if user is logged in to save the connection
            if (req.isAuthenticated()) {
              const userId = req.user!.id;
              console.log(`User ${userId} is authenticated, saving Google connection`);
              
              // Save connection with complete credentials
              await storage.updateConnectedService(userId, 'google', {
                connected: true,
                username: userInfo.email,
                displayName: userInfo.name || userInfo.email,
                credentials: storedCredentials,
                lastUpdated: new Date()
              });
              
              console.log("Google connection saved successfully from simple-connect page");
              return res.redirect('/google-connect-simple.html?success=true');
            } else {
              // Not authenticated but we got tokens - unusual case
              console.log("UNUSUAL: Got Google tokens from simple-connect but user is not authenticated");
              return res.redirect('/google-connect-simple.html?error=Not logged in. Please log in before connecting Google');
            }
          }
          
          // Second priority: oauth-external-test.html
          if (referer.includes('oauth-external-test.html') || from === 'oauth-external-test') {
            console.log("Request originated from oauth-external-test.html");
            
            // We need to check if user is logged in to save the connection
            if (req.isAuthenticated()) {
              const userId = req.user!.id;
              console.log(`User ${userId} is authenticated, saving Google connection`);
              
              // Save connection with complete credentials
              await storage.updateConnectedService(userId, 'google', {
                connected: true,
                username: userInfo.email,
                displayName: userInfo.name || userInfo.email,
                credentials: storedCredentials,
                lastUpdated: new Date()
              });
              
              console.log("Google connection saved successfully from external test page");
              return res.redirect('/oauth-external-test.html?success=true');
            } else {
              // Not authenticated but we got tokens - unusual case
              console.log("UNUSUAL: Got Google tokens but user is not authenticated");
              return res.redirect('/oauth-external-test.html?error=Not logged in. Please log in before connecting Google');
            }
          }
          
          // Second priority: google-connect.html (legacy)
          if (referer.includes('google-connect.html')) {
            // For standalone page, just show success message
            console.log("Request originated from standalone connect page");
            
            // We need to check if user is logged in to save the connection
            if (req.isAuthenticated()) {
              const userId = req.user!.id;
              console.log(`User ${userId} is authenticated, saving Google connection`);
              
              // Save connection with complete credentials
              await storage.updateConnectedService(userId, 'google', {
                connected: true,
                username: userInfo.email,
                displayName: userInfo.name || userInfo.email,
                credentials: storedCredentials,
                lastUpdated: new Date()
              });
              
              console.log("Google connection saved successfully from standalone page");
              return res.redirect('/google-connect.html?success=true');
            } else {
              // Not authenticated but we got tokens - this is unusual from standalone page
              console.log("UNUSUAL: Got Google tokens but user is not authenticated");
              return res.redirect('/google-connect.html?error=Not logged in. Please log in before connecting Google');
            }
          }
          
          // If user is logged in, save the connection
          if (req.isAuthenticated()) {
            const userId = req.user!.id;
            console.log(`User ${userId} is authenticated, saving Google connection`);
            
            // Update user's email if not set
            if (!req.user!.email) {
              await storage.updateUser(userId, { email: userInfo.email });
            }
            
            // Update connected service with proper info
            await storage.updateConnectedService(userId, 'google', {
              connected: true,
              username: userInfo.email,
              displayName: userInfo.name || userInfo.email,
              credentials: storedCredentials,
              lastUpdated: new Date()
            });
            
            console.log("Google connection saved successfully");
            
            // Check if the request came from the test page
            if (referer.includes('/google-test')) {
              console.log("Redirecting to google-test page with success message");
              return res.redirect('/google-test?success=google_connected');
            }
            
            // Default: redirect to settings page with success message
            console.log("Redirecting to settings page with success message");
            return res.redirect('/integrations?success=google_connected');
          } else {
            console.log("User not authenticated, redirecting to login");
            // If user is not logged in, redirect to login page
            return res.redirect('/auth?error=Please log in first before connecting Google');
          }
        } catch (userInfoError: any) {
          console.error("Error getting user info from Google:", userInfoError);
          console.error("Error stack:", userInfoError.stack);
          return res.redirect(`/settings?error=${encodeURIComponent(`Error getting user info: ${userInfoError.message}`)}`);
        }
      } catch (tokenError: any) {
        console.error("Error exchanging code for tokens:", tokenError);
        console.error("Error details:", tokenError.stack);
        
        // Handle token exchange errors for different page sources
        const referer = req.headers.referer || '';
        const from = req.query.from as string || '';
        
        // First priority: oauth-external-test.html
        if (referer.includes('oauth-external-test.html') || from === 'oauth-external-test') {
          return res.redirect(`/oauth-external-test.html?error=${encodeURIComponent(`Error exchanging code for tokens: ${tokenError.message}`)}`);
        }
        // Second priority: google-connect.html (legacy)
        else if (referer.includes('google-connect.html')) {
          return res.redirect(`/google-connect.html?error=${encodeURIComponent(`Error exchanging code for tokens: ${tokenError.message}`)}`);
        }
        // Default: settings page
        return res.redirect(`/settings?error=${encodeURIComponent(`Error exchanging code for tokens: ${tokenError.message}`)}`);
      }
    } catch (error: any) {
      console.error('Unexpected error in Google auth callback:', error);
      console.error('Stack trace:', error.stack);
      
      // Try to handle various redirect scenarios
      const referer = req.headers.referer || '';
      const from = req.query.from as string || '';
      
      // First priority: oauth-external-test.html
      if (referer.includes('oauth-external-test.html') || from === 'oauth-external-test') {
        return res.redirect(`/oauth-external-test.html?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
      }
      // Second priority: google-connect.html (legacy)
      else if (referer.includes('google-connect.html')) {
        return res.redirect(`/google-connect.html?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
      } 
      // Third priority: google-test (legacy)
      else if (referer.includes('google-test')) {
        return res.redirect(`/google-test?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
      }
      
      // Default: settings page
      res.redirect(`/settings?error=${encodeURIComponent(`Unexpected error: ${error.message}`)}`);
    }
  });

  app.post("/api/connected-services/:service", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const service = req.params.service;
      const connected = true;
      const credentials = req.body.credentials || {};
      
      const connectedService = await storage.updateConnectedService(userId, service, {
        connected,
        credentials,
      });
      
      res.status(200).json(connectedService);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Disconnect service API
  app.post("/api/disconnect-service/:service", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const service = req.params.service.toLowerCase();
      
      // Valid services check
      if (!['google', 'stripe'].includes(service)) {
        return res.status(400).json({ error: `Invalid service: ${service}` });
      }
      
      // Update the service to be disconnected
      await storage.updateConnectedService(userId, service, {
        connected: false,
        credentials: null,
        username: null,
        displayName: null,
        lastUpdated: new Date()
      });
      
      res.status(200).json({ success: true, message: `Successfully disconnected from ${service}` });
    } catch (error: any) {
      console.error(`Error disconnecting service:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Assistant API
  
  app.post("/api/ai/estimate-task-time", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const taskDetails = req.body;
      
      if (!taskDetails.title) {
        return res.status(400).json({ 
          error: "Task title is required for time estimation" 
        });
      }
      
      const estimation = await estimateTaskTime({
        title: taskDetails.title,
        description: taskDetails.description || undefined
      });
      
      res.json({
        estimatedTime: estimation.estimatedTime,
        confidence: estimation.confidence,
        reasoning: estimation.reasoning
      });
    } catch (error: any) {
      console.error('Error in /api/ai/estimate-task-time:', error);
      res.status(500).json({ error: error.message || 'Failed to estimate task time' });
    }
  });

  app.post("/api/ai/draft-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const emailContent = req.body.emailContent;
      const userPreferences = req.user?.preferences || {};
      
      const response = await generateEmailReply(emailContent, userPreferences);
      res.json(response);
    } catch (error: any) {
      console.error('Error in /api/ai/draft-email:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // DEBUGGING ENDPOINTS FOR OAUTH
  
  // Check client ID 
  app.get("/api/client-id-check", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const maskedId = clientId ? `${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 5)}` : 'Not set';
    
    res.json({
      clientId: clientId,
      maskedId: maskedId,
      present: !!clientId
    });
  });
  
  // OAuth configuration diagnostic endpoint
  app.get("/api/oauth-diagnostics", async (req, res) => {
    try {
      // Current environment
      const envInfo = {
        NODE_ENV: process.env.NODE_ENV,
        REPL_ID: process.env.REPL_ID,
        REPL_SLUG: process.env.REPL_SLUG,
        REPL_OWNER: process.env.REPL_OWNER,
        HOST: process.env.HOST,
        isReplit: !!(process.env.REPLIT_SLUG || process.env.REPL_ID || process.env.REPLIT_OWNER)
      };
      
      // Get client credentials info
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      // Google Cloud Console knows about these redirect URIs
      const knownRedirectURIs = [
        "https://binateai.replit.app/api/auth/google/callback",
        "https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev/api/auth/google/callback"
      ];
      
      // Get current callback URL from config
      const currentCallbackUrl = config.google.callbackUrl;
      
      // Request-based dynamic detection of callback URL
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || '';
      const dynamicCallbackUrl = `${protocol}://${host}/api/auth/google/callback`;
      
      // Test different auth URL generation approaches
      
      // 1. Regular function from config
      const standardAuthUrl = getGoogleAuthUrl();
      const standardUrlObj = new URL(standardAuthUrl);
      const standardClientId = standardUrlObj.searchParams.get('client_id');
      const standardRedirectUri = standardUrlObj.searchParams.get('redirect_uri');
      
      // 2. Override with dynamic callback URL
      process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
      const dynamicAuthUrl = getGoogleAuthUrl();
      delete process.env.TEMP_CALLBACK_URL;
      
      const dynamicUrlObj = new URL(dynamicAuthUrl);
      const dynamicClientId = dynamicUrlObj.searchParams.get('client_id');
      const dynamicRedirectUri = dynamicUrlObj.searchParams.get('redirect_uri');
      
      // Check if the dynamic redirect URI matches any known URIs
      const dynamicUriMatches = knownRedirectURIs.some(uri => 
        uri.toLowerCase() === dynamicRedirectUri.toLowerCase()
      );
      
      // Return the diagnostic information
      res.json({
        timestamp: new Date().toISOString(),
        environment: envInfo,
        credentials: {
          clientIdPresent: !!clientId,
          clientIdPrefix: clientId ? clientId.substring(0, 10) + '...' : 'Not set',
          clientSecretPresent: !!clientSecret
        },
        redirectUris: {
          configured: currentCallbackUrl,
          dynamic: dynamicCallbackUrl,
          known: knownRedirectURIs,
          dynamicUriKnown: dynamicUriMatches
        },
        authUrls: {
          standard: {
            clientId: standardClientId,
            redirectUri: standardRedirectUri,
            matchesEnv: standardClientId === clientId,
            redirectMatches: standardRedirectUri === currentCallbackUrl
          },
          dynamic: {
            clientId: dynamicClientId,
            redirectUri: dynamicRedirectUri,
            matchesEnv: dynamicClientId === clientId,
            redirectMatches: dynamicRedirectUri === dynamicCallbackUrl
          }
        },
        requestInfo: {
          headers: {
            host: req.headers.host,
            origin: req.headers.origin,
            referer: req.headers.referer,
            'x-forwarded-proto': req.headers['x-forwarded-proto'],
            'x-forwarded-host': req.headers['x-forwarded-host']
          },
          url: req.originalUrl
        }
      });
    } catch (error) {
      console.error("Error in OAuth diagnostics:", error);
      res.status(500).json({
        error: "Failed to generate OAuth diagnostics",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Debug token exchange
  app.post("/api/debug/token-exchange", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          error: "Authorization code is required" 
        });
      }
      
      console.log(`[Debug] Attempting token exchange with code: ${code.substring(0, 10)}...`);
      
      // Use a consistent callback URL
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || '';
      const callbackUrl = `${protocol}://${host}/api/auth/google/callback`;
      
      console.log(`[Debug] Using callback URL: ${callbackUrl}`);
      
      // Get client ID and secret directly from environment
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({
          success: false,
          error: "Missing OAuth credentials"
        });
      }
      
      console.log(`[Debug] Using client ID: ${clientId.substring(0, 10)}...`);
      
      // Set up temporary environment override
      process.env.TEMP_CALLBACK_URL = callbackUrl;
      
      try {
        // Exchange the code for tokens
        const tokens = await getTokensFromCode(code);
        
        // Clean up environment variable
        delete process.env.TEMP_CALLBACK_URL;
        
        // Return token info (with access token masked for security)
        res.json({
          success: true,
          access_token: tokens.access_token,
          refresh_token: !!tokens.refresh_token,
          expiry_date: tokens.expiry_date
        });
      } catch (exchangeError) {
        // Clean up environment variable in case of error
        delete process.env.TEMP_CALLBACK_URL;
        
        console.error('[Debug] Token exchange error:', exchangeError);
        
        res.status(400).json({
          success: false,
          error: exchangeError.message || "Failed to exchange code for tokens",
          details: exchangeError.stack
        });
      }
    } catch (error) {
      console.error('[Debug] Unexpected error in token exchange endpoint:', error);
      
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
  });
  
  // Test token validity
  app.post("/api/debug/test-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: "Access token is required"
        });
      }
      
      console.log(`[Debug] Testing token: ${token.substring(0, 10)}...`);
      
      // Create a temporary OAuth client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      
      // Set the credentials using just the access token
      oauth2Client.setCredentials({
        access_token: token
      });
      
      try {
        // Try to get user info with the token
        console.log('[Debug] Making API request to get user info...');
        const oauth2 = google.oauth2({
          auth: oauth2Client,
          version: "v2"
        });
        
        const userInfo = await oauth2.userinfo.get();
        
        if (!userInfo.data) {
          throw new Error("No user data returned");
        }
        
        console.log('[Debug] Successfully retrieved user info');
        
        res.json({
          success: true,
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture
        });
      } catch (apiError) {
        console.error('[Debug] API error:', apiError);
        
        res.status(400).json({
          success: false,
          error: "API request failed",
          details: apiError.message,
          code: apiError.code,
          status: apiError.status
        });
      }
    } catch (error) {
      console.error('[Debug] Unexpected error in test token endpoint:', error);
      
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
  });

  app.post("/api/ai/summarize-email", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const emailBody = req.body.body || "";
      const summary = await summarizeEmail(emailBody);
      
      res.json({ summary });
    } catch (error: any) {
      console.error('Error in /api/ai/summarize-email:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/meeting-prep", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventId = req.body.eventId;
      
      // Get event details from database
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Format event for AI service
      const eventDetails = {
        title: event.title,
        date: new Date(event.startTime).toLocaleDateString(),
        time: new Date(event.startTime).toLocaleTimeString(),
        attendees: event.attendees || [],
        description: event.description || ""
      };
      
      const response = await generateMeetingPrep(eventDetails);
      res.json(response);
    } catch (error: any) {
      console.error('Error in /api/ai/meeting-prep:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/ai/generate-task", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const context = req.body;
      const taskData = await generateTask(context);
      
      // Create the task in the database
      const userId = req.user!.id;
      const task = await storage.createTask({
        userId,
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        priority: taskData.priority || "medium",
        assignedTo: taskData.assignedTo || "me", // Use the AI-assigned value or default to "me"
        aiGenerated: true,
        completed: false,
        estimatedTime: taskData.estimatedTime || 30 // Store the estimated time
      });
      
      res.status(201).json(task);
    } catch (error: any) {
      console.error('Error in /api/ai/generate-task:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/ai/query", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { query, history } = req.body;
      const userPreferences = req.user?.preferences || {};
      
      const response = await handleAssistantQuery(query, history, userPreferences);
      res.json({ response });
    } catch (error: any) {
      console.error('Error in /api/ai/query:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Chats API
  app.get("/api/ai/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const chats = await storage.getAIChatsByUserId(userId);
      
      // Sort chats: pinned first, then by updated date (newest first)
      const sortedChats = chats.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date();
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      res.json(sortedChats);
    } catch (error: any) {
      console.error('Error in /api/ai/chats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const chatData = insertAIChatSchema.parse({ ...req.body, userId });
      const chat = await storage.createAIChat(chatData);
      res.status(201).json(chat);
    } catch (error: any) {
      console.error('Error in creating chat:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/ai/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getAIChat(chatId);
      
      if (!chat || chat.userId !== req.user!.id) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      res.json(chat);
    } catch (error: any) {
      console.error('Error in /api/ai/chats/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/ai/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const chatId = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedChat = await storage.updateAIChat(userId, chatId, updates);
      
      if (!updatedChat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      res.json(updatedChat);
    } catch (error: any) {
      console.error('Error in updating chat:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/ai/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const chatId = parseInt(req.params.id);
      
      const success = await storage.deleteAIChat(userId, chatId);
      
      if (!success) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error in deleting chat:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/ai/chats/:chatId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const chatId = parseInt(req.params.chatId);
      const chat = await storage.getAIChat(chatId);
      
      if (!chat || chat.userId !== req.user!.id) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      const messages = await storage.getAIMessagesByChatId(chatId);
      res.json(messages);
    } catch (error: any) {
      console.error('Error in /api/ai/chats/:chatId/messages:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chats/:chatId/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const chatId = parseInt(req.params.chatId);
      const chat = await storage.getAIChat(chatId);
      
      if (!chat || chat.userId !== req.user!.id) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      // Validate and create the message
      const messageData = insertAIMessageSchema.parse({ 
        ...req.body, 
        chatId 
      });
      
      const message = await storage.createAIMessage(messageData);
      
      // If this is a user message, generate an AI response
      if (message.role === 'user') {
        try {
          // Get the chat history
          const chatHistory = await storage.getAIMessagesByChatId(chatId);
          
          // Call the AI service to generate a response
          const response = await handleAssistantQuery(
            message.content,
            chatHistory,
            req.user?.preferences || {}
          );
          
          // Save the AI response to the database
          const aiMessage = await storage.createAIMessage({
            chatId,
            role: 'assistant',
            content: response
          });
          
          // Return both messages
          res.status(201).json({
            userMessage: message,
            aiResponse: aiMessage
          });
        } catch (aiError: any) {
          console.error('Error generating AI response:', aiError);
          
          // Still return the user message even if AI response fails
          res.status(201).json({
            userMessage: message,
            aiError: aiError.message
          });
        }
      } else {
        // Just return the created message if it's not a user message
        res.status(201).json(message);
      }
    } catch (error: any) {
      console.error('Error in chat message creation:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Stats API
  // Gmail API Routes
  app.get("/api/emails", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      console.log(`Email request for user ${userId}`);
      
      // Check for query params
      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Check if Google is connected before proceeding
      const googleService = await storage.getConnectedService(userId, 'google');
      const isGoogleConnected = googleService && googleService.connected && googleService.credentials;
      
      console.log(`Google connection status for user ${userId}: ${isGoogleConnected ? 'Connected' : 'Not connected'}`);
      
      // If we're fetching new emails, try Gmail first
      if (req.query.fetch === 'true') {
        if (isGoogleConnected) {
          try {
            console.log(`Fetching new emails from Gmail for user ${userId}`);
            // Import the gmail service
            const { getGmailClient, fetchEmails } = await import('./services/gmail');
            
            // Test the connection first
            const gmail = await getGmailClient(userId);
            if (gmail) {
              console.log(`Gmail client obtained for user ${userId}, fetching emails...`);
              const fetchedEmails = await fetchEmails(userId, limit);
              console.log(`Fetched ${fetchedEmails.length} emails from Gmail for user ${userId}`);
              
              // Return the newly fetched emails
              return res.json(fetchedEmails);
            } else {
              console.log(`Failed to get Gmail client for user ${userId} despite having credentials`);
              
              // Mark service as disconnected since we couldn't get a client
              await storage.updateConnectedService(userId, 'google', {
                connected: false,
                lastError: 'Failed to get Gmail client despite having credentials'
              });
            }
          } catch (fetchError) {
            console.error(`Error fetching emails from Gmail for user ${userId}:`, fetchError);
            // Continue to return emails from storage as fallback
          }
        } else {
          console.log(`Cannot fetch from Gmail for user ${userId} because Google is not connected`);
        }
      }
      
      // Fallback to storage or just get from storage if not fetching
      console.log(`Getting emails from storage for user ${userId}`);
      const emails = await storage.getEmailsByUserId(userId, { unreadOnly, limit });
      console.log(`Found ${emails.length} emails in storage for user ${userId}`);
      
      return res.json(emails);
    } catch (error: any) {
      console.error('Error in /api/emails:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/emails/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const emailId = parseInt(req.params.id);
      const email = await storage.getEmail(emailId);
      
      if (!email || email.userId !== req.user!.id) {
        return res.status(404).json({ error: "Email not found" });
      }
      
      res.json(email);
    } catch (error: any) {
      console.error('Error in /api/emails/:id:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/emails/:id/analyze", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const emailIdParam = req.params.id;
      
      // Check if the ID is a Gmail messageId (string) or a database ID (number)
      // Gmail messageIds are large numbers that might exceed PostgreSQL's integer limit
      // so we need to handle them as strings
      let emailIdOrMessageId: number | string;
      
      if (/^\d+$/.test(emailIdParam) && emailIdParam.length < 10) {
        // If it's a short numeric string, it's likely a database ID
        emailIdOrMessageId = parseInt(emailIdParam);
      } else {
        // Otherwise, treat as a Gmail messageId
        emailIdOrMessageId = emailIdParam;
      }
      
      console.log(`Analyzing email with ID/messageId: ${emailIdOrMessageId}`);
      const analysis = await analyzeEmail(userId, emailIdOrMessageId);
      res.json(analysis);
    } catch (error: any) {
      console.error('Error analyzing email:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/emails/:id/reply", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const emailIdParam = req.params.id;
      
      // Check if ID is messageId or database ID
      let email: Email | undefined;
      
      if (/^\d+$/.test(emailIdParam) && emailIdParam.length < 10) {
        // If it's a short numeric string, treat as database ID
        email = await storage.getEmail(parseInt(emailIdParam));
      } else {
        // Otherwise, treat as Gmail messageId
        email = await storage.getEmailByMessageId(userId, emailIdParam);
      }
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      
      const replyContent = req.body.content;
      if (!replyContent) {
        return res.status(400).json({ error: "Reply content is required" });
      }
      
      const success = await sendReply(userId, email.messageId, replyContent);
      
      if (success) {
        res.json({ success: true, message: "Reply sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send reply" });
      }
    } catch (error: any) {
      console.error('Error in /api/emails/:id/reply:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/emails/:id/mark-read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const emailIdParam = req.params.id;
      
      // Check if ID is messageId or database ID
      let email: Email | undefined;
      
      if (/^\d+$/.test(emailIdParam) && emailIdParam.length < 10) {
        // If it's a short numeric string, treat as database ID
        email = await storage.getEmail(parseInt(emailIdParam));
      } else {
        // Otherwise, treat as Gmail messageId
        email = await storage.getEmailByMessageId(userId, emailIdParam);
      }
      
      if (!email || email.userId !== userId) {
        return res.status(404).json({ error: "Email not found" });
      }
      
      console.log(`Marking email as read, messageId: ${email.messageId}`);
      const success = await markAsRead(userId, email.messageId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to mark email as read" });
      }
    } catch (error: any) {
      console.error('Error in /api/emails/:id/mark-read:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Send a new email
  app.post("/api/emails/send", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const { to, subject, message } = req.body;
      
      if (!to || !subject || !message) {
        return res.status(400).json({ error: "To, subject, and message are required" });
      }
      
      // Import the sendEmail function
      const { sendEmail } = await import('./services/gmail');
      
      const success = await sendEmail(userId, to, subject, message);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "Failed to send email" });
      }
    } catch (error: any) {
      console.error('Error in /api/emails/send:', error);
      
      // Check if the error is related to Gmail client not being available
      if (error.message && error.message.includes('Google account not connected')) {
        return res.status(403).json({ 
          error: error.message,
          action: 'connect_google'
        });
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/emails/auto-process", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const result = await autoProcessEmails(userId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/emails/auto-process:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Pending Email Reply Routes (for semi-manual approval workflow)
  app.get("/api/pending-email-replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const pendingReplies = await storage.getPendingEmailReplies(userId);
      res.json(pendingReplies);
    } catch (error: any) {
      console.error('Error getting pending email replies:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/pending-email-replies/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      
      if (!pendingReply) {
        return res.status(404).json({ error: 'Pending email reply not found' });
      }
      
      // Security check - ensure the user can only access their own pending replies
      if (pendingReply.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to access this pending reply' });
      }
      
      res.json(pendingReply);
    } catch (error: any) {
      console.error('Error getting pending email reply:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/pending-email-replies", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      
      // Transform data to handle both 'to' and 'recipient' fields
      const { to, ...otherFields } = req.body;
      
      const pendingReplyData = {
        ...otherFields,
        userId,
        recipient: req.body.recipient || req.body.to, // Use recipient if available, otherwise use to
        status: 'pending' // Force status to be 'pending' for new entries
      };
      
      const pendingReply = await storage.createPendingEmailReply(pendingReplyData);
      res.json(pendingReply);
    } catch (error: any) {
      console.error('Error creating pending email reply:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put("/api/pending-email-replies/:id/approve", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      
      if (!pendingReply) {
        return res.status(404).json({ error: 'Pending email reply not found' });
      }
      
      // Security check - ensure the user can only update their own pending replies
      if (pendingReply.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to approve this pending reply' });
      }
      
      // Update status to approved
      const updatedReply = await storage.updatePendingEmailReply(pendingReplyId, {
        status: 'approved',
        actionTaken: 'approved',
        actionDate: new Date()
      });
      
      // TODO: Send the approved email via Gmail API
      // This will be handled in the next implementation step
      
      res.json(updatedReply);
    } catch (error: any) {
      console.error('Error approving pending email reply:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.put("/api/pending-email-replies/:id/reject", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      
      if (!pendingReply) {
        return res.status(404).json({ error: 'Pending email reply not found' });
      }
      
      // Security check - ensure the user can only update their own pending replies
      if (pendingReply.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to reject this pending reply' });
      }
      
      // Update status to rejected
      const updatedReply = await storage.updatePendingEmailReply(pendingReplyId, {
        status: 'rejected',
        actionTaken: 'rejected',
        actionDate: new Date()
      });
      
      res.json(updatedReply);
    } catch (error: any) {
      console.error('Error rejecting pending email reply:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  app.delete("/api/pending-email-replies/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const pendingReplyId = parseInt(req.params.id);
      const pendingReply = await storage.getPendingEmailReply(pendingReplyId);
      
      if (!pendingReply) {
        return res.status(404).json({ error: 'Pending email reply not found' });
      }
      
      // Security check - ensure the user can only delete their own pending replies
      if (pendingReply.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized to delete this pending reply' });
      }
      
      const result = await storage.deletePendingEmailReply(pendingReplyId);
      res.json({ success: result });
    } catch (error: any) {
      console.error('Error deleting pending email reply:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Google OAuth routes have been consolidated to the implementation above

  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const tasks = await storage.getTasksByUserId(userId);
      const events = await storage.getEventsByUserId(userId);
      const invoices = await storage.getInvoicesByUserId(userId);
      
      // Get actual unread email count
      let unreadEmails = 0;
      try {
        // If fetching from database fails, just return 0 for now until db schema is fixed
        try {
          const emails = await storage.getEmailsByUserId(userId, { unreadOnly: true });
          unreadEmails = emails.length;
        } catch (emailError) {
          console.error('Error getting unread emails count:', emailError);
          // Fall back to memStorage for now
          const emails = Array.from(storage.getEmails().values())
            .filter(email => email.userId === userId && !email.isRead);
          unreadEmails = emails.length;
        }
      } catch (fallbackError) {
        console.error('Error with fallback email count:', fallbackError);
      }
      
      // Calculate stats
      const pendingTasks = tasks.filter(task => !task.completed).length;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Count today's events
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      }).length;
      
      // Count upcoming events within next 7 days
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.getTime() > Date.now() && eventDate.getTime() < nextWeek.getTime();
      }).length;
      
      // Calculate unpaid invoices total
      const unpaidInvoices = invoices
        .filter(invoice => invoice.status === "pending")
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      
      res.json({
        unreadEmails,
        todayMeetings: todayEvents,
        upcomingMeetings: upcomingEvents,
        pendingTasks,
        unpaidInvoices
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Set up automated scheduling for invoices, leads and emails
  const setupScheduledTasks = () => {
    // Clear any existing scheduled tasks
    Object.values(scheduledTasks).forEach(timeout => clearTimeout(timeout));
    
    // Schedule regular email checking and processing (every 15 minutes)
    const runAutoEmailProcessing = async () => {
      try {
        console.log('Running automated email processing...');
        
        // Get all users
        const users = await storage.getAllUsers();
        let emailsProcessed = 0;
        let leadsDetected = 0;
        let invoicesCreated = 0;
        
        // For each user, process their emails
        for (const user of users) {
          try {
            // Skip users without connected Google service
            const googleService = await storage.getConnectedService(user.id, 'google');
            if (!googleService || !googleService.connected) {
              continue;
            }
            
            console.log(`Processing emails for user ${user.id}`);
            
            // COMPLETELY DISABLED: Stop ALL AI processing until charges are under control
            console.log(`Email processing COMPLETELY DISABLED for user ${user.id} - preventing further API charges`);
            const result = { processed: 0, leadsDetected: 0, invoicesCreated: 0 };
            // const result = await autoProcessEmails(user.id, { selectiveMode: true, limitToEssentials: true });
            
            emailsProcessed += result.processed;
            leadsDetected += result.leadsDetected;
            invoicesCreated += result.invoicesCreated;
          } catch (userError) {
            console.error(`Error processing emails for user ${user.id}:`, userError);
          }
        }
        
        console.log(`Automated email processing completed:
        - Emails processed: ${emailsProcessed}
        - Leads detected: ${leadsDetected}
        - Invoices created: ${invoicesCreated}`);
      } catch (error) {
        console.error('Error in automated email processing:', error);
      }
      
      // Schedule the next run in 15 minutes
      scheduledTasks.emailProcessing = setTimeout(runAutoEmailProcessing, 15 * 60 * 1000);
    };
    
    // Schedule invoice follow-ups for all users
    // This will run every 24 hours
    const runAutoInvoiceFollowups = async () => {
      try {
        console.log('Running automated invoice follow-ups...');
        
        // Import needed functions
        const { checkOverdueInvoices } = await import('./services/invoice-management');
        
        // Get all users
        const users = await storage.getAllUsers();
        let totalProcessed = 0;
        let emailNotificationsPending = 0; // Changed from Slack to email notifications
        
        // For each user, process their overdue invoices
        for (const user of users) {
          try {
            // Use email notifications only (disabled Slack)
            const overdueInvoices = await checkOverdueInvoices(user.id, false);
            
            // Count potential email notifications
            if (overdueInvoices.length > 0) {
              emailNotificationsPending += overdueInvoices.length;
            }
            
            // Skip if no overdue invoices
            if (overdueInvoices.length === 0) continue;
            
            console.log(`Processing ${overdueInvoices.length} overdue invoices for user ${user.id}`);
            
            // Process each overdue invoice for email reminders
            for (const invoice of overdueInvoices) {
              // Skip if a follow-up was sent recently (within the last 3 days)
              if (invoice.lastEmailDate && 
                  (new Date().getTime() - new Date(invoice.lastEmailDate).getTime() < 3 * 24 * 60 * 60 * 1000)) {
                continue;
              }
              
              // Calculate days past due
              const daysPast = invoice.dueDate 
                ? Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (24 * 60 * 60 * 1000)) 
                : 0;
              
              // Only follow up if at least 7 days past due
              if (daysPast < 7) continue;
              
              try {
                // Import needed AI service
                const { generateInvoiceFollowUpEmail } = await import('./ai-service');
                
                // Generate follow-up email
                const invoiceData = {
                  clientName: invoice.client,
                  totalAmount: invoice.amount,
                  currency: 'USD', // Default to USD for now
                  dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : ''
                };
                
                const followUpEmail = await generateInvoiceFollowUpEmail(
                  invoiceData,
                  invoice.number,
                  daysPast,
                  {
                    fullName: user.fullName,
                    email: user.email,
                    preferences: user.preferences
                  }
                );
                
                // Check if user has Gmail connected
                const googleService = await storage.getConnectedService(user.id, 'google');
                
                if (!googleService || !googleService.connected) {
                  continue;
                }
                
                // Import the email sender service
                const { sendPaymentReminder } = await import('./services/email-sender');
                
                // Find recipient email (should be from the lead if available)
                let recipientEmail = '';
                if (invoice.leadId) {
                  const lead = await storage.getLead(invoice.leadId);
                  if (lead && lead.email) {
                    recipientEmail = lead.email;
                  }
                }
                
                // If no lead or lead has no email, use the client name as fallback
                // This is a simplification - in a real system we'd have a better way to get client email
                if (!recipientEmail) {
                  // Try to extract email from client name if it's in format "Client Name <email@example.com>"
                  const emailMatch = invoice.client.match(/<([^>]+)>/);
                  recipientEmail = emailMatch ? emailMatch[1] : `${invoice.client.replace(/\s+/g, '.').toLowerCase()}@example.com`;
                }
                
                // DISABLED: Do not send email payment reminders
                // const sentEmail = await sendPaymentReminder(user, invoice, recipientEmail);
                console.log(`PAYMENT EMAIL REMINDERS DISABLED - Not sending to ${recipientEmail}`);
                
                // Just update the database record without sending emails
                await storage.updateInvoice(invoice.id, {
                  ...invoice,
                  status: 'overdue',
                  lastEmailDate: new Date(),
                  remindersSent: (invoice.remindersSent || 0) + 1,
                  reminderDates: [...(invoice.reminderDates || []), new Date()]
                });
                  
                console.log(`Updated invoice ${invoice.number} status (NO EMAIL SENT)`);
                // Still count for reporting
                totalProcessed++;
              } catch (error) {
                console.error(`Error processing invoice ${invoice.id}:`, error);
              }
            }
          } catch (userError) {
            console.error(`Error processing invoices for user ${user.id}:`, userError);
          }
        }
        
        console.log(`Automated invoice follow-ups completed:
        - Email reminders processed: ${totalProcessed} invoices
        - Email notifications prepared: ${emailNotificationsPending} invoices`);
      } catch (error) {
        console.error('Error in automated invoice follow-ups:', error);
      }
      
      // Schedule the next run in 24 hours
      scheduledTasks.invoiceFollowUps = setTimeout(runAutoInvoiceFollowups, 24 * 60 * 60 * 1000);
    };
    
    // Schedule daily lead processing for all users
    // This will run every 24 hours
    const runAutoLeadManagement = async () => {
      try {
        console.log('Running automated lead processing...');
        
        const result = await processLeadsForAllUsers();
        
        console.log(`Automated lead processing completed:
        - Users processed: ${result.usersProcessed}
        - Leads processed: ${result.leadsProcessed}
        - Priority updates: ${result.priorityUpdates}
        - Follow-ups sent: ${result.followUpsSent}
        - Errors: ${result.errors}`);
      } catch (error) {
        console.error('Error in automated lead processing:', error);
      }
      
      // Schedule the next run in 24 hours
      scheduledTasks.leadManagement = setTimeout(runAutoLeadManagement, 24 * 60 * 60 * 1000);
    };
    
    // Schedule auto calendar management (runs every 1 hour)
    const runAutoCalendarService = async () => {
      try {
        console.log('Running automated calendar management...');
        
        await runAutoCalendarManagement();
        
        console.log('Automated calendar management completed.');
      } catch (error) {
        console.error('Error in automated calendar management:', error);
      }
      
      // Schedule the next run in 1 hour
      scheduledTasks.calendarManagement = setTimeout(runAutoCalendarService, 60 * 60 * 1000);
    };
    
    // Start the automated tasks with a slight delay to ensure everything is initialized
    setTimeout(() => {
      // Start with email processing - the most critical part of automation
      runAutoEmailProcessing();
      
      // Run invoice follow-ups
      runAutoInvoiceFollowups();
      
      // Run calendar management
      runAutoCalendarService();
      
      // Run lead management with delay to avoid resource conflicts
      setTimeout(runAutoLeadManagement, 120000);
    }, 60000); // Wait 1 minute after server start
  };
  
  // Call the setup function on server start
  setupScheduledTasks();

  // Autonomous Engine API endpoints
  const {
    initAutonomousEngine,
    stopAutonomousEngine,
    runAllProcessesNow,
    getEngineStatus,
    setEngineInterval
  } = await import('./services/autonomous-engine');
  
  // Engine management endpoints
  app.get("/api/autonomous-engine/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.id !== 1) {
      return res.status(403).json({ error: "Only admin can access engine status" });
    }
    
    try {
      const status = getEngineStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/autonomous-engine/start", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.id !== 1) {
      return res.status(403).json({ error: "Only admin can start the engine" });
    }
    
    try {
      initAutonomousEngine();
      const status = getEngineStatus();
      res.json({ 
        message: "Autonomous engine started successfully", 
        status 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/autonomous-engine/stop", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.id !== 1) {
      return res.status(403).json({ error: "Only admin can stop the engine" });
    }
    
    try {
      stopAutonomousEngine();
      const status = getEngineStatus();
      res.json({ 
        message: "Autonomous engine stopped successfully", 
        status 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/autonomous-engine/run-now", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.id !== 1) {
      return res.status(403).json({ error: "Only admin can trigger the engine manually" });
    }
    
    try {
      const result = await runAllProcessesNow();
      res.json({ 
        message: "Autonomous engine processes triggered successfully", 
        result 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.post("/api/autonomous-engine/interval", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.id !== 1) {
      return res.status(403).json({ error: "Only admin can change engine interval" });
    }
    
    try {
      const { minutes } = req.body;
      
      if (!minutes || typeof minutes !== 'number' || minutes < 1) {
        return res.status(400).json({ error: "Valid minutes parameter is required" });
      }
      
      const status = setEngineInterval(minutes);
      res.json({ 
        message: `Autonomous engine interval set to ${minutes} minutes`, 
        status 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // User preferences for autonomous features
  app.post("/api/user/autonomous-settings", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const userId = req.user!.id;
      const { settings } = req.body;
      
      // Get current user preferences
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Parse existing preferences or create new object
      const currentPreferences = user.preferences ? 
        (typeof user.preferences === 'string' ? 
          JSON.parse(user.preferences) : user.preferences) 
        : {};
      
      // Update preferences with new autonomous settings
      const updatedPreferences = {
        ...currentPreferences,
        ...settings
      };
      
      // Save updated preferences
      await storage.updateUserPreferences(userId, updatedPreferences);
      
      res.json({
        message: "Autonomous settings updated successfully",
        preferences: updatedPreferences
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Beta Signup endpoint - no authentication required
  app.post("/api/beta-signup", async (req, res) => {
    try {
      console.log("=== BETA SIGNUP REQUEST DEBUG ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Request headers:", req.headers);
      console.log("Request IP:", req.ip);
      console.log("================================");
      
      // Validate the request body using the schema
      const signupData = insertBetaSignupSchema.parse(req.body);
      
      console.log("Parsed signup data:", signupData);
      
      // Check if email already exists
      console.log("Checking for existing signup with email:", signupData.email);
      const existingSignup = await storage.getBetaSignupByEmail(signupData.email);
      console.log("Existing signup found:", existingSignup);
      
      if (existingSignup) {
        console.log("Duplicate email detected, returning 409");
        return res.status(409).json({ 
          message: "You're already on our waitlist! We'll be in touch soon.", 
          duplicate: true 
        });
      }
      
      // Add IP address if not provided
      if (!signupData.ipAddress) {
        signupData.ipAddress = req.ip;
      }
      
      // Add referrer if not provided
      if (!signupData.referrer && req.headers.referer) {
        signupData.referrer = req.headers.referer;
      }
      
      console.log("Final signup data to insert:", signupData);
      
      // Create the beta signup
      console.log("Attempting to create beta signup in database...");
      const betaSignup = await storage.createBetaSignup(signupData);
      console.log("Beta signup created successfully:", betaSignup);
      
      res.status(201).json({
        message: "Thanks for signing up! We'll be in touch soon.",
        success: true
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid signup data", 
          details: error.errors 
        });
      }
      console.error("Beta signup error:", error);
      res.status(500).json({ error: "Failed to process signup" });
    }
  });
  
  // Get all beta signups (admin only)
  app.get("/api/beta-signups", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Check if user is admin (id = 1)
    if (req.user!.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const signups = await storage.getBetaSignups();
      res.json(signups);
    } catch (error: any) {
      console.error("Error fetching beta signups:", error);
      res.status(500).json({ error: "Failed to fetch beta signups" });
    }
  });
  
  // Autonomous engine status and control endpoints
  app.get('/api/autonomous/status', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Check if user is admin (id = 1)
    if (req.user!.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const status = getEngineStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching autonomous engine status:', error);
      res.status(500).json({ error: "Failed to fetch engine status" });
    }
  });
  
  app.post('/api/autonomous/run-now', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Check if user is admin (id = 1)
    if (req.user!.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const result = await runAllProcessesNow();
      res.json(result);
    } catch (error) {
      console.error('Error running autonomous processes:', error);
      res.status(500).json({ error: "Failed to run autonomous processes" });
    }
  });
  
  app.post('/api/autonomous/set-interval', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Check if user is admin (id = 1)
    if (req.user!.id !== 1) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    try {
      const { minutes } = req.body;
      if (!minutes || typeof minutes !== 'number' || minutes < 5 || minutes > 120) {
        return res.status(400).json({ error: "Interval must be between 5 and 120 minutes" });
      }
      
      const status = setEngineInterval(minutes);
      res.json(status);
    } catch (error) {
      console.error('Error setting autonomous engine interval:', error);
      res.status(500).json({ error: "Failed to set engine interval" });
    }
  });
  
  // Initialize autonomous engine on server start - TEMPORARILY DISABLED
  // Allow initialization in development mode as well for testing
  console.log(`NOTIFICATION SYSTEM DISABLED: Autonomous engine will not be initialized to prevent excessive notifications`);
  // setTimeout(() => {
  //   initAutonomousEngine();
  // }, 5000); // Delay to ensure server is fully started

  // Slack Integration Routes
  app.use("/api/integrations/slack", slackRoutes);
  
  // Register Slack test routes for multi-tenant testing
  app.use("/api/slack-test", slackTestRoutes);
  
  // Register client routes
  app.use("/api/clients", clientRoutes);
  
  // Microsoft OAuth and Outlook Integration Routes
  // Add a new direct-auth route to help with Microsoft authentication
  app.get("/api/auth/microsoft/direct-auth", (req, res) => {
    console.log("Microsoft direct-auth route accessed");
    // User must be authenticated to use this route
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const userId = req.user?.id;
    console.log(`User ${userId} accessing Microsoft direct-auth route`);
    
    // Generate the redirect URI based on the current environment
    const redirectUri = `${config.baseUrl}/api/auth/microsoft/callback`;
    console.log(`Using redirect URI: ${redirectUri}`);
    
    // Generate a simple Microsoft auth URL
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=3e9d9152-c120-4a5c-9bc4-8c6aaca4a3e9&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=offline_access%20User.Read%20Mail.Read%20Mail.ReadWrite%20Mail.Send%20Calendars.Read%20Calendars.ReadWrite&state=${userId}`;
    
    // Redirect the user to the Microsoft auth URL
    res.redirect(authUrl);
  });
  
  // Mount the Microsoft routes module
  app.use("/api/auth/microsoft", microsoftRoutes);
  
  // Add environment variables to config for Slack
  if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET && process.env.SLACK_SIGNING_SECRET) {
    console.log('Slack integration is enabled');
  } else {
    console.warn('Slack integration is disabled due to missing environment variables');
  }
  
  // Notification control routes
  app.use("/api/notifications", notificationRoutes);
  
  // Auto-start the email-based notification system
  setTimeout(() => {
    console.log('Starting scheduled notification system with daily digests at 7am, 12pm, and 5pm');
    try {
      // Start the notification system using the notification-scheduler's function
      import('./services/notification-scheduler').then(scheduler => {
        scheduler.startNotificationScheduler();
      });
      console.log('Notification system started successfully');
    } catch (error) {
      console.error('Error starting notification system:', error);
    }
  }, 10000); // Wait 10 seconds after server starts to begin notification system
  
  // Note: Slack notifications temporarily disabled, using email notifications instead
  if (process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID) {
    console.log('Slack credentials available but Slack integration temporarily disabled');
  }

  const httpServer = createServer(app);
  return httpServer;
}
