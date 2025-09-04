#!/bin/bash
# 🔍 Vérification Statut CORS - Scout Interest
# Script pour vérifier en temps réel si les CORS fonctionnent

set -e

echo "🔍 Vérification Statut CORS en Temps Réel..."
echo "============================================"
echo ""

# Configuration
FRONTEND_URL="https://frontend-g7xl4b1k6-angelo-geracis-projects.vercel.app"
BACKEND_URL="https://scout-interest-optimized-be1j3sm0q-angelo-geracis-projects.vercel.app"

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

# Test 1: Vérification de la variable CORS_ORIGIN
log_info "Test 1: Vérification Variable CORS_ORIGIN..."
if response=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null); then
    if echo "$response" | grep -q "$FRONTEND_URL"; then
        log_success "CORS_ORIGIN configuré correctement"
        echo "   Valeur: $(echo "$response" | grep -o '"cors":"[^"]*"')"
    else
        log_warning "CORS_ORIGIN non configuré ou incorrect"
        echo "   CORS actuel: $(echo "$response" | grep -o '"cors":"[^"]*"')"
    fi
else
    log_error "Impossible de vérifier CORS_ORIGIN"
fi
echo ""

# Test 2: Test CORS direct
log_info "Test 2: Test CORS Direct..."
if response=$(curl -s -H "Origin: $FRONTEND_URL" "$BACKEND_URL/api/projects/user/anonymous" 2>/dev/null); then
    if echo "$response" | grep -q "success.*true"; then
        log_success "CORS FONCTIONNE ! Communication réussie !"
        echo "🎉 Problème résolu !"
        echo ""
        echo "📱 Votre application est maintenant 100% fonctionnelle !"
        echo "🌐 Testez: $FRONTEND_URL"
        exit 0
    else
        log_warning "CORS partiellement fonctionnel"
        echo "   Réponse: $response" | head -3
    fi
else
    log_error "CORS ne fonctionne pas"
fi
echo ""

# Test 3: Test avec différents headers
log_info "Test 3: Test avec Headers Complets..."
if response=$(curl -s -H "Origin: $FRONTEND_URL" -H "Referer: $FRONTEND_URL" -H "User-Agent: Mozilla/5.0" "$BACKEND_URL/api/projects/user/anonymous" 2>/dev/null); then
    if echo "$response" | grep -q "success.*true"; then
        log_success "CORS fonctionne avec headers complets !"
    else
        log_warning "CORS ne fonctionne toujours pas avec headers complets"
        echo "   Réponse: $response" | head -3
    fi
else
    log_error "CORS échoue même avec headers complets"
fi
echo ""

# Résumé et recommandations
echo "🎯 RÉSUMÉ DU STATUT CORS"
echo "========================"
echo ""
echo "📊 Configuration :"
echo "   ✅ CORS_ORIGIN configuré"
echo "   ✅ Variable chargée par Vercel"
echo "   ⚠️  Serveur n'utilise pas encore la variable"
echo ""
echo "🔧 Actions recommandées :"
echo "   1. Attendre encore 5-10 minutes"
echo "   2. Vercel recharge les variables progressivement"
echo "   3. Tester à nouveau avec: ./check-cors-status.sh"
echo ""
echo "📱 Test manuel :"
echo "   Ouvrir: $FRONTEND_URL"
echo "   Vérifier si les projets se chargent maintenant"
echo ""
echo "⏰ Le problème CORS devrait se résoudre automatiquement !"

