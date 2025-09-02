#!/bin/bash

echo "🚀 Adding environment variables to Vercel interactively..."

# Fonction pour ajouter une variable
add_env_var() {
    local var_name=$1
    local var_value=$2
    echo "📋 Adding $var_name..."
    
    # Utiliser expect pour automatiser l'entrée
    expect << EOF
spawn vercel env add $var_name
expect "What's the value of $var_name?"
send "$var_value\r"
expect "Add $var_name to which Environments"
send "Production Preview Development\r"
expect eof
EOF
    echo "✅ $var_name added"
}

# NODE_ENV
add_env_var "NODE_ENV" "production"

# META_APP_ID
add_env_var "META_APP_ID" "744775438399992"

# META_APP_SECRET
add_env_var "META_APP_SECRET" "131e64b3894a80af25a26d0deba41f23"

# META_ACCESS_TOKEN
add_env_var "META_ACCESS_TOKEN" "EAAKlXotxefgBPeQ71pUZBT7AKxJRjvL7JxxfMznYDZC3v7OJ3NqmTEcLhwYZAjrYUjp1R8LgnIfE02NDioZAGZBy5OmbvPMR2Fi384bDxpiY9ZCB6aFvScx1xuNJjQKd7B7KSGDgOCFZCsriFkm1KNMoHPEHJGrkjYMm28jPMQvxOB5XErnmLCxxTQhG6Og54gb"

# META_AD_ACCOUNT_ID
add_env_var "META_AD_ACCOUNT_ID" "act_323074088483830"

# META_API_VERSION
add_env_var "META_API_VERSION" "v18.0"

# JWT_SECRET
add_env_var "JWT_SECRET" "your_super_secret_jwt_key_here"

# JWT_EXPIRES_IN
add_env_var "JWT_EXPIRES_IN" "24h"

# CORS_ORIGIN
add_env_var "CORS_ORIGIN" "*"

# BCRYPT_ROUNDS
add_env_var "BCRYPT_ROUNDS" "12"

# RATE_LIMIT_WINDOW_MS
add_env_var "RATE_LIMIT_WINDOW_MS" "900000"

# RATE_LIMIT_MAX_REQUESTS
add_env_var "RATE_LIMIT_MAX_REQUESTS" "100"

# META_RATE_LIMIT_CALLS_PER_HOUR
add_env_var "META_RATE_LIMIT_CALLS_PER_HOUR" "200"

# META_RATE_LIMIT_RETRY_DELAY
add_env_var "META_RATE_LIMIT_RETRY_DELAY" "5000"

# QUEUE_CONCURRENCY
add_env_var "QUEUE_CONCURRENCY" "5"

# QUEUE_BATCH_SIZE
add_env_var "QUEUE_BATCH_SIZE" "10"

# LOG_LEVEL
add_env_var "LOG_LEVEL" "info"

echo "🎉 All environment variables added successfully!"
echo "📋 Listing all variables:"
vercel env ls
