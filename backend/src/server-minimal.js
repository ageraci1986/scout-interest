const express = require('express');
const cors = require('cors');

const app = express();

// Middleware basique
app.use(cors());
app.use(express.json());

// Health check endpoint simple
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Minimal server is working'
  });
});

// Test endpoint simple
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Minimal API is working',
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
