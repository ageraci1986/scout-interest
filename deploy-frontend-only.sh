#!/bin/bash

# 🚀 Script de Déploiement Frontend Vercel - Scout Interest
# Déploiement frontend uniquement avec configuration optimisée

set -e

echo "🚀 Déploiement Frontend Vercel - Scout Interest"
echo "================================================"

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
    
    # Vérifier Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI n'est pas installé"
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

# Préparer le frontend
prepare_frontend() {
    log_info "Préparation du frontend..."
    
    cd frontend
    
    # Installer les dépendances
    log_info "Installation des dépendances..."
    npm install
    
    # Tester le build
    log_info "Test du build optimisé..."
    npm run build:vercel
    
    log_success "Frontend prêt pour le déploiement"
    cd ..
}

# Déployer le frontend
deploy_frontend() {
    log_info "Déploiement du frontend sur Vercel..."
    
    # Vérifier si on est connecté à Vercel
    if ! vercel whoami &> /dev/null; then
        log_info "Connexion à Vercel..."
        vercel login
    fi
    
    # Sauvegarder la configuration actuelle
    log_info "Sauvegarde de la configuration actuelle..."
    cp vercel.json vercel.json.backup
    
    # Utiliser la configuration frontend uniquement
    log_info "Configuration pour déploiement frontend uniquement..."
    cp vercel-frontend-only.json vercel.json
    
    # Déployer
    log_info "Déploiement en cours..."
    vercel --prod --name scout-interest-frontend
    
    # Restaurer la configuration
    log_info "Restauration de la configuration..."
    mv vercel.json.backup vercel.json
    
    log_success "Déploiement frontend terminé !"
}

# Tester le déploiement
test_deployment() {
    log_info "Test du déploiement frontend..."
    
    log_info "URLs à tester:"
    echo "- Frontend: https://scout-interest-frontend.vercel.app"
    echo "- Assets: https://scout-interest-frontend.vercel.app/static/*"
    echo ""
    
    log_info "Tests recommandés:"
    echo "1. Ouvrir l'URL du frontend dans un navigateur"
    echo "2. Vérifier que l'interface se charge correctement"
    echo "3. Vérifier que les assets (CSS/JS) se chargent"
    echo "4. Tester la navigation entre les pages"
}

# Fonction principale
main() {
    check_prerequisites
    
    prepare_frontend
    
    deploy_frontend
    
    test_deployment
    
    log_success "Déploiement frontend terminé avec succès !"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "1. Testez l'interface frontend"
    echo "2. Configurez les variables d'environnement backend"
    echo "3. Déployez le backend séparément"
    echo "4. Testez l'API complète"
    echo ""
    echo "🌐 Frontend: https://scout-interest-frontend.vercel.app"
}

# Exécuter le script
main "$@"

