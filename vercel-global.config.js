// Vercel Global Configuration for Scout Interest
module.exports = {
  // Project configuration
  projectName: 'scout-interest',
  
  // Frontend configuration
  frontend: {
    directory: 'frontend',
    buildCommand: 'npm run build:vercel',
    outputDirectory: 'build',
    installCommand: 'npm install',
    framework: 'react',
    optimizations: {
      compression: true,
      caching: true,
      bundleOptimization: true
    }
  },
  
  // Backend configuration
  backend: {
    directory: 'backend',
    buildCommand: 'npm run vercel-build',
    outputDirectory: 'src',
    installCommand: 'npm install --production',
    framework: 'nodejs',
    optimizations: {
      compression: true,
      rateLimiting: true,
      memoryOptimization: true
    }
  },
  
  // Global environment variables
  env: {
    NODE_ENV: 'production',
    CORS_ORIGIN: 'https://scout-interest.vercel.app',
    FRONTEND_URL: 'https://scout-interest.vercel.app'
  },
  
  // Build configuration
  build: {
    // Concurrent builds
    concurrent: true,
    
    // Build timeout
    timeout: 300,
    
    // Cache configuration
    cache: {
      frontend: true,
      backend: true
    }
  },
  
  // Deployment settings
  deploy: {
    // Auto-deploy on push to main branch
    autoDeploy: true,
    
    // Preview deployments for pull requests
    previewDeployments: true,
    
    // Function configuration
    functions: {
      timeout: 30,
      memory: 1024,
      maxPayloadSize: '15mb'
    }
  },
  
  // Performance optimizations
  performance: {
    // Enable compression
    compression: true,
    
    // Enable caching for static assets
    staticCaching: true,
    
    // Bundle optimization
    bundleOptimization: true,
    
    // Rate limiting
    rateLimiting: true
  },
  
  // Security configuration
  security: {
    // CORS configuration
    cors: {
      origin: 'https://scout-interest.vercel.app',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization']
    },
    
    // Headers de sécurité
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  
  // Monitoring and analytics
  monitoring: {
    // Performance monitoring
    performance: true,
    
    // Error tracking
    errorTracking: true,
    
    // Analytics
    analytics: true
  }
};

