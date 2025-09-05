const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const simpleApiRoutes = require('./routes/simple-api');

const app = express();

console.log('🚀 Starting SIMPLE Scout Interest Server...');

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Disable pour éviter les conflits
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins in development
    callback(null, true);
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'scout-interest-simple'
  });
});

// Simple API routes
app.use('/api', simpleApiRoutes);

// Existing routes (upload, targeting, meta)
// Import existing working routes
try {
  const uploadRoutes = require('./routes/upload');
  const metaRoutes = require('./routes/meta');
  const projectRoutes = require('./routes/projects');
  
  app.use('/api', uploadRoutes);
  app.use('/api/meta', metaRoutes);
  app.use('/api', projectRoutes);
  
  console.log('✅ Loaded existing upload, meta, and project routes');
} catch (error) {
  console.log('⚠️ Could not load existing routes:', error.message);
}

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found' });
});

// For Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}