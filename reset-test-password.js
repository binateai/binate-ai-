/**
 * Password Reset Utility
 * 
 * This script resets a test user's password to ensure the hashing is correct
 * Usage: node reset-test-password.js
 */

import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Configuration - adjust as needed
const testUser = {
  username: 'shaima123',
  password: 'Tiaali59'
};

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function resetPassword() {
  try {
    console.log('Starting password reset process for test user...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    // Connect to the database
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    console.log('Generating hash for password...');
    const hashedPassword = await hashPassword(testUser.password);
    console.log('Generated password hash:', hashedPassword.substring(0, 20) + '...');
    
    // Find user
    const userQuery = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [testUser.username]
    );
    
    if (userQuery.rows.length === 0) {
      throw new Error(`User '${testUser.username}' not found`);
    }
    
    const userId = userQuery.rows[0].id;
    const oldHash = userQuery.rows[0].password;
    
    console.log(`Found user '${testUser.username}' with ID ${userId}`);
    console.log('Current password hash:', oldHash.substring(0, 20) + '...');
    
    // Update password
    const updateResult = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username',
      [hashedPassword, testUser.username]
    );
    
    if (updateResult.rows.length === 0) {
      throw new Error('Password update failed');
    }
    
    console.log(`Password successfully reset for user '${updateResult.rows[0].username}'`);
    
    // Close the database connection
    await pool.end();
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}

// Execute the function
resetPassword()
  .then(success => {
    if (success) {
      console.log('\nPassword reset completed successfully. Try logging in again.');
    } else {
      console.log('\nPassword reset failed. See error logs above.');
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
  });