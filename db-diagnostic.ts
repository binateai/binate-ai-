import express from 'express';
import { pool } from '../db';

const router = express.Router();

// Database diagnostic endpoint - does not require authentication
router.get('/status', async (req, res) => {
  try {
    console.log('Checking database connection status');
    
    // Test the database connection
    const startTime = Date.now();
    const result = await pool.query('SELECT now()');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Get database info but not expose sensitive details
    const connectionInfo = {
      connected: true,
      dbTime: result.rows[0].now,
      responseTimeMs: responseTime,
      platform: process.env.REPL_ID ? 'Replit' : 'Production',
      host: req.headers.host
    };
    
    // Try to count users table rows (safely)
    try {
      const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
      connectionInfo['userCount'] = userCount.rows[0].count;
    } catch (err) {
      console.error('Error counting users:', err);
      connectionInfo['userCount'] = 'Error fetching count';
    }
    
    console.log('Database connection successful:', connectionInfo);
    res.json({
      status: 'ok',
      database: connectionInfo
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error),
      host: req.headers.host,
      platform: process.env.REPL_ID ? 'Replit' : 'Production'
    });
  }
});

// Add a diagnostic user creation endpoint for testing
router.post('/create-test-user', async (req, res) => {
  try {
    // Only allow this in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        status: 'error',
        message: 'This endpoint is only available in development mode'
      });
    }
    
    const { username, password, email } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Username and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Username already exists'
      });
    }
    
    // Normally we would hash the password, but this is just for diagnostic purposes
    // In a real implementation, use proper password hashing
    const result = await pool.query(
      'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email',
      [username, password, email || null]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Test user created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create test user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;