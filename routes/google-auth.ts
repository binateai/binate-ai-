import { Router } from 'express';
import { getGoogleAuthUrl, getTokensFromCode, getUserInfo } from '../services/google-auth';
import config from '../config';

const router = Router();

/**
 * Get URL for Google OAuth authorization
 * Dynamically detects the callback URL from the request
 */
router.get('/url', (req, res) => {
  try {
    // Get the actual host and protocol from the request
    const actualHost = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const actualOrigin = `${protocol}://${actualHost}`;
    const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
    
    console.log(`Dynamic Google Auth: Detected origin ${actualOrigin}`);
    console.log(`Dynamic Google Auth: Using callback URL ${dynamicCallbackUrl}`);
    
    // Set temporary override for this request only
    process.env.TEMP_CALLBACK_URL = dynamicCallbackUrl;
    
    // Generate auth URL with the dynamic callback
    const authUrl = getGoogleAuthUrl();
    
    // Remove temporary override
    delete process.env.TEMP_CALLBACK_URL;
    
    res.json({ 
      url: authUrl,
      callbackUrl: dynamicCallbackUrl
    });
  } catch (error: any) {
    console.error('Error generating dynamic Google auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authorization URL',
      details: error.message || String(error)
    });
  }
});

/**
 * Get standard URL (from config) for Google OAuth authorization
 */
router.get('/', (req, res) => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.json({ url: authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * Debug endpoint to show all configuration
 */
router.get('/debug', (req, res) => {
  // Get actual request information
  const actualHost = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const actualOrigin = `${protocol}://${actualHost}`;
  const dynamicCallbackUrl = `${actualOrigin}/api/auth/google/callback`;
  
  // Get configured values
  const configuredCallbackUrl = config.google.callbackUrl;
  
  // Return everything for debugging
  res.json({
    request: {
      headers: {
        host: req.headers.host,
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
        origin: req.headers.origin,
        referer: req.headers.referer
      },
      url: req.url,
      originalUrl: req.originalUrl,
      detectedOrigin: actualOrigin,
      dynamicCallbackUrl
    },
    config: {
      baseUrl: config.baseUrl,
      googleCallbackUrl: configuredCallbackUrl,
      googleCallbackPath: config.google.callbackPath,
      environment: process.env.NODE_ENV,
      isReplit: config.isReplit,
      customDomain: process.env.CUSTOM_DOMAIN || null,
      usingCustomDomain: !!process.env.CUSTOM_DOMAIN
    },
    env: {
      REPL_ID: process.env.REPL_ID,
      REPL_SLUG: process.env.REPL_SLUG,
      REPL_OWNER: process.env.REPL_OWNER
    }
  });
});

export default router;