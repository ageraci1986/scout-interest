const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware de sécurité et configuration
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Configuration CORS sécurisée
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint optimisé pour Vercel
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0-optimized',
      message: 'Scout Interest API optimisée is running',
      services: {
        database: process.env.DATABASE_URL ? 'configured' : 'not_configured',
        meta_api: process.env.META_ACCESS_TOKEN ? 'configured' : 'not_configured',
        cors: process.env.CORS_ORIGIN || 'default',
        jwt: process.env.JWT_SECRET ? 'configured' : 'default'
      },
      features: {
        parallel_processor: 'optimized',
        authentication: 'enhanced',
        rate_limiting: 'enabled',
        caching: 'enabled'
      }
    };

    // Test de la base de données si configurée
    if (process.env.DATABASE_URL) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL, 
          process.env.SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabase
          .from('projects')
          .select('count')
          .limit(1);

        healthStatus.services.database = error ? 'error' : 'connected';
      } catch (dbError) {
        healthStatus.services.database = 'error';
      }
    }

    res.json(healthStatus);
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

// Import vraies routes
const metaRoutes = require('./routes/meta');
const uploadRoutes = require('./routes/upload');
const projectRoutes = require('./routes/projects');
const jobRoutes = require('./routes/jobs');

// API routes
app.use('/api/meta', metaRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/jobs', jobRoutes);

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
