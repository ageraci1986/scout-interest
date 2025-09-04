#!/bin/bash

# 🔧 Mise à Jour des Variables d'Environnement Vercel
# Script pour remplacer les valeurs factices par des valeurs réelles

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

# Supprimer et recréer les variables critiques
update_critical_vars() {
    log_info "Mise à jour des variables CRITIQUES..."
    
    # DATABASE_URL - Demander le mot de passe Supabase
    log_info "Configuration DATABASE_URL..."
    echo "🔴 Entrez votre mot de passe Supabase :"
    read -s SUPABASE_PASSWORD
    echo
    
    # Supprimer l'ancienne variable
    vercel env rm DATABASE_URL production
    
    # Créer la nouvelle avec le vrai mot de passe
    vercel env add DATABASE_URL production <<< "postgresql://postgres.wnugqzgzzwmebjjsfrns:${SUPABASE_PASSWORD}@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
    
    # META_APP_ID - Demander l'ID réel
    log_info "Configuration META_APP_ID..."
    echo "🔴 Entrez votre META_APP_ID réel :"
    read META_APP_ID
    
    # Supprimer l'ancienne variable
    vercel env rm META_APP_ID production
    
    # Créer la nouvelle
    vercel env add META_APP_ID production <<< "$META_APP_ID"
    
    # META_ACCESS_TOKEN - Demander le token réel
    log_info "Configuration META_ACCESS_TOKEN..."
    echo "🔴 Entrez votre META_ACCESS_TOKEN réel :"
    read -s META_ACCESS_TOKEN
    echo
    
    # Supprimer l'ancienne variable
    vercel env rm META_ACCESS_TOKEN production
    
    # Créer la nouvelle
    vercel env add META_ACCESS_TOKEN production <<< "$META_ACCESS_TOKEN"
    
    # JWT_SECRET - Générer une clé sécurisée
    log_info "Configuration JWT_SECRET..."
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Supprimer l'ancienne variable
    vercel env rm JWT_SECRET production
    
    # Créer la nouvelle
    vercel env add JWT_SECRET production <<< "$JWT_SECRET"
    
    log_success "Variables CRITIQUES mises à jour !"
}

# Mettre à jour les variables importantes
update_important_vars() {
    log_info "Mise à jour des variables IMPORTANTES..."
    
    # SUPABASE_ANON_KEY - Demander la clé réelle
    log_info "Configuration SUPABASE_ANON_KEY..."
    echo "🟡 Entrez votre SUPABASE_ANON_KEY réelle :"
    read -s SUPABASE_ANON_KEY
    echo
    
    # Supprimer l'ancienne variable
    vercel env rm SUPABASE_ANON_KEY production
    
    # Créer la nouvelle
    vercel env add SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
    
    log_success "Variables IMPORTANTES mises à jour !"
}

# Vérifier les variables mises à jour
verify_updated_vars() {
    log_info "Vérification des variables mises à jour..."
    vercel env ls
}

# Redéploiement du backend
redeploy_backend() {
    log_info "Redéploiement du backend avec les nouvelles variables..."
    vercel --prod
}

# Test de l'API
test_api() {
    log_info "Test de l'API après mise à jour..."
    
    # Attendre un peu que le déploiement soit terminé
    log_info "Attente de 30 secondes pour le déploiement..."
    sleep 30
    
    # Test Health Check
    log_info "Test Health Check..."
    if response=$(curl -s "https://scout-interest-optimized-civ0e1kf5-angelo-geracis-projects.vercel.app/health" 2>/dev/null); then
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

# Menu principal
main() {
    echo "🔧 Mise à Jour des Variables d'Environnement Vercel"
    echo "=================================================="
    echo
    
    log_warning "⚠️  ATTENTION: Ce script va remplacer les variables existantes"
    echo "Assurez-vous d'avoir vos vraies valeurs à portée de main"
    echo
    
    read -p "Continuer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Opération annulée"
        exit 0
    fi
    
    update_critical_vars
    update_important_vars
    verify_updated_vars
    redeploy_backend
    test_api
    
    log_success "Mise à jour terminée !"
}

# Exécution
main "$@"

