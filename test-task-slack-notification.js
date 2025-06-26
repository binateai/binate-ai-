/**
 * Task Slack Notification Test
 * 
 * This script tests the Slack notification when a task is completed.
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

import axios from 'axios';
import fetch from 'node-fetch';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'fetch-cookie';

// Utility function to login
async function login() {
  const cookieJar = new CookieJar();
  const fetchWithCookies = wrapper(fetch, cookieJar);
  
  console.log('Logging in...');
  const loginResponse = await fetchWithCookies('http://localhost:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'shaima123',
      password: 'Tiaali59'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('Login failed:', loginResponse.statusText);
    throw new Error('Login failed');
  }
  
  console.log('Login successful');
  return fetchWithCookies;
}

// Main function to test the task completion notification
async function testTaskSlackNotification() {
  try {
    // Get the task id of the most recently created task for user 1
    const taskResult = await pool.query(
      'SELECT id FROM tasks WHERE user_id = 1 ORDER BY created_at DESC LIMIT 1'
    );
    
    if (taskResult.rows.length === 0) {
      console.error('No tasks found for user 1');
      return;
    }
    
    const taskId = taskResult.rows[0].id;
    console.log(`Testing with task ID: ${taskId}`);
    
    // Ensure user 1 has Slack notifications enabled
    await pool.query(`
      INSERT INTO user_settings (user_id, default_slack_channel)
      VALUES (1, '#binate-test')
      ON CONFLICT (user_id) 
      DO UPDATE SET default_slack_channel = '#binate-test'
    `);
    
    // Update user preferences to enable Slack notifications
    await pool.query(`
      UPDATE users 
      SET preferences = '{"slackEnabled":true,"slackNotifications":{"taskAlerts":true,"meetingReminders":true,"invoiceAlerts":true,"leadNotifications":true}}'
      WHERE id = 1
    `);
    
    console.log('User preferences updated to enable Slack notifications');
    
    // Get authenticated fetch
    const fetchWithAuth = await login();
    
    // Complete the task through the API
    console.log(`Completing task ID ${taskId}...`);
    const completeResponse = await fetchWithAuth(`http://localhost:5000/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!completeResponse.ok) {
      console.error('Task completion failed:', await completeResponse.text());
      throw new Error('Task completion failed');
    }
    
    const result = await completeResponse.json();
    console.log('Task completion API response:', result);
    console.log('Task completion successful. Check Slack for the notification.');
    
  } catch (error) {
    console.error('Error testing task notification:', error);
  } finally {
    await pool.end();
  }
}

// Run the test
testTaskSlackNotification();