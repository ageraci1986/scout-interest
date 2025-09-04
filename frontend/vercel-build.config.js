// Vercel Build Configuration for Frontend
module.exports = {
  // Build optimization
  build: {
    // Disable source maps in production for better performance
    generateSourceMap: false,
    
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          utils: ['axios', 'clsx', 'date-fns', 'lodash']
        }
      }
    }
  },
  
  // Environment variables for build
  env: {
    NODE_ENV: 'production',
    REACT_APP_ENV: 'production'
  },
  
  // Build commands
  scripts: {
    'vercel-build': 'npm run build'
  }
};

