const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const fs = require('fs');
const path = require('path');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Connected to database');

  try {
    // Create expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        date DATE NOT NULL,
        receipt_url TEXT,
        vendor TEXT,
        payment_method TEXT,
        tax_deductible BOOLEAN DEFAULT TRUE,
        tax_rate INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        tags TEXT[]
      );
    `);
    console.log('Created expenses table');

    // Create user_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        country TEXT DEFAULT 'US',
        default_tax_rate INTEGER DEFAULT 0,
        default_currency TEXT DEFAULT 'USD',
        fiscal_year_start TEXT DEFAULT '01-01',
        business_name TEXT,
        business_type TEXT,
        tax_identification_number TEXT,
        expense_categories_custom JSONB
      );
    `);
    console.log('Created user_settings table');

    console.log('Successfully applied all migrations');
  } catch (error) {
    console.error('Error applying migrations:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);