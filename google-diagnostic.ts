import express from 'express';
import { config } from '../config';

const router = express.Router();

// Google OAuth Configuration Diagnostic - This endpoint doesn't require authentication
router.get('/diagnostic', (req, res) => {
  try {
    // Get basic OAuth configuration for diagnostics
    const authConfig = {
      baseUrl: config.baseUrl,
      callbackUrl: `${config.baseUrl}/api/auth/google/callback`,
      clientId: process.env.GOOGLE_CLIENT_ID ? 
        process.env.GOOGLE_CLIENT_ID : 
        'Not configured'
    };
    
    console.log('Returning OAuth diagnostic information:', {
      baseUrl: authConfig.baseUrl,
      callbackUrl: authConfig.callbackUrl,
      clientId: authConfig.clientId.substring(0, 10) + '...' + 
                authConfig.clientId.substring(authConfig.clientId.length - 10)
    });
    
    res.json(authConfig);
  } catch (error) {
    console.error('Error in Google OAuth diagnostic endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve OAuth configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;