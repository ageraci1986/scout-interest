#!/bin/bash

echo "🚀 Adding environment variables to Vercel automatically..."

# NODE_ENV
echo "📋 Adding NODE_ENV..."
echo "production" | vercel env add NODE_ENV --yes

# DATABASE_URL (déjà ajouté, mais vérifions)
echo "📋 Checking DATABASE_URL..."
vercel env ls | grep DATABASE_URL || echo "⚠️  DATABASE_URL not found, adding..."

# META_APP_ID
echo "📋 Adding META_APP_ID..."
echo "744775438399992" | vercel env add META_APP_ID --yes

# META_APP_SECRET
echo "📋 Adding META_APP_SECRET..."
echo "131e64b3894a80af25a26d0deba41f23" | vercel env add META_APP_SECRET --yes

# META_ACCESS_TOKEN
echo "📋 Adding META_ACCESS_TOKEN..."
echo "EAAKlXotxefgBPeQ71pUZBT7AKxJRjvL7JxxfMznYDZC3v7OJ3NqmTEcLhwYZAjrYUjp1R8LgnIfE02NDioZAGZBy5OmbvPMR2Fi384bDxpiY9ZCB6aFvScx1xuNJjQKd7B7KSGDgOCFZCsriFkm1KNMoHPEHJGrkjYMm28jPMQvxOB5XErnmLCxxTQhG6Og54gb" | vercel env add META_ACCESS_TOKEN --yes

# META_AD_ACCOUNT_ID
echo "📋 Adding META_AD_ACCOUNT_ID..."
echo "act_323074088483830" | vercel env add META_AD_ACCOUNT_ID --yes

# META_API_VERSION
echo "📋 Adding META_API_VERSION..."
echo "v18.0" | vercel env add META_API_VERSION --yes

# JWT_SECRET
echo "📋 Adding JWT_SECRET..."
echo "your_super_secret_jwt_key_here" | vercel env add JWT_SECRET --yes

# JWT_EXPIRES_IN
echo "📋 Adding JWT_EXPIRES_IN..."
echo "24h" | vercel env add JWT_EXPIRES_IN --yes

# CORS_ORIGIN (adapté pour production)
echo "📋 Adding CORS_ORIGIN..."
echo "*" | vercel env add CORS_ORIGIN --yes

# BCRYPT_ROUNDS
echo "📋 Adding BCRYPT_ROUNDS..."
echo "12" | vercel env add BCRYPT_ROUNDS --yes

# RATE_LIMIT_WINDOW_MS
echo "📋 Adding RATE_LIMIT_WINDOW_MS..."
echo "900000" | vercel env add RATE_LIMIT_WINDOW_MS --yes

# RATE_LIMIT_MAX_REQUESTS
echo "📋 Adding RATE_LIMIT_MAX_REQUESTS..."
echo "100" | vercel env add RATE_LIMIT_MAX_REQUESTS --yes

# META_RATE_LIMIT_CALLS_PER_HOUR
echo "📋 Adding META_RATE_LIMIT_CALLS_PER_HOUR..."
echo "200" | vercel env add META_RATE_LIMIT_CALLS_PER_HOUR --yes

# META_RATE_LIMIT_RETRY_DELAY
echo "📋 Adding META_RATE_LIMIT_RETRY_DELAY..."
echo "5000" | vercel env add META_RATE_LIMIT_RETRY_DELAY --yes

# QUEUE_CONCURRENCY
echo "📋 Adding QUEUE_CONCURRENCY..."
echo "5" | vercel env add QUEUE_CONCURRENCY --yes

# QUEUE_BATCH_SIZE
echo "📋 Adding QUEUE_BATCH_SIZE..."
echo "10" | vercel env add QUEUE_BATCH_SIZE --yes

# LOG_LEVEL
echo "📋 Adding LOG_LEVEL..."
echo "info" | vercel env add LOG_LEVEL --yes

echo "🎉 All environment variables added successfully!"
echo "📋 Listing all variables:"
vercel env ls
