// Simple diagnostic script for OAuth
import { exec } from 'child_process';

// Print environment variables
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...');
console.log('GOOGLE_CLIENT_SECRET present:', !!process.env.GOOGLE_CLIENT_SECRET);

// Build a curl command to test the token info endpoint with a fake token
const command = `curl -s -X GET "https://oauth2.googleapis.com/tokeninfo?access_token=FAKE_TOKEN_FOR_TEST"`;

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
  }
  
  // Parse and display the response
  try {
    const response = JSON.parse(stdout);
    console.log('Token info response:', response);
    
    // This should show an error for the fake token, but the endpoint should be reachable
    if (response.error) {
      console.log('Expected error for fake token - Google API is reachable');
    }
  } catch (e) {
    console.error('Failed to parse response:', e);
    console.log('Raw response:', stdout);
  }
});