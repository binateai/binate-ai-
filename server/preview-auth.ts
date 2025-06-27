/**
 * Preview Authentication Bypass
 * This file provides special authentication handling for the Replit preview environment
 */

import { Request, Response, NextFunction } from 'express';

// Basic demo user for preview testing
const DEMO_USER = {
  id: 999,
  email: 'demo@preview.test',
  fullName: 'Preview Test User',
  avatar: '',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    theme: 'light',
    emailNotifications: true,
    aiResponseStyle: 'friendly',
  },
  google: {
    connected: true,
    username: 'demo@gmail.com',
    displayName: 'Demo Google User'
  },
  stripe: {
    connected: false
  },
  slack: {
    connected: true,
    username: 'demo-slack-workspace',
    displayName: 'Demo Slack',
    channel: 'general'
  }
};

/**
 * Determines if the current request is coming from a Replit preview environment
 */
export function isReplitPreview(req: Request): boolean {
  const host = req.headers.host || '';
  return host.includes('.replit.dev') || host.includes('.repl.co');
}

/**
 * Middleware to bypass authentication in preview environments
 */
export function previewAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply in preview environments
  if (!isReplitPreview(req)) {
    return next();
  }

  // For API routes that expect an authenticated user
  if (req.path.startsWith('/api/')) {
    // Skip auth check for public endpoints
    if (
      req.path === '/api/auth/login' || 
      req.path === '/api/auth/register' ||
      req.path.startsWith('/api/auth/google')
    ) {
      return next();
    }
    
    // Add the demo user to the request
    (req as any).user = DEMO_USER;
    
    // Set session user ID for routes that check req.session.userId
    if (req.session) {
      (req.session as any).userId = DEMO_USER.id;
    }
    
    // Special handling for Slack testing routes
    if (req.path.startsWith('/api/slack-test/')) {
      console.log('Preview environment: Using mock data for Slack test route:', req.path);
    }
  }
  
  next();
}

/**
 * Special handler for preview login
 */
export function handlePreviewLogin(req: Request, res: Response) {
  if (!isReplitPreview(req)) {
    return res.status(404).json({ error: 'Not available in production' });
  }
  
  // Set a dummy session cookie
  (req.session as any).userId = DEMO_USER.id;
  
  return res.json({
    success: true,
    user: DEMO_USER
  });
}