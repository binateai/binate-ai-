import * as path from 'path';
import { Router } from 'express';
import fs from 'fs';

const router = Router();

// This is a special router for production deployment to ensure proper SPA routing
// It will catch all routes and serve the index.html file for client-side routing

// These routes should be handled by the API
const API_ROUTES = ['/api', '/auth'];

router.get('*', (req, res, next) => {
  // Skip API routes
  if (API_ROUTES.some(route => req.path.startsWith(route))) {
    return next();
  }

  // For /app routes, redirect to root (SPA will handle it)
  if (req.path.startsWith('/app/')) {
    return res.redirect('/');
  }

  // For authentication pages, redirect to root
  if (req.path === '/auth') {
    return res.redirect('/');
  }

  // For all other routes, serve the index.html
  const indexPath = path.join(process.cwd(), 'dist', 'client', 'index.html');
  
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else {
    // Fallback to public folder (for development)
    const publicIndexPath = path.join(process.cwd(), 'client', 'public', 'index.html');
    if (fs.existsSync(publicIndexPath)) {
      return res.sendFile(publicIndexPath);
    } else {
      return next();
    }
  }
});

export default router;