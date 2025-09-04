const express = require('express');
const app = express();

console.log('🚀 Démarrage du serveur de test minimal...');

// Middleware de base
app.use(express.json());

// Test route simple
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works!', timestamp: new Date().toISOString() });
});

// Test route avec paramètre
app.get('/test/:id', (req, res) => {
  res.json({ 
    message: 'Test route with param works!', 
    id: req.params.id,
    timestamp: new Date().toISOString() 
  });
});

// Test route API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API test route works!', 
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

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Serveur de test démarré sur le port ${PORT}`);
  console.log(`🌐 Testez: http://localhost:${PORT}/test`);
  console.log(`🌐 Testez: http://localhost:${PORT}/api/test`);
});

module.exports = app;

