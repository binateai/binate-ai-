import { google } from "googleapis";
import { storage } from "../storage";

// Import centralized configuration
import config from '../config';

// Constants for logging
const LOG_PREFIX = '[OAUTH]';

// Define types for token response
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}

// Print environment information for debugging
console.log(`Google OAuth is using redirect URI: ${config.google.callbackUrl}`);

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  console.error('CRITICAL ERROR: GOOGLE_CLIENT_ID is not set in environment');
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error('CRITICAL ERROR: GOOGLE_CLIENT_SECRET is not set in environment');
}

// Create OAuth2 client using centralized config
const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.callbackUrl
);

// Print client ID (partially masked) for debugging
if (process.env.GOOGLE_CLIENT_ID) {
  const visiblePart = process.env.GOOGLE_CLIENT_ID.substring(0, 8);
  const maskedPart = '...' + process.env.GOOGLE_CLIENT_ID.substring(process.env.GOOGLE_CLIENT_ID.length - 4);
  console.log(`Using Google Client ID: ${visiblePart}${maskedPart}`);
}

// Scopes that we'll request from Google
const SCOPES = [
  // Gmail API scopes
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  
  // Calendar API scopes
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  
  // User profile scope - needed for basic profile information
  "profile",
  "email",
  
  // Add openid for standard authentication
  "openid"
];

/**
 * Generate the authorization URL for Google OAuth
 */
export function getGoogleAuthUrl(): string {
  // HYBRID APPROACH: Use dynamic callback URL from environment variable if available,
  // otherwise fall back to the fixed URL from config
  
  // Check if we have a temporary callback URL set (used for dynamic URL generation)
  const dynamicCallbackUrl = process.env.TEMP_CALLBACK_URL;
  let callbackUrl;
  
  if (dynamicCallbackUrl) {
    // Use the dynamic callback URL from the environment variable
    callbackUrl = dynamicCallbackUrl;
    console.log(`[OAuth Debug] Using DYNAMIC callback URL from environment: ${callbackUrl}`);
  } else {
    // Fall back to the fixed URL from config
    callbackUrl = config.google.callbackUrl;
    console.log(`[OAuth Debug] Using FIXED callback URL from config: ${callbackUrl}`);
  }
  
  // Make sure we're using the correct client ID by getting it directly from env
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  
  if (!clientId || !clientSecret) {
    console.error('CRITICAL: Missing Google OAuth credentials');
    console.error('GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);
    console.error('GOOGLE_CLIENT_SECRET present:', !!process.env.GOOGLE_CLIENT_SECRET);
    throw new Error('Google OAuth credentials not configured');
  }
  
  console.log(`[OAuth Debug] getGoogleAuthUrl using callback URL: ${callbackUrl}`);
  console.log(`[OAuth Debug] Using client ID (starts with): ${clientId.substring(0, 6)}...`);
  
  // Create a new OAuth client with the right callback
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    callbackUrl
  );
  
  // Generate the auth URL
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force showing the consent screen to get refresh token every time
    include_granted_scopes: true
  });
  
  console.log('[OAuth Debug] Generated auth URL (partial):', url.substring(0, 100) + '...');
  
  // Perform verification and extract client ID from URL for debugging
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  const urlRedirectUri = params.get('redirect_uri');
  const urlClientId = params.get('client_id');
  
  console.log('[OAuth Debug] URL contains client_id:', urlClientId?.substring(0, 6) + '...');
  console.log('[OAuth Debug] Expected client_id:', clientId.substring(0, 6) + '...');
  
  // Log validation but don't throw to ensure more robust behavior
  if (urlClientId !== clientId) {
    console.warn('WARNING: Client ID mismatch in auth URL');
    console.warn(`Expected: ${clientId.substring(0, 10)}...`);
    console.warn(`Got: ${urlClientId?.substring(0, 10)}...`);
  }
  
  if (urlRedirectUri !== callbackUrl) {
    console.warn('WARNING: Redirect URI mismatch in auth URL');
    console.warn(`Expected: ${callbackUrl}`);
    console.warn(`Got: ${urlRedirectUri}`);
  } else {
    console.log('[OAuth Debug] Redirect URI verification passed');
  }
  
  return url;
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}> {
  try {
    console.log(`${LOG_PREFIX} Attempting to exchange auth code for tokens. Code length: ${code.length}`);
    console.log(`${LOG_PREFIX} Code starts with: ${code.substring(0, 5)}...`);
    
    // FIXED APPROACH: Always use exact redirect URI from config
    // This ensures we match what's registered in Google Cloud Console
    const callbackUrl = config.google.callbackUrl;
    
    // Get credentials directly from environment
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    
    if (!clientId || !clientSecret) {
      console.error(`${LOG_PREFIX} CRITICAL: Missing Google OAuth credentials`);
      console.error(`${LOG_PREFIX} GOOGLE_CLIENT_ID present:`, !!process.env.GOOGLE_CLIENT_ID);
      console.error(`${LOG_PREFIX} GOOGLE_CLIENT_SECRET present:`, !!process.env.GOOGLE_CLIENT_SECRET);
      throw new Error('Google OAuth credentials not configured');
    }
    
    console.log(`${LOG_PREFIX} Token exchange using callback URL: ${callbackUrl}`);
    console.log(`${LOG_PREFIX} Using client ID (starts with): ${clientId.substring(0, 6)}...`);
    
    // Create a fresh OAuth client specifically for this token exchange
    const tokenExchangeClient = new google.auth.OAuth2(
      clientId,
      clientSecret,
      callbackUrl // Use the fixed callback URL
    );
    
    // Log detailed information about the token exchange
    console.log(`${LOG_PREFIX} Token exchange parameters:`, {
      code_length: code.length,
      code_prefix: code.substring(0, 5) + '...',
      redirect_uri: callbackUrl,
      client_id_prefix: clientId.substring(0, 6) + '...',
    });
    
    // Track tokens outside inner try/catch for access in outer scope
    let exchangedTokens;
    
    try {
      // Exchange code for tokens with explicit redirect_uri
      console.log(`${LOG_PREFIX} Calling getToken with redirect_uri: ${callbackUrl}`);
      
      const { tokens } = await tokenExchangeClient.getToken({
        code: code,
        redirect_uri: callbackUrl // Critical: Must match what was used to get the auth code
      });
      
      // Store tokens in our outer variable
      exchangedTokens = tokens;
      
      console.log(`${LOG_PREFIX} Token exchange SUCCESS:`, {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        has_expiry: !!tokens.expiry_date,
        token_type: tokens.token_type || 'none',
      });

      if (!tokens.access_token) {
        throw new Error("No access token returned from Google");
      }
      
      // Log a successfully exchanged token (masked for security)
      if (tokens.access_token) {
        const accessTokenStart = tokens.access_token.substring(0, 5);
        const accessTokenEnd = tokens.access_token.substring(tokens.access_token.length - 3);
        console.log(`${LOG_PREFIX} Access token received: ${accessTokenStart}...${accessTokenEnd}`);
      }
      
      if (tokens.refresh_token) {
        console.log(`${LOG_PREFIX} Refresh token received successfully`);
      } else {
        console.log(`${LOG_PREFIX} WARNING: No refresh token received. The user may have previously authorized this app.`);
      }
    } catch (tokenError) {
      console.error(`${LOG_PREFIX} Token exchange error:`, tokenError);
      
      // Handle common error types with clearer messages
      if (tokenError.message?.includes('invalid_grant')) {
        console.error(`${LOG_PREFIX} Invalid grant error - code may be expired or used`);
        throw new Error(`Invalid authorization code. The code may have expired or been used already.`);
      }
      
      if (tokenError.message?.includes('redirect_uri_mismatch')) {
        console.error(`${LOG_PREFIX} Redirect URI mismatch during token exchange`);
        console.error(`${LOG_PREFIX} Callback URL used:`, callbackUrl);
        console.error(`${LOG_PREFIX} Registered redirect URIs in Google Console should include:`);
        console.error(`${LOG_PREFIX} 1. https://workspace.binateai25.repl.co/api/auth/google/callback`);
        console.error(`${LOG_PREFIX} 2. https://binateai.com/api/auth/google/callback`);
        console.error(`${LOG_PREFIX} 3. https://www.binateai.com/api/auth/google/callback`);
        console.error(`${LOG_PREFIX} 4. https://binateai.replit.app/api/auth/google/callback`);
        
        throw new Error(`Redirect URI mismatch. The redirect URI used for token exchange doesn't match what was used to get the code.`);
      }
      
      // Handle deleted client error
      if (tokenError.message?.includes('deleted_client') || tokenError.message?.includes('401')) {
        console.error(`${LOG_PREFIX} Client ID error - the OAuth client may have been deleted or is invalid`);
        throw new Error(`Google OAuth client error: The client ID appears to be invalid or deleted. Please check your Google Cloud Console configuration.`);
      }
      
      // Rethrow with original stack trace
      throw tokenError;
    }

    // Now check our outer variable that should have been set in the inner try block
    if (!exchangedTokens) {
      throw new Error("No tokens received from Google");
    }

    return {
      access_token: exchangedTokens.access_token,
      refresh_token: exchangedTokens.refresh_token, 
      expiry_date: exchangedTokens.expiry_date || 0,
    };
  } catch (error) {
    console.error(`Error exchanging code for tokens:`, error);
    
    // Enhance error message for common issues
    if (error.message?.includes('invalid_grant')) {
      throw new Error(`Invalid authorization code. This may be because the code has expired or already been used.`);
    }
    
    if (error.message?.includes('redirect_uri_mismatch')) {
      throw new Error(`Redirect URI mismatch. The redirect URI in this request doesn't match the one used to get the authorization code.`);
    }
    
    // Re-throw original error
    throw error;
  }
}

/**
 * Set tokens on the OAuth2 client
 */
export function setCredentials(tokens: {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}): void {
  oauth2Client.setCredentials(tokens);
}

/**
 * Get a new OAuth2 client with user credentials
 */
export async function getAuthClientForUser(
  userId: number,
): Promise<google.auth.OAuth2 | null> {
  // Get the user's connected service
  const googleService = await storage.getConnectedService(userId, "google");

  if (
    !googleService ||
    !googleService.connected ||
    !googleService.credentials
  ) {
    console.log(
      `${LOG_PREFIX} User ${userId} has no connected Google service or invalid credentials`,
    );
    return null;
  }

  // *** FIXED APPROACH ***
  // Always use the same fixed callback URL from config
  const callbackUrl = config.google.callbackUrl;
  
  // Make sure we're using the correct client ID by getting it directly from env
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  
  if (!clientId || !clientSecret) {
    console.error('CRITICAL: Missing Google OAuth credentials in getAuthClientForUser');
    console.error('GOOGLE_CLIENT_ID present:', !!process.env.GOOGLE_CLIENT_ID);
    console.error('GOOGLE_CLIENT_SECRET present:', !!process.env.GOOGLE_CLIENT_SECRET);
    throw new Error('Google OAuth credentials not configured');
  }
  
  console.log(`${LOG_PREFIX} getAuthClientForUser using callback URL: ${callbackUrl}`);
  console.log(`${LOG_PREFIX} Using client ID (starts with): ${clientId.substring(0, 6)}...`);
  
  // Create a new OAuth client using the consistent callback URL and direct env vars
  const userOauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    callbackUrl
  );

  // Set credentials from the database with token_type and scope
  userOauth2Client.setCredentials({
    access_token: googleService.credentials.access_token,
    refresh_token: googleService.credentials.refresh_token || undefined,
    expiry_date: googleService.credentials.expiry_date || 0,
    token_type: googleService.credentials.token_type || 'Bearer',
    scope: googleService.credentials.scope || 'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly'
  });

  return userOauth2Client;
}

/**
 * Get user info from Google
 */
export async function getUserInfo(authClient: google.auth.OAuth2): Promise<{
  email: string;
  name: string;
  picture: string;
}> {
  try {
    console.log(`${LOG_PREFIX} Attempting to get user info from Google...`);
    
    // Verify the auth client has credentials
    const credentials = authClient.credentials;
    const accessToken = credentials.access_token;
    
    // Very detailed debug - print out the credentials object structure
    console.log(`${LOG_PREFIX} Auth client credentials structure:`, JSON.stringify({
      has_access_token: !!credentials.access_token,
      has_refresh_token: !!credentials.refresh_token,
      has_expiry_date: !!credentials.expiry_date,
      token_type: credentials.token_type || 'none',
      scope: credentials.scope || 'none'
    }));
    
    if (!accessToken) {
      throw new Error("Auth client has no access token");
    }
    
    // Try two different approaches to get user info
    // First, try the Google People API
    try {
      console.log(`${LOG_PREFIX} First approach: Using Google People API...`);
      
      // Create People API client
      const people = google.people({
        version: 'v1',
        auth: authClient
      });
      
      // Get profile data
      const peopleResponse = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos'
      });
      
      const profile = peopleResponse.data;
      
      if (profile) {
        console.log(`${LOG_PREFIX} Successfully retrieved user info from People API`);
        
        const email = profile.emailAddresses && profile.emailAddresses[0] ? 
          profile.emailAddresses[0].value || "" : "";
        
        const name = profile.names && profile.names[0] ? 
          profile.names[0].displayName || "" : "";
        
        const picture = profile.photos && profile.photos[0] ? 
          profile.photos[0].url || "" : "";
        
        console.log(`${LOG_PREFIX} People API returned email: ${email}`);
        
        return { email, name, picture };
      }
      
      console.log(`${LOG_PREFIX} People API didn't return profile data, trying userinfo endpoint...`);
    } catch (peopleError) {
      console.log(`${LOG_PREFIX} People API approach failed, trying userinfo endpoint...`, peopleError);
    }
    
    // BACKUP APPROACH: Use a direct fetch to Google's userinfo endpoint
    console.log(`${LOG_PREFIX} Second approach: Using direct fetch to userinfo endpoint`);
    
    // The Google OAuth2 userinfo endpoint
    const userinfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
    
    console.log(`${LOG_PREFIX} Making request to ${userinfoEndpoint}`);
    
    // Make a direct fetch request with the access token
    const response = await fetch(userinfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${LOG_PREFIX} Error response from Google:`, {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      if (response.status === 401) {
        throw new Error(`Authentication error: The access token may be invalid or expired.`);
      }
      
      throw new Error(`Google API error (${response.status}): ${response.statusText}`);
    }
    
    const userData = await response.json();
    
    if (!userData) {
      throw new Error("No user data returned from Google");
    }
    
    console.log(`${LOG_PREFIX} Successfully retrieved user info for email: ${userData.email || 'unknown'}`);
    
    return {
      email: userData.email || "",
      name: userData.name || "",
      picture: userData.picture || "",
    };
    
  } catch (error: any) {
    console.error(`${LOG_PREFIX} Error getting user info from Google:`, error);
    
    // Check for common errors
    if (error.message?.includes('invalid_token')) {
      throw new Error(`Invalid access token. The token may have expired.`);
    }
    
    if (error.code === 401 || error.status === 401 || error.message?.includes('401')) {
      throw new Error(`Unauthorized request to Google API. The access token may be invalid or expired.`);
    }
    
    // Re-throw with original stack trace
    throw error;
  }
}
