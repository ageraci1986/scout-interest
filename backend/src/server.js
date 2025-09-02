const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware de sécurité et configuration
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: false
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Scout Interest API with Meta connection is running'
  });
});

// Import vraies routes
const metaRoutes = require('./routes/meta');
const uploadRoutes = require('./routes/upload');
const projectRoutes = require('./routes/projects');

// API routes
app.use('/api/meta', metaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    requested_url: req.url,
    method: req.method
  });
});

// Export pour Vercel
module.exports = app;
