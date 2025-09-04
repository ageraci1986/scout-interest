#!/bin/bash

# 🚀 Script de Déploiement Backend Vercel - Scout Interest
# Déploiement backend uniquement avec configuration optimisée

set -e

echo "🚀 Déploiement Backend Vercel - Scout Interest"
echo "==============================================="

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

# Préparer le backend
prepare_backend() {
    log_info "Préparation du backend..."
    
    cd backend
    
    # Installer les dépendances de production
    log_info "Installation des dépendances de production..."
    npm run vercel-build
    
    log_success "Backend prêt pour le déploiement"
    cd ..
}

# Vérifier les variables d'environnement
check_env_vars() {
    log_info "Vérification des variables d'environnement..."
    
    log_warning "IMPORTANT: Assurez-vous que ces variables sont configurées dans Vercel :"
    echo ""
    echo "🔴 Variables CRITIQUES :"
    echo "   DATABASE_URL - Connexion Supabase production"
    echo "   META_APP_ID - ID application Meta"
    echo "   META_ACCESS_TOKEN - Token d'accès Meta"
    echo "   JWT_SECRET - Clé JWT sécurisée"
    echo ""
    echo "🟡 Variables IMPORTANTES :"
    echo "   SUPABASE_URL - URL projet Supabase"
    echo "   SUPABASE_ANON_KEY - Clé anonyme Supabase"
    echo "   CORS_ORIGIN - Origine CORS autorisée"
    echo ""
    echo "✅ Toutes les variables doivent être marquées 'Production' dans Vercel"
    echo ""
    
    read -p "Appuyez sur Entrée pour continuer après avoir configuré les variables..."
}

# Déployer le backend
deploy_backend() {
    log_info "Déploiement du backend sur Vercel..."
    
    # Vérifier si on est connecté à Vercel
    if ! vercel whoami &> /dev/null; then
        log_info "Connexion à Vercel..."
        vercel login
    fi
    
    # Sauvegarder la configuration actuelle
    log_info "Sauvegarde de la configuration actuelle..."
    cp vercel.json vercel.json.backup
    
    # Utiliser la configuration backend uniquement
    log_info "Configuration pour déploiement backend uniquement..."
    cp vercel-backend-only.json vercel.json
    
    # Déployer
    log_info "Déploiement en cours..."
    vercel --prod --name scout-interest-backend
    
    # Restaurer la configuration
    log_info "Restauration de la configuration..."
    mv vercel.json.backup vercel.json
    
    log_success "Déploiement backend terminé !"
}

# Tester le déploiement
test_deployment() {
    log_info "Test du déploiement backend..."
    
    log_info "URLs à tester:"
    echo "- Backend API: https://scout-interest-backend.vercel.app/api/*"
    echo "- Health Check: https://scout-interest-backend.vercel.app/health"
    echo "- Test Projects: https://scout-interest-backend.vercel.app/api/test-projects"
    echo ""
    
    log_info "Tests recommandés:"
    echo "1. Test de l'endpoint /health"
    echo "2. Test de l'endpoint /api/test-projects"
    echo "3. Vérification de la connexion Supabase"
    echo "4. Test de l'API Meta"
}

# Instructions de configuration
show_config_instructions() {
    log_info "Configuration des variables d'environnement dans Vercel..."
    echo ""
    echo "🌐 Allez sur https://vercel.com"
    echo "📁 Sélectionnez votre projet 'scout-interest-backend'"
    echo "⚙️  Allez dans Settings > Environment Variables"
    echo "➕ Ajoutez chaque variable une par une :"
    echo ""
    
    echo "🔴 Variables CRITIQUES (à configurer en premier) :"
    echo "   DATABASE_URL=postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
    echo "   META_APP_ID=votre_app_id"
    echo "   META_ACCESS_TOKEN=votre_access_token"
    echo "   JWT_SECRET=votre_jwt_secret_32_caracteres"
    echo ""
    
    echo "🟡 Variables IMPORTANTES :"
    echo "   SUPABASE_URL=https://wnugqzgzzwmebjjsfrns.supabase.co"
    echo "   SUPABASE_ANON_KEY=votre_supabase_anon_key"
    echo "   CORS_ORIGIN=https://scout-interest-frontend.vercel.app"
    echo ""
    
    echo "✅ IMPORTANT : Cochez 'Production' pour chaque variable !"
    echo ""
}

# Fonction principale
main() {
    check_prerequisites
    
    prepare_backend
    
    check_env_vars
    
    deploy_backend
    
    test_deployment
    
    show_config_instructions
    
    log_success "Déploiement backend terminé avec succès !"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "1. Configurez les variables d'environnement dans Vercel"
    echo "2. Testez les endpoints backend"
    echo "3. Intégrez avec le frontend déployé"
    echo "4. Testez l'application complète"
    echo ""
    echo "🌐 Backend: https://scout-interest-backend.vercel.app"
    echo "🔗 Frontend: https://scout-interest-frontend.vercel.app"
}

# Exécuter le script
main "$@"

