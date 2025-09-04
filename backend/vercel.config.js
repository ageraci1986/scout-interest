// Vercel Configuration for Backend
module.exports = {
  // Function configuration
  functions: {
    'src/server.js': {
      // Maximum execution time (30 seconds)
      maxDuration: 30,
      
      // Memory allocation (1024 MB)
      memory: 1024,
      
      // Include necessary files
      includeFiles: [
        'src/**/*',
        'package.json',
        'package-lock.json'
      ]
    }
  },
  
  // Build configuration
  build: {
    // Node.js version
    nodeVersion: '18.x',
    
    // Build command
    buildCommand: 'npm install --production',
    
    // Output directory
    outputDirectory: 'src'
  },
  
  // Environment variables
  env: {
    NODE_ENV: 'production',
    CORS_ORIGIN: 'https://scout-interest.vercel.app'
  },
  
  // Headers configuration
  headers: [
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: 'https://scout-interest.vercel.app'
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS'
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization'
        }
      ]
    }
  ],
  
  // Routes configuration
  routes: [
    {
      source: '/api/(.*)',
      destination: '/src/server.js'
    },
    {
      source: '/health',
      destination: '/src/server.js'
    }
  ]
};

