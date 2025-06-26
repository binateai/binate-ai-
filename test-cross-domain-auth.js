/**
 * Cross-Domain Authentication Test
 * This script checks if authentication is working correctly across different domains
 */

import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { promisify } from 'util';
import fetchCookie from 'fetch-cookie';

// Test credentials
const testUser = {
  username: 'shaima123',
  password: 'Tiaali59'
};

// Cookie jar to maintain session
const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);

async function testCrossDomainAuth() {
  console.log('=== Cross-Domain Authentication Test ===');
  console.log('Testing authentication with user:', testUser.username);
  
  try {
    // Test with Replit preview URL
    const replitDomain = process.env.REPL_ID 
      ? `https://${process.env.REPL_ID}-00-26x1ysnxshf8q.kirk.replit.dev`
      : 'http://localhost:5000';
    
    // Step 1: Try the test login endpoint on the Replit domain
    console.log(`\nStep 1: Test Login on ${replitDomain}`);
    const loginResponse = await fetchWithCookies(`${replitDomain}/api/auth/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    console.log('Login status:', loginResponse.status, loginResponse.statusText);
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    const userData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(userData, null, 2));
    
    if (userData.user) {
      console.log('Successfully logged in as:', userData.user.username);
    } else if (userData.username) {
      console.log('Successfully logged in as:', userData.username);
    } else {
      console.log('Login successful but username not found in response');
    }
    
    // Step 2: Get cookies from jar
    console.log('\nStep 2: Check current cookies');
    const cookies = await jar.getCookies(replitDomain);
    console.log('Cookie count:', cookies.length);
    cookies.forEach(cookie => {
      console.log(`- ${cookie.key}: domain=${cookie.domain}, path=${cookie.path}, secure=${cookie.secure}, httpOnly=${cookie.httpOnly}, sameSite=${cookie.sameSite}`);
    });
    
    // Step 3: Check authentication status
    console.log('\nStep 3: Check authentication status');
    const statusResponse = await fetchWithCookies(`${replitDomain}/api/auth/status`);
    const status = await statusResponse.json();
    
    console.log('Authenticated:', status.authenticated);
    console.log('Session ID:', status.session?.id);
    if (status.session?.cookie) {
      console.log('Cookie settings:');
      console.log('- Domain:', status.session.cookie.domain || 'Not set');
      console.log('- SameSite:', status.session.cookie.sameSite || 'Default');
      console.log('- Secure:', status.session.cookie.secure ? 'Yes' : 'No');
      console.log('- HttpOnly:', status.session.cookie.httpOnly ? 'Yes' : 'No');
    }
    
    // Step 4: Test API endpoint that requires authentication
    console.log('\nStep 4: Access protected API endpoint');
    const userResponse = await fetchWithCookies(`${replitDomain}/api/user`);
    console.log('User API status:', userResponse.status);
    
    if (userResponse.status === 200) {
      const user = await userResponse.json();
      console.log('User data retrieved successfully:', user.username);
    } else {
      console.log('Failed to access protected endpoint');
    }
    
    console.log('\nTest completed successfully');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testCrossDomainAuth();