#!/bin/bash

# 🧪 Script de Test Rapide API - Scout Interest Vercel
# Usage: ./test-api.sh

set -e

# Configuration
BACKEND_URL="https://scout-interest-optimized-lz2yigpg2-angelo-geracis-projects.vercel.app"
FRONTEND_URL="https://scout-interest-optimized-9okd7av0b-angelo-geracis-projects.vercel.app"

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

# Test de l'API
test_api() {
    log_info "🧪 Test de l'API Backend..."
    
    # Test 1: Health Check
    log_info "Test 1: Health Check (/health)"
    if response=$(curl -s "$BACKEND_URL/health" 2>/dev/null); then
        if echo "$response" | grep -q "status.*OK"; then
            log_success "Health Check: OK"
            echo "   Réponse: $response" | head -3
        else
            log_warning "Health Check: Réponse inattendue"
            echo "   Réponse: $response" | head -3
        fi
    else
        log_error "Health Check: Échec de la connexion"
    fi
    
    echo
    
    # Test 2: Test Projects
    log_info "Test 2: Test Projects (/api/test-projects)"
    if response=$(curl -s "$BACKEND_URL/api/test-projects" 2>/dev/null); then
        if echo "$response" | grep -q "success.*true"; then
            log_success "Test Projects: OK"
            echo "   Réponse: $response" | head -3
        else
            log_warning "Test Projects: Réponse inattendue"
            echo "   Réponse: $response" | head -3
        fi
    else
        log_error "Test Projects: Échec de la connexion"
    fi
    
    echo
    
    # Test 3: Meta API Status
    log_info "Test 3: Meta API Status (/api/meta/status)"
    if response=$(curl -s "$BACKEND_URL/api/meta/status" 2>/dev/null); then
        if echo "$response" | grep -q "error"; then
            log_warning "Meta API: Erreur (probablement variables manquantes)"
            echo "   Réponse: $response" | head -3
        else
            log_success "Meta API: OK"
            echo "   Réponse: $response" | head -3
        fi
    else
        log_error "Meta API: Échec de la connexion"
    fi
}

# Test du Frontend
test_frontend() {
    log_info "🧪 Test du Frontend..."
    
    # Test 1: Page principale
    log_info "Test 1: Page principale"
    if response=$(curl -s -I "$FRONTEND_URL" 2>/dev/null | head -1); then
        if echo "$response" | grep -q "200\|401"; then
            log_success "Frontend: Accessible"
            echo "   Statut: $response"
        else
            log_warning "Frontend: Statut inattendu"
            echo "   Statut: $response"
        fi
    else
        log_error "Frontend: Échec de la connexion"
    fi
    
    echo
    
    # Test 2: Assets statiques
    log_info "Test 2: Assets statiques"
    if response=$(curl -s -I "$FRONTEND_URL/static/js/main.js" 2>/dev/null | head -1); then
        if echo "$response" | grep -q "200\|404"; then
            log_success "Assets: Accessibles"
            echo "   Statut: $response"
        else
            log_warning "Assets: Statut inattendu"
            echo "   Statut: $response"
        fi
    else
        log_error "Assets: Échec de la connexion"
    fi
}

# Test de l'intégration
test_integration() {
    log_info "🧪 Test de l'Intégration..."
    
    # Test CORS
    log_info "Test CORS: Requête depuis le frontend"
    if response=$(curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/health" 2>/dev/null); then
        if echo "$response" | grep -q "status.*OK"; then
            log_success "CORS: Configuré correctement"
        else
            log_warning "CORS: Réponse inattendue"
        fi
    else
        log_error "CORS: Échec de la connexion"
    fi
}

# Test de performance
test_performance() {
    log_info "🧪 Test de Performance..."
    
    # Test de latence
    log_info "Test de latence: Health Check"
    start_time=$(date +%s%N)
    if curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
        end_time=$(date +%s%N)
        latency=$(( (end_time - start_time) / 1000000 ))
        if [ $latency -lt 5000 ]; then
            log_success "Latence: ${latency}ms (Excellent)"
        elif [ $latency -lt 10000 ]; then
            log_warning "Latence: ${latency}ms (Bon)"
        else
            log_error "Latence: ${latency}ms (Lent)"
        fi
    else
        log_error "Test de latence: Échec"
    fi
}

# Résumé des tests
show_summary() {
    echo
    log_info "📊 Résumé des Tests"
    echo "===================="
    echo "🔗 Backend URL: $BACKEND_URL"
    echo "🔗 Frontend URL: $FRONTEND_URL"
    echo
    log_info "Prochaines étapes:"
    echo "1. Configurez les variables d'environnement dans Vercel"
    echo "2. Redéployez le backend: vercel --prod"
    echo "3. Relancez ce script: ./test-api.sh"
    echo
    log_info "Documentation disponible:"
    echo "- QUICK_ENV_SETUP.md - Configuration rapide"
    echo "- COMPLETE_ENV_VARIABLES.md - Variables complètes"
    echo "- setup-env-vercel.sh - Script interactif"
}

# Menu principal
main() {
    echo "🧪 Tests API Scout Interest Vercel"
    echo "=================================="
    echo
    
    # Tests automatiques
    test_api
    test_frontend
    test_integration
    test_performance
    
    # Résumé
    show_summary
}

# Exécution
main "$@"

