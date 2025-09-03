#!/bin/bash

# Script pour configurer les variables d'environnement Vercel pour Scout Interest
# Usage: ./setup-vercel-env.sh

echo "🚀 Setting up Vercel Environment Variables for Scout Interest..."

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm i -g vercel"
    exit 1
fi

echo "📋 Please provide the following environment variables:"

# Meta Access Token
read -p "🔑 META_ACCESS_TOKEN (your Meta API access token): " META_ACCESS_TOKEN
if [ -z "$META_ACCESS_TOKEN" ]; then
    echo "❌ META_ACCESS_TOKEN is required for production"
    exit 1
fi

# Supabase URL
read -p "🗄️  SUPABASE_URL (your Supabase project URL): " SUPABASE_URL
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL is required for production"
    exit 1
fi

# Supabase Anon Key
read -p "🔐 SUPABASE_ANON_KEY (your Supabase anonymous key): " SUPABASE_ANON_KEY
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ SUPABASE_ANON_KEY is required for production"
    exit 1
fi

# Meta API Environment (optionnel)
read -p "🌍 META_API_ENVIRONMENT (production/development, default: production): " META_API_ENVIRONMENT
META_API_ENVIRONMENT=${META_API_ENVIRONMENT:-production}

echo ""
echo "🔧 Setting up Vercel environment variables..."

# Configurer les variables d'environnement sur Vercel
vercel env add META_ACCESS_TOKEN production <<< "$META_ACCESS_TOKEN"
vercel env add SUPABASE_URL production <<< "$SUPABASE_URL" 
vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
vercel env add META_API_ENVIRONMENT production <<< "$META_API_ENVIRONMENT"

echo ""
echo "✅ Environment variables configured successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run: vercel --prod"
echo "   2. Test your deployment"
echo "   3. Run: node validate-production-ready.js"
echo ""
echo "🎉 Your Scout Interest app is ready for production deployment!"
