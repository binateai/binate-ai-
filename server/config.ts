/**
 * Central configuration file for the application
 * Contains environment-specific settings and shared configuration
 */

// Detect environment
const isReplit = !!(process.env.REPLIT_SLUG || process.env.REPL_ID || process.env.REPLIT_OWNER);
const isDevelopment = process.env.NODE_ENV === 'development';

// Standard URI paths
const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback';

// Log environment information for debugging OAuth issues
console.log('====== REPLIT ENVIRONMENT DEBUG ======');
console.log('REPL_ID:', process.env.REPL_ID || 'undefined');
console.log('REPL_SLUG:', process.env.REPL_SLUG || 'undefined');
console.log('REPL_OWNER:', process.env.REPL_OWNER || 'undefined');
console.log('HOST:', process.env.HOST || 'undefined');
console.log('====================================');

// Determine the correct base URL based on environment
function getBaseUrl(): string {
  // CRITICAL FIX:
  // For OAuth to work, we need to use the exact domain that was registered in Google Cloud Console.
  // We register THREE domains in Google Cloud Console:
  // 1. https://binateai.replit.app (production Replit domain)
  // 2. https://binateai.com (custom domain)
  // 3. https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev (development)
  
  console.log("\n[BaseURL] getBaseUrl() function called - determining base URL...");
  
  // CRITICAL FIX:
  // Force using the correct domain for all OAuth operations based on available redirect URIs
  console.log("[BaseURL] Environment variables:");
  console.log(`  FORCE_PRODUCTION_DOMAIN: ${process.env.FORCE_PRODUCTION_DOMAIN}`);
  console.log(`  DISABLE_DOMAIN_OVERRIDE: ${process.env.DISABLE_DOMAIN_OVERRIDE}`);
  console.log(`  CUSTOM_DOMAIN: ${process.env.CUSTOM_DOMAIN}`);
  console.log(`  BASE_URL: ${process.env.BASE_URL}`);
  console.log(`  REPL_ID: ${process.env.REPL_ID}`);
  console.log(`  REPL_SLUG: ${process.env.REPL_SLUG}`);
  
  // IMPORTANT: We need to match one of these authorized redirect URIs in Google Cloud Console
  // These are the exact URIs configured in your Google Cloud Console:
  // 1. https://workspace.binateai25.repl.co/api/auth/google/callback
  // 2. https://binateai.com/api/auth/google/callback
  // 3. https://www.binateai.com/api/auth/google/callback
  // 4. https://binateai.replit.app/api/auth/google/callback
  
  // Check if we're running on binateai.com (primary production domain)
  if (process.env.CUSTOM_DOMAIN === 'binateai.com' || process.env.FORCE_PRODUCTION_DOMAIN === 'true') {
    console.log("[BaseURL] Using production domain: https://binateai.com");
    return 'https://binateai.com';
  }
  
  // Check for Replit app/workspace domains
  if (process.env.REPL_SLUG === 'binateai') {
    console.log("[BaseURL] Using Replit app domain: https://binateai.replit.app");
    return 'https://binateai.replit.app';
  }
  
  // For development workspace fallback - use the actual visible preview domain
  // Try to get the dynamic Replit preview domain for development
  if (process.env.REPL_ID) {
    const replicaId = "00-26x1ysnxshf8q"; // This is the specific replica ID for this environment
    const devURL = `https://${process.env.REPL_ID}-${replicaId}.kirk.replit.dev`;
    console.log(`[BaseURL] Using current Replit preview domain: ${devURL}`);
    return devURL;
  }
  
  // Last fallback
  console.log("[BaseURL] Using development workspace domain: https://workspace.binateai25.repl.co");
  return 'https://workspace.binateai25.repl.co';
  
  // Note: By fixing the possible values to match Google OAuth redirect URIs exactly,
  // we ensure OAuth will work reliably across different environments
  
  // HIGHEST PRIORITY: FORCE_PRODUCTION_DOMAIN flag
  // This overrides all other settings to ensure the binateai.com domain is used
  if (process.env.FORCE_PRODUCTION_DOMAIN === 'true') {
    const productionUrl = 'https://binateai.com';
    console.log("[BaseURL] FORCING production domain for OAuth:", productionUrl);
    return productionUrl;
  }
  
  // HIGH PRIORITY: Custom domain environment variable
  if (process.env.CUSTOM_DOMAIN) {
    const customDomainUrl = `https://${process.env.CUSTOM_DOMAIN}`;
    console.log("[BaseURL] Using custom domain from CUSTOM_DOMAIN:", customDomainUrl);
    return customDomainUrl;
  }
  
  // MEDIUM PRIORITY: Explicit BASE_URL override (useful for testing)
  if (process.env.BASE_URL) {
    const baseUrl = process.env.BASE_URL; // This ensures BASE_URL is not undefined
    console.log("[BaseURL] Using explicit BASE_URL from environment:", baseUrl);
    return baseUrl;
  }
  
  // LOW PRIORITY: Local development environment
  if (!isReplit) {
    console.log("[BaseURL] Using localhost (non-Replit environment)");
    return `http://localhost:${process.env.PORT || 5000}`;
  }
  
  // LOWEST PRIORITY: Replit environments
  // Only use these if no environment variables are set
  console.log("[BaseURL] Falling back to Replit environment detection");
  
  // For development Replit workspace (matches full development domain)
  // ONLY if no environment variables are set
  if (process.env.REPL_ID === "004cd0fb-c62b-41f4-9092-516b03c6788b") {
    const devURL = "https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev";
    console.log(`[BaseURL] Using development fixed URL: ${devURL}`);
    return devURL;
  }
  
  // For production deployment - use custom domain if available
  if (process.env.REPL_SLUG === "binateai") {
    // Prefer custom domain if explicitly set in env vars
    if (process.env.CUSTOM_DOMAIN) {
      const customURL = `https://${process.env.CUSTOM_DOMAIN}`;
      console.log(`[BaseURL] Using custom domain: ${customURL}`);
      return customURL;
    }
    
    // Use the Replit production URL if no custom domain
    const prodURL = "https://binateai.replit.app";
    console.log(`[BaseURL] Using production Replit URL: ${prodURL}`);
    return prodURL;
  }
  
  // Fallback for any other environment - dynamically generated but less reliable for OAuth
  console.log("[BaseURL] WARNING: Using fallback URL generation - OAuth may not work correctly");
  
  // Using the actual Replit domain format visible in the URL bar
  if (process.env.REPL_ID) {
    // Format matches pattern seen in development: 004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev
    const replURL = `https://${process.env.REPL_ID}-00-26x1ysnxshf8q.kirk.replit.dev`;
    console.log(`[BaseURL] Using Replit URL format with REPL_ID: ${replURL}`);
    return replURL;
  }
  
  // Absolute final fallback
  const fallbackURL = `https://workspace.${process.env.REPL_OWNER || 'binateai25'}.repl.co`;
  console.log(`[BaseURL] Using fallback URL format: ${fallbackURL}`);
  return fallbackURL;
}

// Determine the callback URL for OAuth
const BASE_URL = getBaseUrl();
const GOOGLE_CALLBACK_URL = `${BASE_URL}${GOOGLE_CALLBACK_PATH}`;

// Log the configuration for debugging
console.log('-------- Application Configuration --------');
console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}`);
console.log(`Platform: ${isReplit ? 'Replit' : 'Local'}`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`Google OAuth Callback URL: ${GOOGLE_CALLBACK_URL}`);
console.log('------------------------------------------');

// Export the configuration
export const config = {
  isReplit,
  isDevelopment,
  baseUrl: BASE_URL,
  appUrl: BASE_URL, // Adding appUrl property for Slack integration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: GOOGLE_CALLBACK_URL,
    callbackPath: GOOGLE_CALLBACK_PATH
  }
};

export default config;