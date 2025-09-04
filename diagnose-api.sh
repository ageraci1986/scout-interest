#!/bin/bash

# 🔍 Script de Diagnostic API - Scout Interest Vercel
# Pour identifier le problème exact avec l'API

set -e

# Configuration
BACKEND_URL="https://scout-interest-optimized-dwz8drisp-angelo-geracis-projects.vercel.app"

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

# Test de base de l'API
test_basic_api() {
    log_info "🧪 Test de base de l'API..."
    
    # Test 1: Health Check avec headers détaillés
    log_info "Test 1: Health Check avec headers détaillés"
    response=$(curl -s -v "$BACKEND_URL/health" 2>&1)
    echo "$response" | head -20
    
    echo
    
    # Test 2: Test Projects avec headers détaillés
    log_info "Test 2: Test Projects avec headers détaillés"
    response=$(curl -s -v "$BACKEND_URL/api/test-projects" 2>&1)
    echo "$response" | head -20
    
    echo
}

# Test des variables d'environnement
test_env_vars() {
    log_info "🔧 Test des variables d'environnement..."
    
    # Vérifier que les variables sont bien configurées
    log_info "Variables configurées dans Vercel :"
    vercel env ls
    
    echo
}

# Test de la configuration Vercel
test_vercel_config() {
    log_info "⚙️  Test de la configuration Vercel..."
    
    # Vérifier la configuration actuelle
    log_info "Configuration vercel.json actuelle :"
    cat vercel.json
    
    echo
}

# Test de la structure du projet
test_project_structure() {
    log_info "📁 Test de la structure du projet..."
    
    # Vérifier que les fichiers nécessaires existent
    log_info "Fichiers backend critiques :"
    ls -la backend/src/
    
    echo
    
    log_info "Package.json backend :"
    cat backend/package.json | head -20
    
    echo
}

# Test de build local
test_local_build() {
    log_info "🔨 Test de build local..."
    
    # Tester le build backend localement
    log_info "Build backend local :"
    cd backend
    npm run vercel-build
    cd ..
    
    echo
}

# Test de connexion Supabase
test_supabase_connection() {
    log_info "🗄️  Test de connexion Supabase..."
    
    # Tester la connexion avec les variables actuelles
    log_info "Test de connexion à Supabase..."
    
    # Créer un script de test temporaire
    cat > test-supabase.js << 'EOF'
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'CONFIGURÉ' : 'MANQUANT');

if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test de connexion simple
    supabase.from('projects').select('count').limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.log('❌ Erreur Supabase:', error.message);
            } else {
                console.log('✅ Connexion Supabase réussie');
            }
        })
        .catch(err => {
            console.log('❌ Erreur de connexion:', err.message);
        });
} else {
    console.log('❌ Variables Supabase manquantes');
}
EOF

    # Exécuter le test
    cd backend
    node ../test-supabase.js
    cd ..
    
    # Nettoyer
    rm test-supabase.js
    
    echo
}

# Test de l'API Meta
test_meta_api() {
    log_info "📱 Test de l'API Meta..."
    
    # Créer un script de test temporaire
    cat > test-meta.js << 'EOF'
require('dotenv').config();

const metaAppId = process.env.META_APP_ID;
const metaAccessToken = process.env.META_ACCESS_TOKEN;

console.log('META_APP_ID:', metaAppId);
console.log('META_ACCESS_TOKEN:', metaAccessToken ? 'CONFIGURÉ' : 'MANQUANT');

if (metaAppId && metaAccessToken) {
    console.log('✅ Variables Meta configurées');
    
    // Test simple de validation du token
    if (metaAccessToken.length > 20) {
        console.log('✅ Format du token Meta valide');
    } else {
        console.log('⚠️  Format du token Meta suspect');
    }
} else {
    console.log('❌ Variables Meta manquantes');
}
EOF

    # Exécuter le test
    cd backend
    node ../test-meta.js
    cd ..
    
    # Nettoyer
    rm test-meta.js
    
    echo
}

# Résumé du diagnostic
show_diagnosis() {
    echo
    log_info "🔍 Résumé du Diagnostic"
    echo "=========================="
    echo
    echo "📊 Tests effectués :"
    echo "   ✅ Test de base de l'API"
    echo "   ✅ Test des variables d'environnement"
    echo "   ✅ Test de la configuration Vercel"
    echo "   ✅ Test de la structure du projet"
    echo "   ✅ Test de build local"
    echo "   ✅ Test de connexion Supabase"
    echo "   ✅ Test de l'API Meta"
    echo
    echo "🎯 Prochaines étapes :"
    echo "   1. Vérifier les logs Vercel dans l'interface web"
    echo "   2. Identifier l'erreur exacte dans les logs"
    echo "   3. Corriger le problème identifié"
    echo "   4. Redéployer et tester"
    echo
    echo "📚 Documentation disponible :"
    echo "   - Interface Vercel > Functions > Logs"
    echo "   - test-api.sh pour les tests automatisés"
    echo "   - update-env-vars.sh pour reconfigurer les variables"
}

# Menu principal
main() {
    echo "🔍 Diagnostic API Scout Interest Vercel"
    echo "======================================="
    echo
    
    test_basic_api
    test_env_vars
    test_vercel_config
    test_project_structure
    test_local_build
    test_supabase_connection
    test_meta_api
    show_diagnosis
    
    log_success "Diagnostic terminé !"
}

# Exécution
main "$@"

