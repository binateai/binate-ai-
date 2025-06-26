// Utility script to test Google OAuth URL generation and environment variables
import fetch from 'node-fetch';
import { URL } from 'url';

async function testGoogleAuth() {
  console.log('=== Google OAuth Test Utility ===');
  console.log('Running simple tests to verify Google OAuth configuration\n');
  
  // Check environment variables
  console.log('Environment Variables Check:');
  console.log(`GOOGLE_CLIENT_ID present: ${!!process.env.GOOGLE_CLIENT_ID}`);
  console.log(`GOOGLE_CLIENT_SECRET present: ${!!process.env.GOOGLE_CLIENT_SECRET}`);
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('\n❌ CRITICAL ERROR: Missing required Google OAuth environment variables');
    console.error('Please ensure both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set');
    return;
  }
  
  console.log('\n✅ Required environment variables are present');
  
  // Display partially masked client ID for verification
  if (process.env.GOOGLE_CLIENT_ID) {
    const visibleStart = process.env.GOOGLE_CLIENT_ID.substring(0, 8);
    const visibleEnd = process.env.GOOGLE_CLIENT_ID.substring(process.env.GOOGLE_CLIENT_ID.length - 4);
    console.log(`Using Client ID: ${visibleStart}...${visibleEnd}`);
  }
  
  try {
    console.log('\nFetching Google Auth URL from direct endpoint...');
    
    const response = await fetch('http://localhost:5000/api/google-auth-direct');
    
    if (!response.ok) {
      throw new Error(`Server returned: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ Successfully retrieved Google Auth URL:');
    console.log('Auth URL:', data.authUrl.substring(0, 80) + '...');
    console.log('Redirect URL:', data.redirectUrl);
    console.log('Authentication status:', data.isAuthenticated ? 'Logged in' : 'Not logged in');
    
    // Extract key parameters from URL for verification
    const urlObj = new URL(data.authUrl);
    const clientId = urlObj.searchParams.get('client_id');
    const redirectUri = urlObj.searchParams.get('redirect_uri');
    const scope = urlObj.searchParams.get('scope');
    
    console.log('\nURL Parameters:');
    console.log(`client_id: ${clientId ? (clientId.substring(0, 8) + '...' + clientId.substring(clientId.length - 4)) : 'Not found'}`);
    console.log(`redirect_uri: ${redirectUri || 'Not found'}`);
    console.log(`scope includes Gmail: ${scope && scope.includes('gmail') ? 'Yes' : 'No'}`);
    console.log(`scope includes Calendar: ${scope && scope.includes('calendar') ? 'Yes' : 'No'}`);
    
    console.log('\n==== Test Complete ====');
    console.log('To perform a complete test:');
    console.log('1. Open the google-connect.html page in your browser');
    console.log('2. Log in and authorize with Google');
    console.log('3. Check server logs for detailed OAuth callback information');
    
  } catch (error) {
    console.error('\n❌ Error testing Google Auth:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testGoogleAuth().catch(err => {
  console.error('Unhandled error:', err);
});