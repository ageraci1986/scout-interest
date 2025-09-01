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
CORS_ORIGIN=https://your-project.vercel.app

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
    log_info "Instructions pour déploiement complet:"
    echo "1. Allez sur https://vercel.com"
    echo "2. Cliquez 'New Project'"
    echo "3. Importez votre repo GitHub"
    echo "4. Configurez:"
    echo "   - Framework: Other"
    echo "   - Root Directory: / (racine)"
    echo "   - Build Command: cd frontend && npm run build"
    echo "   - Output Directory: frontend/build"
    echo "5. Ajoutez les variables d'environnement"
    echo "6. Déployez"
    
    cd ..
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
        *)
            log_error "Usage: $0 [frontend|backend|both]"
            exit 1
            ;;
    esac
    
    log_success "Déploiement terminé !"
    log_info "N'oubliez pas de:"
    echo "1. Configurer les variables d'environnement"
    echo "2. Mettre à jour les URLs dans les configurations"
    echo "3. Tester l'application après déploiement"
}

# Exécuter le script
main "$@"
