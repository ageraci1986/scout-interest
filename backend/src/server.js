const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// Import configurations
const db = require('./config/database');
const redis = require('./config/redis');
const { analysisQueue, uploadQueue } = require('./config/queue');
const metaApi = require('./config/meta-api');

console.log('⚠️  Using mock services for development');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import routes
const metaRoutes = require('./routes/meta');
const uploadRoutes = require('./routes/upload');
const projectRoutes = require('./routes/projects');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'connected',
      redis: 'connected',
      meta_api: 'configured'
    }
  });
});

// API routes
app.use('/api/meta', metaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);

// Temporary redirect for direct project requests (workaround for proxy issues)
app.use('/projects', projectRoutes);

// Temporary redirect for direct meta requests (workaround for proxy issues)
app.use('/meta', metaRoutes);

// Temporary redirect for direct upload requests (workaround for proxy issues)
app.use('/upload', uploadRoutes);

// Mock API endpoints for testing
app.post('/api/upload', (req, res) => {
  // Simulate file upload processing
  setTimeout(() => {
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: 'sample_file.xlsx',
        postalCodes: 150,
        validCodes: 145,
        invalidCodes: 5
      }
    });
  }, 2000);
});

app.get('/api/analysis/status/:id', (req, res) => {
  const { id } = req.params;
  
  // Simulate analysis status
  const progress = Math.floor(Math.random() * 100);
  
  res.json({
    id,
    progress,
    status: progress < 100 ? 'processing' : 'completed',
    processed: Math.floor(progress * 1.5),
    total: 150,
    errors: Math.floor(progress * 0.05),
    successes: Math.floor(progress * 1.45),
    estimatedTime: Math.max(0, Math.ceil((100 - progress) / 10))
  });
});

app.get('/api/results/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock results data
  const mockResults = [
    { id: 1, postalCode: '75001', region: 'Paris 1er', audienceInterest: 45230, audienceGeo: 85000, ratio: 0.53, status: 'success' },
    { id: 2, postalCode: '75002', region: 'Paris 2ème', audienceInterest: 38450, audienceGeo: 72000, ratio: 0.53, status: 'success' },
    { id: 3, postalCode: '75003', region: 'Paris 3ème', audienceInterest: 52180, audienceGeo: 95000, ratio: 0.55, status: 'success' },
    { id: 4, postalCode: '75004', region: 'Paris 4ème', audienceInterest: 41320, audienceGeo: 78000, ratio: 0.53, status: 'success' },
    { id: 5, postalCode: '75005', region: 'Paris 5ème', audienceInterest: 39870, audienceGeo: 82000, ratio: 0.49, status: 'warning' },
  ];
  
  res.json({
    id,
    results: mockResults,
    summary: {
      total: 150,
      success: 145,
      warning: 3,
      error: 2
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`👥 Client ${socket.id} joined project ${projectId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io available to routes and workers
app.set('io', io);
global.io = io;

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO enabled`);
});

module.exports = app;
