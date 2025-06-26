import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored || !stored.includes('.')) {
      console.error("Password comparison error: Invalid stored password format");
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    
    if (!hashed || !salt) {
      console.error("Password comparison error: Missing hash or salt");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log(`Password comparison result: ${result ? 'matched' : 'no match'} for supplied length: ${supplied.length}`);
    
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Handle environment variables with safer checks (case-insensitive)
  const isDev = process.env.NODE_ENV === 'development' || (process.env.DISABLE_DOMAIN_OVERRIDE || '').toLowerCase() === 'true';
  const isForceProduction = (process.env.FORCE_PRODUCTION_DOMAIN || '').toLowerCase() === 'true' && 
                           (process.env.DISABLE_DOMAIN_OVERRIDE || '').toLowerCase() !== 'true';
  
  // Determine if we're using a custom domain or force production
  const useCustomDomain = 
    (process.env.CUSTOM_DOMAIN && process.env.CUSTOM_DOMAIN.length > 0) || 
    isForceProduction;
  
  // Log session information 
  console.log("\n===== SESSION CONFIGURATION =====");
  console.log("Environment Mode:", isDev ? "Development" : "Production");
  console.log("Force Production Domain:", isForceProduction ? "Yes" : "No");
  console.log("Custom Domain:", process.env.CUSTOM_DOMAIN || "Not set");
  console.log("Using Cross-Domain Settings:", useCustomDomain ? "Yes" : "No");
  console.log("================================\n");

  // Configure session settings based on environment
  let cookieSettings: session.CookieOptions = {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
  };
  
  // If we're using a custom domain or forced production, enable cross-domain cookies
  if (useCustomDomain) {
    console.log("\n===== CROSS-DOMAIN AUTHENTICATION MODE =====");
    console.log("Using cross-domain authentication configuration");
    console.log("Cookie sameSite policy: None (allows cross-domain)");
    console.log("Using secure cookies: Yes");
    console.log("============================================\n");
    
    // Cross-domain configuration requires 'none' and secure flags
    cookieSettings = {
      ...cookieSettings,
      sameSite: 'none',
      secure: true
    };
    
    // IMPORTANT: We're completely disabling domain-specific cookies for now
    // to make development and testing easier. For production, this will be re-enabled.
    const isProduction = false; // Temporarily force development mode
                         
    if (isProduction && process.env.CUSTOM_DOMAIN && !process.env.DISABLE_DOMAIN_COOKIE) {
      cookieSettings.domain = `.${process.env.CUSTOM_DOMAIN}`;
      console.log("Production mode: Cookie domain set to:", cookieSettings.domain);
    } else {
      // Don't set a domain at all - this will make the cookie work on any domain
      console.log("Development/Preview mode: Cookie domain not set (using origin-matching cookies)");
    }
  } else {
    console.log("\n===== STANDARD AUTHENTICATION MODE =====");
    console.log("Using standard authentication configuration");
    console.log("Cookie sameSite policy: Lax (default)");
    console.log("Using secure cookies:", isDev ? "No" : "Yes");
    console.log("========================================\n");
    
    // Standard configuration
    cookieSettings = {
      ...cookieSettings,
      sameSite: 'lax',
      secure: !isDev
    };
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "binate-ai-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: cookieSettings
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log("Trying to authenticate user:", username);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log("Authentication failed: User not found");
          return done(null, false);
        }
        
        console.log("User found, checking password. Hash starts with:", user.password.substring(0, 20));
        
        const passwordMatch = await comparePasswords(password, user.password);
        
        if (!passwordMatch) {
          console.log("Authentication failed: Password does not match");
          return done(null, false);
        } else {
          console.log("Password matched successfully");
          return done(null, user);
        }
      } catch (err) {
        console.error("Authentication error:", err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Add additional logging for debug purposes
    console.log("Login attempt for username:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("Login authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed - user not found or password incorrect");
        return res.status(401).json({ 
          message: "Authentication failed. Username or password is incorrect." 
        });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return next(err);
        }
        
        console.log("Login successful for user:", user.username);
        console.log("Session established with ID:", req.sessionID);
        
        // Log session configuration for debugging
        if (req.session) {
          console.log("Session cookie settings:", {
            path: req.session.cookie.path,
            httpOnly: req.session.cookie.httpOnly,
            secure: req.session.cookie.secure,
            sameSite: req.session.cookie.sameSite,
            domain: req.session.cookie.domain
          });
        }
        
        // Return a simplified user object (don't include password)
        return res.status(200).json({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          preferences: user.preferences
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Return a sanitized user object (don't include password)
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      preferences: user.preferences,
      // Add any other non-sensitive fields
    });
  });

  // Authentication diagnostic endpoint for debug purposes
  app.get("/api/auth/status", (req, res) => {
    console.log("Auth status check - isAuthenticated:", req.isAuthenticated());
    console.log("Auth status check - sessionID:", req.sessionID);
    console.log("Auth status check - session:", req.session ? "exists" : "null");
    
    if (req.user) {
      console.log("Auth status check - user:", req.user.username);
    } else {
      console.log("Auth status check - user: not logged in");
    }
    
    const sessionInfo = req.session ? {
      id: req.session.id,
      cookie: {
        originalMaxAge: req.session.cookie?.originalMaxAge,
        maxAge: req.session.cookie?.maxAge,
        secure: req.session.cookie?.secure,
        httpOnly: req.session.cookie?.httpOnly,
        domain: req.session.cookie?.domain,
        path: req.session.cookie?.path,
        sameSite: req.session.cookie?.sameSite,
      }
    } : null;

    // Log received cookies for debugging
    console.log("Auth status - Received cookies:", req.headers.cookie);

    res.json({
      authenticated: req.isAuthenticated(),
      session: sessionInfo,
      user: req.user ? { 
        id: req.user.id,
        username: req.user.username,
        // Don't include sensitive info like password hash
      } : null,
      headers: {
        host: req.headers.host,
        origin: req.headers.origin,
        referer: req.headers.referer,
        userAgent: req.headers['user-agent'],
        cookie: req.headers.cookie,
        requestTime: new Date().toISOString()
      }
    });
  });
  
  // Special endpoint for login testing (useful for cross-domain testing)
  app.post("/api/auth/test-login", (req, res, next) => {
    console.log("TEST LOGIN attempt for username:", req.body.username);
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error("TEST LOGIN authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("TEST LOGIN failed - user not found or password incorrect");
        return res.status(401).json({ 
          message: "Authentication failed. Username or password is incorrect." 
        });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error("TEST LOGIN session login error:", err);
          return next(err);
        }
        
        console.log("TEST LOGIN successful for user:", user.username);
        
        // We won't set cookies manually as this can interfere with the 
        // session middleware - instead we'll let Passport handle it
        console.log("TEST LOGIN - session established with ID:", req.sessionID);
        
        // Verify session data
        if (req.session) {
          console.log("TEST LOGIN - session cookie settings:", {
            path: req.session.cookie.path,
            httpOnly: req.session.cookie.httpOnly,
            secure: req.session.cookie.secure,
            sameSite: req.session.cookie.sameSite,
            domain: req.session.cookie.domain
          });
        }
        
        return res.status(200).json({
          user: {
            id: user.id,
            username: user.username 
          },
          sessionId: req.sessionID,
          message: "Test login successful"
        });
      });
    })(req, res, next);
  });

  // Update user preferences
  app.post("/api/user/preferences", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = req.user!.id;
      const preferences = req.body;
      
      const updatedUser = await storage.updateUserPreferences(userId, preferences);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  });
}
