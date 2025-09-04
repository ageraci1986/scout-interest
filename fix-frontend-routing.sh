#!/bin/bash
# 🔧 Correction du Routage Frontend - Scout Interest
set -e
echo "🔧 Correction du Routage Frontend..."
FRONTEND_DIR="frontend"
BACKEND_URL="https://scout-interest-optimized-lwolbw6lc-angelo-geracis-projects.vercel.app"

echo "📝 Mise à jour de frontend/vercel.json..."
cat > "$FRONTEND_DIR/vercel.json" << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build",
        "installCommand": "npm install",
        "buildCommand": "npm run build"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://scout-interest-optimized-lwolbw6lc-angelo-geracis-projects.vercel.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
EOF

echo "✅ Configuration frontend corrigée !"
echo "🚀 Redéploiement du frontend..."
cd "$FRONTEND_DIR"
vercel --prod --yes
cd ..

echo "🎯 Frontend redéployé avec routage corrigé !"
echo "📱 Testez maintenant : https://frontend-g7xl4b1k6-angelo-geracis-projects.vercel.app"

