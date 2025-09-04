#!/bin/bash

# 🚀 Configuration Automatique des Variables d'Environnement Vercel
# Script non-interactif pour Scout Interest

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
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

# Vérifier que Vercel CLI est installé
check_vercel_cli() {
    log_info "Vérification de Vercel CLI..."
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI n'est pas installé. Installation..."
        npm install -g vercel
    else
        log_success "Vercel CLI est installé"
    fi
}

# Vérifier la connexion Vercel
check_vercel_auth() {
    log_info "Vérification de l'authentification Vercel..."
    if ! vercel whoami &> /dev/null; then
        log_warning "Connexion Vercel requise..."
        vercel login
    else
        log_success "Authentifié sur Vercel"
    fi
}

# Configuration des variables d'environnement
setup_env_vars() {
    log_info "Configuration des variables d'environnement..."
    
    # Variables CRITIQUES
    log_info "Ajout des variables CRITIQUES..."
    
    # DATABASE_URL
    log_info "Configuration DATABASE_URL..."
    vercel env add DATABASE_URL production <<< "postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
    
    # META_APP_ID
    log_info "Configuration META_APP_ID..."
    vercel env add META_APP_ID production <<< "your_meta_app_id_here"
    
    # META_ACCESS_TOKEN
    log_info "Configuration META_ACCESS_TOKEN..."
    vercel env add META_ACCESS_TOKEN production <<< "your_meta_access_token_here"
    
    # JWT_SECRET
    log_info "Configuration JWT_SECRET..."
    vercel env add JWT_SECRET production <<< "your_super_secret_jwt_key_here_production_32_chars_min"
    
    # Variables IMPORTANTES
    log_info "Ajout des variables IMPORTANTES..."
    
    # SUPABASE_URL
    log_info "Configuration SUPABASE_URL..."
    vercel env add SUPABASE_URL production <<< "https://wnugqzgzzwmebjjsfrns.supabase.co"
    
    # SUPABASE_ANON_KEY
    log_info "Configuration SUPABASE_ANON_KEY..."
    vercel env add SUPABASE_ANON_KEY production <<< "your_supabase_anon_key_here"
    
    # CORS_ORIGIN
    log_info "Configuration CORS_ORIGIN..."
    vercel env add CORS_ORIGIN production <<< "https://scout-interest-optimized-9okd7av0b-angelo-geracis-projects.vercel.app"
    
    # NODE_ENV
    log_info "Configuration NODE_ENV..."
    vercel env add NODE_ENV production <<< "production"
    
    log_success "Toutes les variables d'environnement ont été configurées !"
}

# Vérifier les variables configurées
verify_env_vars() {
    log_info "Vérification des variables configurées..."
    vercel env ls
}

# Redéploiement du backend
redeploy_backend() {
    log_info "Redéploiement du backend avec les nouvelles variables..."
    vercel --prod
}

# Test de l'API
test_api() {
    log_info "Test de l'API après configuration..."
    
    # Attendre un peu que le déploiement soit terminé
    log_info "Attente de 30 secondes pour le déploiement..."
    sleep 30
    
    # Test Health Check
    log_info "Test Health Check..."
    if response=$(curl -s "https://scout-interest-optimized-lz2yigpg2-angelo-geracis-projects.vercel.app/health" 2>/dev/null); then
        if echo "$response" | grep -q "status.*OK"; then
            log_success "Health Check: OK"
            echo "   Réponse: $response" | head -3
        else
            log_warning "Health Check: Réponse inattendue"
            echo "   Réponse: $response" | head -3
        fi
    else
        log_error "Health Check: Échec"
    fi
}

# Instructions post-configuration
show_instructions() {
    echo
    log_info "📋 Instructions Post-Configuration"
    echo "===================================="
    echo
    echo "🔴 IMPORTANT: Vous devez modifier manuellement certaines variables :"
    echo
    echo "1. DATABASE_URL: Remplacez [YOUR-PASSWORD] par votre mot de passe Supabase"
    echo "2. META_APP_ID: Remplacez par votre véritable ID d'application Meta"
    echo "3. META_ACCESS_TOKEN: Remplacez par votre véritable token d'accès Meta"
    echo "4. SUPABASE_ANON_KEY: Remplacez par votre véritable clé anonyme Supabase"
    echo "5. JWT_SECRET: Remplacez par une clé JWT sécurisée de 32+ caractères"
    echo
    echo "🔧 Pour modifier une variable :"
    echo "   vercel env rm VARIABLE_NAME production"
    echo "   vercel env add VARIABLE_NAME production"
    echo
    echo "🧪 Pour tester l'API :"
    echo "   ./test-api.sh"
    echo
    echo "📚 Documentation disponible :"
    echo "   - QUICK_ENV_SETUP.md - Configuration rapide"
    echo "   - COMPLETE_ENV_VARIABLES.md - Variables complètes"
}

# Menu principal
main() {
    echo "🚀 Configuration Automatique des Variables Vercel"
    echo "================================================="
    echo
    
    check_vercel_cli
    check_vercel_auth
    setup_env_vars
    verify_env_vars
    redeploy_backend
    test_api
    show_instructions
    
    log_success "Configuration terminée !"
}

# Exécution
main "$@"

