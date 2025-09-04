#!/bin/bash

# 🚀 Script de Déploiement Vercel Optimisé - Scout Interest
# Usage: ./deploy-vercel.sh [frontend|backend|both|full]

set -e

echo "🚀 Démarrage du déploiement Vercel optimisé..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration du projet
PROJECT_NAME="scout-interest"
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

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

# Vérifier les prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    # Vérifier Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI n'est pas installé"
        log_info "Installation de Vercel CLI..."
        npm install -g vercel
    fi
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Préparer le frontend
prepare_frontend() {
    log_info "Préparation du frontend..."
    
    cd $FRONTEND_DIR
    
    # Installer les dépendances
    log_info "Installation des dépendances frontend..."
    npm install
    
    # Tester le build
    log_info "Test du build frontend..."
    npm run build:vercel
    
    log_success "Frontend prêt pour le déploiement"
    cd ..
}

# Préparer le backend
prepare_backend() {
    log_info "Préparation du backend..."
    
    cd $BACKEND_DIR
    
    # Installer les dépendances de production
    log_info "Installation des dépendances backend..."
    npm run vercel-build
    
    log_success "Backend prêt pour le déploiement"
    cd ..
}

# Déployer avec Vercel CLI
deploy_vercel() {
    log_info "Déploiement avec Vercel CLI..."
    
    # Vérifier si on est connecté à Vercel
    if ! vercel whoami &> /dev/null; then
        log_info "Connexion à Vercel..."
        vercel login
    fi
    
    # Déployer le projet
    log_info "Déploiement du projet: ${PROJECT_NAME}"
    vercel --prod --name ${PROJECT_NAME}
    
    log_success "Déploiement terminé !"
}

# Configuration des variables d'environnement
setup_env_vars() {
    log_info "Configuration des variables d'environnement..."
    
    log_warning "IMPORTANT: Configurez ces variables dans Vercel:"
    echo ""
    echo "Variables REQUISES:"
    echo "DATABASE_URL=postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
    echo "META_APP_ID=votre_app_id"
    echo "META_APP_SECRET=votre_app_secret"
    echo "META_ACCESS_TOKEN=votre_access_token"
    echo "META_AD_ACCOUNT_ID=votre_ad_account_id"
    echo "JWT_SECRET=votre_jwt_secret"
    echo ""
    echo "Variables OPTIONNELLES:"
    echo "SUPABASE_URL=votre_supabase_url"
    echo "SUPABASE_ANON_KEY=votre_supabase_key"
    echo "CORS_ORIGIN=https://scout-interest.vercel.app"
    echo ""
}

# Test du déploiement
test_deployment() {
    log_info "Test du déploiement..."
    
    log_info "URLs à tester:"
    echo "- Frontend: https://${PROJECT_NAME}.vercel.app"
    echo "- Backend API: https://${PROJECT_NAME}.vercel.app/api/health"
    echo "- Test Projects: https://${PROJECT_NAME}.vercel.app/api/test-projects"
    echo ""
    
    log_info "Tests recommandés:"
    echo "1. Vérifier que l'interface se charge"
    echo "2. Tester l'endpoint /api/health"
    echo "3. Vérifier la connexion à Supabase"
    echo "4. Tester l'upload de fichiers"
}

# Fonction principale
main() {
    check_prerequisites
    
    case "${1:-full}" in
        "frontend")
            prepare_frontend
            ;;
        "backend")
            prepare_backend
            ;;
        "both")
            prepare_frontend
            prepare_backend
            ;;
        "full")
            prepare_frontend
            prepare_backend
            deploy_vercel
            setup_env_vars
            test_deployment
            ;;
        *)
            log_error "Usage: $0 [frontend|backend|both|full]"
            exit 1
            ;;
    esac
    
    log_success "Opération terminée !"
    log_info "Prochaines étapes:"
    echo "1. Configurez les variables d'environnement dans Vercel"
    echo "2. Testez l'application déployée"
    echo "3. Vérifiez les logs dans l'interface Vercel"
    echo "4. URL finale: https://${PROJECT_NAME}.vercel.app"
}

# Exécuter le script
main "$@"

