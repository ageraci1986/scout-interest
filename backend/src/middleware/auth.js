const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Cache pour les tokens révoqués
const revokedTokens = new Set();

// Rate limiting par IP pour l'auth
const authAttempts = new Map();
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

const authMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Vérifier les tentatives d'authentification
  const attempts = authAttempts.get(clientIP);
  if (attempts && attempts.count >= MAX_AUTH_ATTEMPTS && 
      Date.now() - attempts.lastAttempt < AUTH_LOCKOUT_TIME) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((AUTH_LOCKOUT_TIME - (Date.now() - attempts.lastAttempt)) / 1000)
    });
  }

  const apiKey = req.headers['x-api-key'];
  const authorization = req.headers['authorization'];

  try {
    // Méthode 1: JWT Token
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.slice(7);
      
      if (revokedTokens.has(token)) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      return next();
    }

    // Méthode 2: API Key avec hash
    if (apiKey) {
      const expectedHash = process.env.API_KEY_HASH;
      const providedHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      if (expectedHash && providedHash === expectedHash) {
        req.user = { type: 'api_key', id: 'anonymous' };
        return next();
      }
    }

    // Méthode 3: Fallback pour développement local
    if (process.env.NODE_ENV === 'development' && 
        apiKey === process.env.DEMO_API_KEY) {
      req.user = { type: 'demo', id: 'demo_user' };
      return next();
    }

    // Enregistrer tentative d'authentification échouée
    const currentAttempts = authAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    authAttempts.set(clientIP, {
      count: currentAttempts.count + 1,
      lastAttempt: Date.now()
    });

    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Valid authentication required',
      methods: ['Bearer token', 'x-api-key']
    });

  } catch (error) {
    console.error('Auth error:', error.message);
    
    // Enregistrer tentative d'authentification échouée
    const currentAttempts = authAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    authAttempts.set(clientIP, {
      count: currentAttempts.count + 1,
      lastAttempt: Date.now()
    });

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid credentials'
    });
  }
};

// Middleware pour générer des tokens JWT
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn });
};

// Middleware pour révoquer un token
const revokeToken = (token) => {
  revokedTokens.add(token);
  // Nettoyer les anciens tokens révoqués périodiquement
  setTimeout(() => revokedTokens.delete(token), 24 * 60 * 60 * 1000); // 24h
};

// Middleware optionnel (ne bloque pas si pas d'auth)
const optionalAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const authorization = req.headers['authorization'];

  if (!apiKey && !authorization) {
    req.user = null;
    return next();
  }

  authMiddleware(req, res, next);
};

module.exports = {
  authMiddleware,
  optionalAuth,
  generateToken,
  revokeToken
};
