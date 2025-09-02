#!/bin/bash

# 🚀 Script de déploiement Scout Interest
# Usage: ./deploy.sh [frontend|backend|both]

set -e

echo "🚀 Démarrage du déploiement Scout Interest..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration du projet
PROJECT_NAME="scout-interest"
FRONTEND_PROJECT_NAME="scout-interest-frontend"
BACKEND_PROJECT_NAME="scout-interest-backend"

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
    
    # Vérifier Git
    if ! command -v git &> /dev/null; then
        log_error "Git n'est pas installé"
        exit 1
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
    
    # Vérifier Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI n'est pas installé"
        log_info "Installation de Vercel CLI..."
        npm install -g vercel
    fi
    
    log_success "Prérequis vérifiés"
}

# Déployer le backend
deploy_backend() {
    log_info "Préparation du backend pour Vercel..."
    
    cd backend
    
    # Vérifier que le fichier .env existe
    if [ ! -f .env ]; then
        log_warning "Fichier .env manquant dans le backend"
        log_info "Création d'un fichier .env.example..."
        cat > .env.example << EOF
# Meta API Configuration
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_ACCESS_TOKEN=your_access_token
META_AD_ACCOUNT_ID=your_ad_account_id

# Database Configuration
DATABASE_URL=your_postgresql_url

# CORS Configuration
CORS_ORIGIN=https://${PROJECT_NAME}.vercel.app

# Environment
NODE_ENV=production
EOF
        log_warning "Veuillez créer un fichier .env avec vos vraies valeurs"
        return 1
    fi
    
    # Installer les dépendances
    log_info "Installation des dépendances..."
    npm install
    
    log_success "Backend prêt pour le déploiement sur Vercel"
    log_info "Nom du projet backend: ${BACKEND_PROJECT_NAME}"
    
    cd ..
}

# Déployer le frontend
deploy_frontend() {
    log_info "Déploiement du frontend..."
    
    cd frontend
    
    # Installer les dépendances
    log_info "Installation des dépendances..."
    npm install
    
    # Tester le build
    log_info "Test du build..."
    npm run build
    
    log_success "Frontend prêt pour le déploiement sur Vercel"
    log_info "Nom du projet frontend: ${FRONTEND_PROJECT_NAME}"
    log_info "Instructions pour déploiement complet:"
    echo "1. Allez sur https://vercel.com"
    echo "2. Cliquez 'New Project'"
    echo "3. Importez votre repo GitHub"
    echo "4. Configurez:"
    echo "   - Framework: Other"
    echo "   - Root Directory: / (racine)"
    echo "   - Build Command: cd frontend && npm run build"
    echo "   - Output Directory: frontend/build"
    echo "   - Project Name: ${PROJECT_NAME}"
    echo "5. Ajoutez les variables d'environnement"
    echo "6. Déployez"
    
    cd ..
}

# Déployer avec Vercel CLI
deploy_with_vercel() {
    log_info "Déploiement avec Vercel CLI..."
    
    # Vérifier si on est connecté à Vercel
    if ! vercel whoami &> /dev/null; then
        log_info "Connexion à Vercel..."
        vercel login
    fi
    
    # Déployer le projet principal
    log_info "Déploiement du projet principal: ${PROJECT_NAME}"
    vercel --prod --name ${PROJECT_NAME}
    
    log_success "Déploiement terminé !"
    log_info "URLs générées:"
    echo "- Frontend: https://${PROJECT_NAME}.vercel.app"
    echo "- Backend API: https://${PROJECT_NAME}.vercel.app/api/*"
    echo "- Health Check: https://${PROJECT_NAME}.vercel.app/api/health"
}

# Fonction principale
main() {
    check_prerequisites
    
    case "${1:-both}" in
        "frontend")
            deploy_frontend
            ;;
        "backend")
            deploy_backend
            ;;
        "both")
            deploy_backend
            echo ""
            deploy_frontend
            ;;
        "vercel")
            deploy_with_vercel
            ;;
        *)
            log_error "Usage: $0 [frontend|backend|both|vercel]"
            exit 1
            ;;
    esac
    
    log_success "Déploiement terminé !"
    log_info "N'oubliez pas de:"
    echo "1. Configurer les variables d'environnement"
    echo "2. Mettre à jour les URLs dans les configurations"
    echo "3. Tester l'application après déploiement"
    echo "4. URL finale: https://${PROJECT_NAME}.vercel.app"
}

# Exécuter le script
main "$@"
