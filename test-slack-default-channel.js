import { config } from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

config();

// Read cookie file
const cookieJar = fs.readFileSync('./cookies.txt', 'utf8');

const BASEURL = 'http://localhost:5000';

// Function to parse cookies from cookie jar
function parseCookies() {
  try {
    // Read cookies from the cookie jar
    const cookies = cookieJar;
    return cookies;
  } catch (error) {
    console.error('Error reading cookies:', error);
    return '';
  }
}

async function testSlackDefaultChannel() {
  const cookies = parseCookies();
  
  console.log('Testing Slack Default Channel API...');
  
  try {
    // Test setting default channel
    console.log('\n--- Setting default channel to "general" ---');
    const setResponse = await fetch(`${BASEURL}/api/integrations/slack/default-channel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({ channelId: 'general' })
    });
    
    const setResult = await setResponse.json();
    console.log('Response:', setResult);
    
    // Test getting the default channel
    console.log('\n--- Getting default channel ---');
    const getResponse = await fetch(`${BASEURL}/api/integrations/slack/default-channel`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    const getResult = await getResponse.json();
    console.log('Response:', getResult);
    
    // Test sending a message using the default channel
    console.log('\n--- Sending a test message with default channel ---');
    const testResponse = await fetch(`${BASEURL}/api/integrations/slack/test-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({})  // No channel specified, should use default
    });
    
    const testResult = await testResponse.json();
    console.log('Response:', testResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSlackDefaultChannel();