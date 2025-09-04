#!/bin/bash
# 🔍 Diagnostic Complet Frontend-Backend
# Script pour identifier le problème exact de communication

set -e

echo "🔍 Diagnostic Complet Frontend-Backend..."
echo "========================================"
echo ""

# Configuration
FRONTEND_URL="https://frontend-g7xl4b1k6-angelo-geracis-projects.vercel.app"
BACKEND_URL="https://scout-interest-optimized-lwolbw6lc-angelo-geracis-projects.vercel.app"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Test 1: Vérification Frontend
log_info "Test 1: Vérification Frontend..."
if response=$(curl -s -I "$FRONTEND_URL" 2>/dev/null); then
    if echo "$response" | grep -q "HTTP/2 200"; then
        log_success "Frontend accessible (HTTP 200)"
    else
        log_warning "Frontend statut inattendu"
        echo "   Statut: $response" | head -1
    fi
else
    log_error "Frontend inaccessible"
fi
echo ""

# Test 2: Vérification Backend
log_info "Test 2: Vérification Backend..."
if response=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null); then
    if echo "$response" | grep -q "status.*OK"; then
        log_success "Backend accessible et fonctionnel"
    else
        log_warning "Backend accessible mais réponse inattendue"
    fi
else
    log_error "Backend inaccessible"
fi
echo ""

# Test 3: Test CORS direct
log_info "Test 3: Test CORS direct..."
if response=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS "$BACKEND_URL/api/projects/user/anonymous" 2>/dev/null); then
    log_success "Requête CORS OPTIONS réussie"
else
    log_warning "Requête CORS OPTIONS échouée"
fi
echo ""

# Test 4: Test API avec Origin
log_info "Test 4: Test API avec Origin..."
if response=$(curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/projects/user/anonymous" 2>/dev/null); then
    if echo "$response" | grep -q "success.*true"; then
        log_success "API accessible avec Origin header"
        echo "   Projets retournés: $(echo "$response" | grep -o '"id":[0-9]*' | wc -l)"
    else
        log_warning "API accessible mais réponse inattendue"
        echo "   Réponse: $response" | head -3
    fi
else
    log_error "API inaccessible avec Origin header"
fi
echo ""

# Test 5: Vérification des variables d'environnement
log_info "Test 5: Vérification CORS_ORIGIN..."
if response=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null); then
    if echo "$response" | grep -q "$FRONTEND_URL"; then
        log_success "CORS_ORIGIN configuré correctement"
    else
        log_warning "CORS_ORIGIN peut ne pas être correct"
        echo "   CORS actuel: $(echo "$response" | grep -o '"cors":"[^"]*"')"
    fi
else
    log_error "Impossible de vérifier CORS_ORIGIN"
fi
echo ""

# Test 6: Test de communication réelle
log_info "Test 6: Test de communication réelle..."
echo "   Simuler une requête depuis le frontend..."
if response=$(curl -s -H "Origin: $FRONTEND_URL" -H "Referer: $FRONTEND_URL" "$BACKEND_URL/api/projects/user/anonymous" 2>/dev/null); then
    if echo "$response" | grep -q "success.*true"; then
        log_success "Communication frontend-backend réussie !"
    else
        log_warning "Communication réussie mais réponse inattendue"
    fi
else
    log_error "Communication frontend-backend échouée"
fi
echo ""

# Résumé et recommandations
echo "🎯 DIAGNOSTIC TERMINÉ"
echo "====================="
echo ""
echo "🌐 URLs de Test :"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "🔧 Actions recommandées :"
echo "   1. Ouvrir le frontend dans le navigateur"
echo "   2. Ouvrir les outils de développement (F12)"
echo "   3. Aller dans l'onglet 'Console'"
echo "   4. Aller dans l'onglet 'Network'"
echo "   5. Recharger la page et observer les erreurs"
echo ""
echo "📱 Test manuel :"
echo "   Ouvrir: $FRONTEND_URL"
echo "   Vérifier la console pour les erreurs exactes"

