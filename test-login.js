// Test script for login with cookie debugging
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { promisify } from 'util';
import fetchCookie from 'fetch-cookie';

async function testLogin() {
  // Create a cookie jar to store cookies
  const jar = new CookieJar();
  const fetchWithCookies = fetchCookie(fetch, jar);
  
  console.log('Testing login with test credentials...');
  
  try {
    // Get the current Replit domain
    const replitDomain = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_ID}-00-26x1ysnxshf8q.kirk.replit.dev`
      : 'http://localhost:5000';
      
    console.log(`Using API base URL: ${replitDomain}`);
      
    // 1. Try to get user profile (should fail with 401)
    console.log('1. Checking initial user state...');
    const initialUserResponse = await fetchWithCookies(`${replitDomain}/api/user`);
    
    console.log(`Initial user check status: ${initialUserResponse.status}`);
    console.log('Cookies after initial request:', await promisify(jar.getCookies.bind(jar))(replitDomain));
    
    // 2. Login attempt
    console.log('\n2. Attempting login...');
    const loginResponse = await fetchWithCookies(`${replitDomain}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'shaima123',
        password: 'Tiaali59'
      })
    });
    
    console.log(`Login status: ${loginResponse.status}`);
    console.log('Cookies after login:', await promisify(jar.getCookies.bind(jar))(replitDomain));
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json();
      console.log('Login successful! User data:', userData);
      
      // 3. Check if we can access the user endpoint now
      console.log('\n3. Checking user endpoint after login...');
      const finalUserResponse = await fetchWithCookies(`${replitDomain}/api/user`);
      
      console.log(`User endpoint status: ${finalUserResponse.status}`);
      console.log('Cookies for final request:', await promisify(jar.getCookies.bind(jar))(replitDomain));
      
      if (finalUserResponse.ok) {
        const userData = await finalUserResponse.json();
        console.log('User data after login:', userData);
      } else {
        console.log('Still unable to access user data after login!');
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('Login failed:', errorText);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

testLogin();