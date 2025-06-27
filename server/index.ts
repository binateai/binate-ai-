import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import { startNotificationScheduler } from "./services/notification-scheduler";
import productionRoutes from "./production-routes";

// Load environment variables from .env file BEFORE any other imports
// This ensures all environment variables are available throughout the application
dotenv.config({ override: true });

// Log loaded environment variables
console.log("\n===== DOTENV LOADED VARIABLES =====");
console.log("FORCE_PRODUCTION_DOMAIN:", process.env.FORCE_PRODUCTION_DOMAIN);
console.log("DISABLE_DOMAIN_OVERRIDE:", process.env.DISABLE_DOMAIN_OVERRIDE);
console.log("CUSTOM_DOMAIN:", process.env.CUSTOM_DOMAIN); 
console.log("BASE_URL:", process.env.BASE_URL);
console.log("==================================\n");

// Log environment variables for debugging
console.log("\n===== ENVIRONMENT VARIABLES =====");
console.log("FORCE_PRODUCTION_DOMAIN:", process.env.FORCE_PRODUCTION_DOMAIN || "Not set");
console.log("DISABLE_DOMAIN_OVERRIDE:", process.env.DISABLE_DOMAIN_OVERRIDE || "Not set");
console.log("================================\n");

// Verify our custom domain environment variables are loaded
console.log("\n===== CUSTOM DOMAIN CONFIGURATION =====");
console.log("CUSTOM_DOMAIN:", process.env.CUSTOM_DOMAIN || "Not set");
console.log("BASE_URL:", process.env.BASE_URL || "Not set");
console.log("========================================\n");

// Log Replit environment variables to help with debugging
console.log("====== REPLIT ENVIRONMENT DEBUG ======");
console.log("REPL_ID:", process.env.REPL_ID);
console.log("REPL_SLUG:", process.env.REPL_SLUG);
console.log("REPL_OWNER:", process.env.REPL_OWNER);
console.log("HOST:", process.env.HOST);
console.log("====================================");

const app = express();

// Setup CORS for cross-domain operation with dynamic origin handling
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Always allow all Replit domains for development/preview
    if (origin.includes('.replit.dev') || 
        origin.includes('.replit.app') || 
        origin.includes('.repl.co') ||
        origin.includes('kirk.replit.dev')) {
      console.log(`CORS: Allowing Replit domain: ${origin}`);
      return callback(null, true);
    }
    
    // List of allowed origins
    const allowedOrigins = [
      'https://binateai.com',
      'https://www.binateai.com',
      'https://binateai.replit.app',
      'https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev',
      'https://004cd0fb-c62b-41f4-9092-516b03c6788b.id.repl.co',
      'https://004cd0fb-c62b-41f4-9092-516b03c6788b.repl.co',
      'http://localhost:5000',
      'http://localhost:3000'
    ];
    
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log the rejected origin for debugging
    console.log(`CORS blocked request from origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // Cache preflight response for 24 hours
};

// Log CORS configuration for debugging
console.log("\n===== CORS CONFIGURATION =====");
console.log("Allowed Origins: Dynamic CORS with allow list including binateai.com domains and all Replit preview domains");
console.log("Credentials Allowed:", corsOptions.credentials);
console.log("Methods Allowed:", corsOptions.methods);
console.log("Headers Allowed:", corsOptions.allowedHeaders);
console.log("==============================\n");

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up 301 redirect from www.binateai.com to binateai.com (for both http and https)
app.use((req, res, next) => {
  const host = req.header('host');
  if (host && host.startsWith('www.binateai.com')) {
    // Create the redirect URL using the same protocol and path
    const protocol = req.header('x-forwarded-proto') || 'https';
    const redirectUrl = `${protocol}://binateai.com${req.url}`;
    console.log(`Redirecting from ${host} to binateai.com`);
    return res.redirect(301, redirectUrl);
  }
  next();
});

// Serve the production build files FIRST if they exist (for production deployment)
const distPath = path.join(process.cwd(), 'dist/public');
if (fs.existsSync(distPath)) {
  console.log('Production build detected. Serving static files from:', distPath);
  app.use(express.static(distPath));
} else {
  // If no production build exists, serve the development version
  console.log('No production build found. Setting up development Vite middleware.');
  // Serve static files from the client/public directory
  app.use(express.static(path.join(process.cwd(), 'client/public')));
}

// Add middleware to detect and log browser origin
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || 'Unknown';
  const host = req.headers.host || 'Unknown';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  
  if (req.path.includes('/api/auth/google')) {
    console.log(`\nGoogle Auth Request Received:`);
    console.log(`Origin: ${origin}`);
    console.log(`Host: ${host}`);
    console.log(`Protocol: ${protocol}`);
    console.log(`Full URL: ${protocol}://${host}${req.originalUrl}`);
    
    // For Google auth requests, detect the browser's origin to get the real domain
    if (origin) {
      console.log(`Dynamic Google Auth: Detected origin ${origin}`);
      
      // Extract the domain from the origin
      try {
        const originUrl = new URL(origin);
        const browserDomain = originUrl.origin;
        console.log(`Dynamic Google Auth: Using callback URL ${browserDomain}/api/auth/google/callback`);
      } catch (e) {
        console.log(`Dynamic Google Auth: Error parsing origin ${origin}:`, e);
      }
    }
  }
  
  next();
});

// Serve files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Check if this is a sensitive endpoint that should have redacted logs
      const isSensitiveEndpoint = 
        path.includes('/api/user') || 
        path.includes('/api/login') || 
        path.includes('/api/auth/') ||
        path.includes('/api/register');
        
      if (capturedJsonResponse && !isSensitiveEndpoint) {
        // Only include response data for non-sensitive endpoints
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      } else if (isSensitiveEndpoint) {
        // For sensitive endpoints, just indicate data was redacted
        logLine += " :: [Sensitive data redacted]";
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup frontend routes - always use setupVite in the Replit environment
  // to ensure the preview tab works correctly
  const isReplitEnv = process.env.REPL_ID || process.env.REPL_OWNER;
  if (app.get("env") === "development" || isReplitEnv) {
    console.log("Setting up Vite middleware for development/Replit environment");
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving for production environment");
    serveStatic(app);
  }

  // Add SPA fallback route - this is CRITICAL for React Router to work
  // Must be after API routes but before error handlers
  app.get('*', (req: Request, res: Response) => {
    // Don't serve SPA for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // For production, try to serve from dist first
    const distIndexPath = path.join(process.cwd(), 'dist/public/index.html');
    const devIndexPath = path.join(process.cwd(), 'client/index.html');
    
    if (fs.existsSync(distIndexPath)) {
      res.sendFile(distIndexPath);
    } else if (fs.existsSync(devIndexPath)) {
      res.sendFile(devIndexPath);
    } else {
      // Fallback HTML for when no build exists
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Binate AI</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body>
            <div id="root">
              <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                  <h1>Binate AI</h1>
                  <p>Your intelligent executive assistant platform</p>
                  <p style="color: #666;">Loading application...</p>
                </div>
              </div>
            </div>
            <script type="module" src="/client/src/main.tsx"></script>
          </body>
        </html>
      `);
    }
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the notification scheduler after server is up
    try {
      startNotificationScheduler();
      log('Notification scheduler started successfully');
    } catch (error) {
      console.error('Failed to start notification scheduler:', error);
    }
  });
})();
