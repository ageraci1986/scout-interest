const express = require('express');
const cors = require('cors');

const app = express();

// Middleware basique
app.use(cors());
app.use(express.json());

// Health check endpoint avec test DB
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection simple
    const db = require('./config/database');
    const dbTest = await db.run('SELECT 1 as test');
    const dbStatus = dbTest ? 'connected' : 'error';
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      message: 'DB server is working'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Test endpoint simple
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'DB server is working',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Export pour Vercel
module.exports = app;
