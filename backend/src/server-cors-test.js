const express = require('express');
const cors = require('cors');

const app = express();

console.log('🚀 Serveur de test CORS démarré...');
console.log('🔍 Variables d\'environnement:');
console.log('   CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('   NODE_ENV:', process.env.NODE_ENV);

// Configuration CORS simple
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
  console.log('✅ CORS_ORIGIN ajouté:', process.env.CORS_ORIGIN);
}

console.log('📋 Origines autorisées:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 Requête depuis l\'origine:', origin);
    
    if (!origin) {
      console.log('✅ Pas d\'origine (requête directe)');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Origine autorisée:', origin);
      callback(null, true);
    } else {
      console.log('🚨 Origine bloquée:', origin);
      console.log('📋 Origines autorisées:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Test route simple
app.get('/api/test', (req, res) => {
  console.log('✅ Route /api/test appelée');
  res.json({
    message: 'Test CORS réussi',
    timestamp: new Date().toISOString(),
    cors_origin: process.env.CORS_ORIGIN,
    allowed_origins: allowedOrigins
  });
});

// Test route projects
app.get('/api/projects/user/anonymous', (req, res) => {
  console.log('✅ Route /api/projects appelée');
  res.json({
    success: true,
    data: {
      projects: [
        {
          id: 1,
          name: 'Test Project',
          description: 'Projet de test CORS'
        }
      ]
    }
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

console.log('🎉 Serveur de test CORS prêt !');

module.exports = app;

