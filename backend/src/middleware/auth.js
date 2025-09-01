// Simple authentication middleware for demo purposes
const authMiddleware = (req, res, next) => {
  // Get API key from headers
  const apiKey = req.headers['x-api-key'];
  
  // Simple validation - in production, use proper JWT or session-based auth
  if (!apiKey || apiKey !== process.env.DEMO_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Valid API key required'
    });
  }
  
  next();
};

module.exports = authMiddleware;
