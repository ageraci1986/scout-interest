const express = require('express');
const cors = require('cors');
const app = express();

console.log('🚀 Démarrage du serveur simplifié...');

// Middleware de base
app.use(cors());
app.use(express.json());

// Health check simple
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Serveur simplifié fonctionne',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test route simple
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test route fonctionne',
    timestamp: new Date().toISOString()
  });
});

// Test route Meta
app.get('/api/meta/test', (req, res) => {
  res.json({
    message: 'Meta test route fonctionne',
    timestamp: new Date().toISOString()
  });
});

// Test route Projects
app.get('/api/projects/test', (req, res) => {
  res.json({
    message: 'Projects test route fonctionne',
    timestamp: new Date().toISOString()
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

