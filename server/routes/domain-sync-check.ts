import express from 'express';
import { pool } from '../db';

const router = express.Router();

// A special endpoint to verify domain synchronization with database
router.get('/check', async (req, res) => {
  try {
    console.log('Domain synchronization check requested');
    
    // Host and origin info for debugging
    const hostInfo = {
      host: req.headers.host,
      forwarded: req.headers['x-forwarded-host'],
      protocol: req.headers['x-forwarded-proto'] || 'https',
      origin: req.headers.origin,
      referer: req.headers.referer,
    };
    
    console.log('Request host info:', hostInfo);
    
    // Test the database connection
    const startTime = Date.now();
    const result = await pool.query('SELECT now(), version() as pg_version');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Get user count
    const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = userCountResult.rows[0].count;
    
    // Get users sample (no passwords)
    const usersSample = await pool.query(
      'SELECT id, username, email, created_at FROM users LIMIT 5'
    );
    
    // Response object
    const syncInfo = {
      timestamp: new Date().toISOString(),
      request: {
        host: hostInfo.host,
        protocol: hostInfo.protocol,
        fullUrl: `${hostInfo.protocol}://${hostInfo.host}${req.originalUrl}`
      },
      database: {
        connected: true,
        responseTimeMs: responseTime,
        postgresVersion: result.rows[0].pg_version,
        serverTime: result.rows[0].now,
        userCount: userCount,
        usersSample: usersSample.rows
      },
      isProductionDomain: hostInfo.host === 'binateai.com',
      environment: process.env.NODE_ENV || 'development',
      diagnosticNote: "If this same data appears when accessing from both Replit and binateai.com domains, they're using the same database."
    };
    
    res.json(syncInfo);
  } catch (error) {
    console.error('Domain sync check error:', error);
    res.status(500).json({
      error: 'Failed to check domain synchronization',
      message: error instanceof Error ? error.message : String(error),
      host: req.headers.host
    });
  }
});

export default router;