#!/bin/bash

# 🌍 Script de Configuration des Variables d'Environnement Vercel
# Configuration interactive pour Scout Interest

set -e

echo "🌍 Configuration des Variables d'Environnement Vercel"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour demander une valeur
ask_value() {
    local prompt="$1"
    local default="$2"
    local required="$3"
    
    if [ "$required" = "true" ]; then
        prompt="$prompt (OBLIGATOIRE)"
    fi
    
    if [ -n "$default" ]; then
        prompt="$prompt [défaut: $default]"
    fi
    
    echo -n "$prompt: "
    read -r value
    
    if [ "$required" = "true" ] && [ -z "$value" ]; then
        log_error "Cette valeur est obligatoire !"
        ask_value "$1" "$2" "$3"
        return
    fi
    
    echo "${value:-$default}"
}

# Configuration des variables critiques
configure_critical_vars() {
    log_info "Configuration des variables CRITIQUES..."
    echo ""
    
    # Base de données
    DATABASE_URL=$(ask_value "URL de connexion Supabase (DATABASE_URL)" "postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" "true")
    SUPABASE_URL=$(ask_value "URL du projet Supabase (SUPABASE_URL)" "https://wnugqzgzzwmebjjsfrns.supabase.co" "true")
    SUPABASE_ANON_KEY=$(ask_value "Clé anonyme Supabase (SUPABASE_ANON_KEY)" "" "true")
    
    echo ""
    
    # Meta API
    META_APP_ID=$(ask_value "ID de l'application Meta (META_APP_ID)" "" "true")
    META_APP_SECRET=$(ask_value "Secret de l'application Meta (META_APP_SECRET)" "" "true")
    META_ACCESS_TOKEN=$(ask_value "Token d'accès Meta (META_ACCESS_TOKEN)" "" "true")
    META_AD_ACCOUNT_ID=$(ask_value "ID du compte publicitaire Meta (META_AD_ACCOUNT_ID)" "act_123456789" "true")
    
    echo ""
    
    # Sécurité
    JWT_SECRET=$(ask_value "Clé secrète JWT (JWT_SECRET) - minimum 32 caractères" "" "true")
    API_KEY_HASH=$(ask_value "Hash de la clé API (API_KEY_HASH)" "" "false")
}

# Configuration des variables importantes
configure_important_vars() {
    log_info "Configuration des variables IMPORTANTES..."
    echo ""
    
    # Serveur
    NODE_ENV=$(ask_value "Environnement Node.js (NODE_ENV)" "production" "false")
    PORT=$(ask_value "Port du serveur (PORT)" "3001" "false")
    
    # CORS
    CORS_ORIGIN=$(ask_value "Origine CORS autorisée (CORS_ORIGIN)" "https://scout-interest.vercel.app" "false")
    FRONTEND_URL=$(ask_value "URL du frontend (FRONTEND_URL)" "https://scout-interest.vercel.app" "false")
    
    # Performance
    COMPRESSION_LEVEL=$(ask_value "Niveau de compression (COMPRESSION_LEVEL)" "6" "false")
    RATE_LIMIT_MAX_REQUESTS=$(ask_value "Limite de requêtes par IP (RATE_LIMIT_MAX_REQUESTS)" "200" "false")
}

# Configuration des variables optionnelles
configure_optional_vars() {
    log_info "Configuration des variables OPTIONNELLES..."
    echo ""
    
    # Meta API avancée
    META_API_ENVIRONMENT=$(ask_value "Environnement Meta API (META_API_ENVIRONMENT)" "production" "false")
    META_RATE_LIMIT_CALLS_PER_HOUR=$(ask_value "Limite d'appels Meta API par heure" "500" "false")
    
    # Frontend
    REACT_APP_ENABLE_ANALYTICS=$(ask_value "Activer les analytics frontend (REACT_APP_ENABLE_ANALYTICS)" "true" "false")
    REACT_APP_ENABLE_PERFORMANCE_MONITORING=$(ask_value "Activer le monitoring de performance (REACT_APP_ENABLE_PERFORMANCE_MONITORING)" "true" "false")
}

# Générer le fichier .env.local
generate_env_file() {
    log_info "Génération du fichier .env.local..."
    
    cat > .env.local << EOF
# 🌍 Variables d'Environnement Production - Scout Interest Vercel
# Généré automatiquement le $(date)

# =============================================================================
# 🔴 VARIABLES CRITIQUES (OBLIGATOIRES)
# =============================================================================

# Base de Données Supabase
DATABASE_URL=$DATABASE_URL
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Meta API Configuration
META_APP_ID=$META_APP_ID
META_APP_SECRET=$META_APP_SECRET
META_ACCESS_TOKEN=$META_ACCESS_TOKEN
META_AD_ACCOUNT_ID=$META_AD_ACCOUNT_ID
META_API_VERSION=v18.0

# Sécurité
JWT_SECRET=$JWT_SECRET
API_KEY_HASH=$API_KEY_HASH

# =============================================================================
# 🟡 VARIABLES IMPORTANTES (Recommandées)
# =============================================================================

# Configuration Serveur
NODE_ENV=$NODE_ENV
PORT=$PORT

# CORS Configuration
CORS_ORIGIN=$CORS_ORIGIN
FRONTEND_URL=$FRONTEND_URL

# Performance et Rate Limiting
COMPRESSION_LEVEL=$COMPRESSION_LEVEL
RATE_LIMIT_MAX_REQUESTS=$RATE_LIMIT_MAX_REQUESTS
META_RATE_LIMIT_CALLS_PER_HOUR=$META_RATE_LIMIT_CALLS_PER_HOUR

# =============================================================================
# 🟢 VARIABLES OPTIONNELLES (Améliorations)
# =============================================================================

# Meta API Avancée
META_API_ENVIRONMENT=$META_API_ENVIRONMENT

# Frontend Configuration
REACT_APP_ENABLE_ANALYTICS=$REACT_APP_ENABLE_ANALYTICS
REACT_APP_ENABLE_PERFORMANCE_MONITORING=$REACT_APP_ENABLE_PERFORMANCE_MONITORING

# =============================================================================
# 📝 CONFIGURATION AUTOMATIQUE
# =============================================================================

# Upload et Fichiers
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,xls,csv

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
META_RATE_LIMIT_RETRY_DELAY=3000

# Cache et Compression
CACHE_CONTROL_MAX_AGE=3600

# Configuration Avancée
QUEUE_CONCURRENCY=10
QUEUE_BATCH_SIZE=20
LOG_LEVEL=info
LOG_FILE=./logs/app.log
BCRYPT_ROUNDS=12

# Frontend Build
REACT_APP_API_URL=$CORS_ORIGIN/api
REACT_APP_ENV=production
REACT_APP_META_AD_ACCOUNT_ID=$META_AD_ACCOUNT_ID
GENERATE_SOURCEMAP=false
REACT_APP_DISABLE_ESLINT_PLUGIN=true
EOF

    log_success "Fichier .env.local généré avec succès !"
}

# Instructions pour Vercel
show_vercel_instructions() {
    log_info "Instructions pour configurer Vercel..."
    echo ""
    echo "🌐 Allez sur https://vercel.com"
    echo "📁 Sélectionnez votre projet 'scout-interest'"
    echo "⚙️  Allez dans Settings > Environment Variables"
    echo "➕ Ajoutez chaque variable une par une :"
    echo ""
    
    # Afficher les variables critiques
    echo "🔴 Variables CRITIQUES (à configurer en premier) :"
    echo "   DATABASE_URL=$DATABASE_URL"
    echo "   SUPABASE_URL=$SUPABASE_URL"
    echo "   SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY"
    echo "   META_APP_ID=$META_APP_ID"
    echo "   META_APP_SECRET=$META_APP_SECRET"
    echo "   META_ACCESS_TOKEN=$META_ACCESS_TOKEN"
    echo "   JWT_SECRET=$JWT_SECRET"
    echo ""
    
    echo "🟡 Variables IMPORTANTES :"
    echo "   CORS_ORIGIN=$CORS_ORIGIN"
    echo "   FRONTEND_URL=$FRONTEND_URL"
    echo "   NODE_ENV=$NODE_ENV"
    echo ""
    
    echo "✅ IMPORTANT : Cochez 'Production' pour chaque variable !"
    echo ""
}

# Validation des variables
validate_variables() {
    log_info "Validation des variables d'environnement..."
    
    local errors=0
    
    # Vérifier les variables critiques
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL est manquante"
        ((errors++))
    fi
    
    if [ -z "$META_APP_ID" ]; then
        log_error "META_APP_ID est manquante"
        ((errors++))
    fi
    
    if [ -z "$META_ACCESS_TOKEN" ]; then
        log_error "META_ACCESS_TOKEN est manquante"
        ((errors++))
    fi
    
    if [ ${#JWT_SECRET} -lt 32 ]; then
        log_error "JWT_SECRET doit faire au moins 32 caractères (actuel: ${#JWT_SECRET})"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Toutes les variables critiques sont valides !"
        return 0
    else
        log_error "$errors erreur(s) détectée(s)"
        return 1
    fi
}

# Fonction principale
main() {
    echo "🚀 Configuration des Variables d'Environnement Vercel"
    echo "=================================================="
    echo ""
    
    # Configuration des variables
    configure_critical_vars
    echo ""
    
    configure_important_vars
    echo ""
    
    configure_optional_vars
    echo ""
    
    # Validation
    if validate_variables; then
        # Générer le fichier
        generate_env_file
        echo ""
        
        # Instructions Vercel
        show_vercel_instructions
        
        log_success "Configuration terminée !"
        echo ""
        echo "📋 Prochaines étapes :"
        echo "1. Configurez les variables dans Vercel"
        echo "2. Déployez avec : ./deploy-vercel.sh full"
        echo "3. Testez avec : curl https://scout-interest.vercel.app/api/health"
    else
        log_error "Configuration incomplète. Veuillez corriger les erreurs."
        exit 1
    fi
}

# Exécuter le script
main "$@"

