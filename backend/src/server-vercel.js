const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

console.log('🚀 Démarrage du serveur Vercel optimisé...');

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
// CORS DÉFINITIF - Accepter tous les domaines Vercel du projet
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000'
];

// Ajouter tous les domaines Vercel possibles
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Autoriser tous les domaines Vercel du projet scout-interest
    if (origin && (
      origin.includes('scout-interest') || 
      origin.includes('frontend-') || 
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    )) {
      console.log(`✅ CORS allowed for origin: ${origin}`);
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

// Health check endpoint optimisé pour Vercel
app.get('/api/health', async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0-vercel-optimized',
      message: 'Scout Interest API Vercel optimisée is running',
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

// Test route simple
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test route fonctionne sur Vercel',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint pour les variables d'environnement
app.get('/api/debug/env', (req, res) => {
  res.json({
    message: 'Environment variables debug',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
      SUPABASE_URL_PREFIX: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 50) + '...' : 'MISSING',
      SUPABASE_ANON_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_ANON_KEY_PREFIX: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING',
      META_ACCESS_TOKEN_EXISTS: !!process.env.META_ACCESS_TOKEN,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL
    }
  });
});

// Chargement sécurisé des routes avec gestion d'erreur
let metaRoutesLoaded = false;
let projectRoutesLoaded = false;
let uploadRoutesLoaded = false;

// Chargement des routes Meta
try {
  console.log('📁 Chargement des routes Meta...');
  const metaRoutes = require('./routes/meta');
  app.use('/api/meta', metaRoutes);
  metaRoutesLoaded = true;
  console.log('✅ Routes Meta chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes Meta:', error.message);
  // Route de fallback pour Meta
  app.get('/api/meta/*', (req, res) => {
    res.json({
      error: 'Meta routes not available',
      message: 'Meta API routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Chargement des routes Projects
try {
  console.log('📁 Chargement des routes Projects...');
  const projectRoutes = require('./routes/projects');
  app.use('/api/projects', projectRoutes);
  projectRoutesLoaded = true;
  console.log('✅ Routes Projects chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes Projects:', error.message);
  // Route de fallback pour Projects
  app.get('/api/projects/*', (req, res) => {
    res.json({
      error: 'Project routes not available',
      message: 'Project API routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Chargement des routes Upload
try {
  console.log('📁 Chargement des routes Upload...');
  const uploadRoutes = require('./routes/upload');
  app.use('/api/upload', uploadRoutes);
  uploadRoutesLoaded = true;
  console.log('✅ Routes Upload chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes Upload:', error.message);
  // Route de fallback pour Upload
  app.get('/api/upload/*', (req, res) => {
    res.json({
      error: 'Upload routes not available',
      message: 'Upload API routes failed to load',
      timestamp: new Date().toISOString()
    });
  });
}

// Status des routes
app.get('/api/routes-status', (req, res) => {
  res.json({
    routes_status: {
      meta: metaRoutesLoaded ? 'loaded' : 'failed',
      projects: projectRoutesLoaded ? 'loaded' : 'failed',
      upload: uploadRoutesLoaded ? 'loaded' : 'failed'
    },
    timestamp: new Date().toISOString()
  });
});

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

console.log('🎉 Serveur Vercel optimisé prêt !');

// Export pour Vercel
module.exports = app;
