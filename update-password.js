// Script to update user password
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import pg from 'pg';

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

// Function to hash password
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function updateUserPassword() {
  // Create a connection to the database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Hash the new password
    const password = 'testpassword'; // The password we want to set
    const hashedPassword = await hashPassword(password);
    
    console.log('New password hash:', hashedPassword);
    
    // Update the user's password in the database
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id',
      [hashedPassword, 'shaima123']
    );
    
    if (result.rowCount > 0) {
      console.log(`Successfully updated password for user ID: ${result.rows[0].id}`);
    } else {
      console.log('No user found with username: shaima123');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await pool.end();
  }
}

updateUserPassword();