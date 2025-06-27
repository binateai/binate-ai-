// Script to apply pending email replies migration
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from "ws";

// This is required for Neon Serverless to work in Node.js
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create a connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create a Drizzle ORM instance
const db = drizzle(pool);

async function applyMigration() {
  try {
    console.log('Creating pending_email_replies table...');
    
    // Create the table directly with SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pending_email_replies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_id TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        original_message_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        action_taken TEXT,
        action_date TIMESTAMP
      )
    `);
    
    console.log('Successfully created pending_email_replies table');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

applyMigration();