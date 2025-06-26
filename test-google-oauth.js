/**
 * Google OAuth diagnostic test
 * This script tests the Google OAuth flow to help diagnose issues
 */

import { google } from 'googleapis';

// Log the environment variables (partial redaction for security)
function logClientInfo() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  
  console.log('Environment variables:');
  console.log(`- GOOGLE_CLIENT_ID: ${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 5)}`);
  console.log(`- GOOGLE_CLIENT_SECRET: ${clientSecret ? clientSecret.substring(0, 5) + '...' : 'Not set'}`);
  
  // Check if we have credentials
  if (!clientId || !clientSecret) {
    console.error('CRITICAL: Missing Google OAuth credentials!');
    process.exit(1);
  }
}

// Generate the OAuth URL
function generateAuthUrl() {
  // Use a fixed callback URL for testing
  const callbackUrl = 'https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev/api/auth/google/callback';
  
  console.log(`Using callback URL: ${callbackUrl}`);
  
  // Create OAuth client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl
  );
  
  // Generate auth URL with the dynamic redirect_uri
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    prompt: "consent",
    include_granted_scopes: true,
    redirect_uri: callbackUrl
  });
  
  console.log('\nAuth URL Generated:');
  console.log(url);
  
  // Extract params for debugging
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  console.log('\nURL Parameters:');
  console.log('- client_id:', params.get('client_id'));
  console.log('- redirect_uri:', params.get('redirect_uri'));
  console.log('- scope:', params.get('scope'));
}

// Manual token exchange simulation
async function simulateTokenExchange(code) {
  if (!code) {
    console.log('\nNo code provided for token exchange simulation');
    console.log('To test token exchange, run:');
    console.log('node test-google-oauth.js exchange YOUR_CODE');
    return;
  }
  
  console.log(`\nSimulating token exchange with code: ${code.substring(0, 10)}...`);
  
  const callbackUrl = 'https://004cd0fb-c62b-41f4-9092-516b03c6788b-00-26x1ysnxshf8q.kirk.replit.dev/api/auth/google/callback';
  
  // Create OAuth client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl
  );
  
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken({
      code: code,
      redirect_uri: callbackUrl
    });
    
    console.log('\nToken exchange successful!');
    console.log('- access_token:', tokens.access_token ? `${tokens.access_token.substring(0, 10)}...` : 'None');
    console.log('- refresh_token:', tokens.refresh_token ? 'Present' : 'None');
    console.log('- expiry_date:', tokens.expiry_date);
    
    // Try making a simple API call
    oauth2Client.setCredentials(tokens);
    
    const oauth2Api = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    console.log('\nTesting API call to userinfo...');
    const userInfo = await oauth2Api.userinfo.get();
    
    console.log('API call successful!');
    console.log('User email:', userInfo.data.email);
    console.log('User name:', userInfo.data.name);
  } catch (error) {
    console.error('\nToken exchange failed:');
    console.error(error.message);
    
    if (error.response) {
      console.error('\nResponse details:');
      console.error(error.response.data);
    }
  }
}

// Main function
async function main() {
  console.log('=== Google OAuth Diagnostic Test ===\n');
  
  // Show available commands
  if (process.argv.length < 3) {
    console.log('Usage:');
    console.log('- Generate auth URL: node test-google-oauth.js url');
    console.log('- Simulate token exchange: node test-google-oauth.js exchange CODE');
    return;
  }
  
  // Log basic info
  logClientInfo();
  
  // Process command
  const command = process.argv[2];
  
  if (command === 'url') {
    generateAuthUrl();
  } else if (command === 'exchange') {
    const code = process.argv[3];
    await simulateTokenExchange(code);
  } else {
    console.log(`Unknown command: ${command}`);
  }
}

// Run the script
main().catch(console.error);