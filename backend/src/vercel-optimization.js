// Vercel Optimization Configuration for Backend
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Compression middleware optimized for Vercel
const vercelCompression = compression({
  level: process.env.COMPRESSION_LEVEL || 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Rate limiting optimized for Vercel
const vercelRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 / 60)
    });
  }
});

// CORS configuration optimized for Vercel
const vercelCors = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://scout-interest.vercel.app',
      'https://scout-interest.vercel.app',
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚨 CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Memory optimization for Vercel
const optimizeMemory = () => {
  // Set memory limits
  if (process.env.NODE_ENV === 'production') {
    // Increase memory limit for Vercel
    process.setMaxListeners(0);
    
    // Optimize garbage collection
    if (global.gc) {
      setInterval(() => {
        global.gc();
      }, 30000); // Run GC every 30 seconds
    }
  }
};

// Export optimization functions
module.exports = {
  vercelCompression,
  vercelRateLimit,
  vercelCors,
  optimizeMemory
};

