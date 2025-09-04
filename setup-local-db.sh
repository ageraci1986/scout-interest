#!/bin/bash

echo "🐳 Configuration de la base de données PostgreSQL locale avec Docker..."

# Variables
DB_NAME="scout_interest_db"
DB_USER="scout_user"
DB_PASSWORD="scout_password"
CONTAINER_NAME="scout-postgres"

# Vérifier si Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Arrêter et supprimer le conteneur s'il existe déjà
echo "🧹 Nettoyage des conteneurs existants..."
docker stop $CONTAINER_NAME 2>/dev/null
docker rm $CONTAINER_NAME 2>/dev/null

# Créer et démarrer le conteneur PostgreSQL
echo "🚀 Démarrage de PostgreSQL..."
docker run --name $CONTAINER_NAME \
    -e POSTGRES_DB=$DB_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -p 5432:5432 \
    -d postgres:13

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente du démarrage de PostgreSQL..."
sleep 5

# Vérifier que PostgreSQL est accessible
if docker exec $CONTAINER_NAME pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
    echo "✅ PostgreSQL est prêt !"
    echo ""
    echo "📝 Configuration de la base de données :"
    echo "  - Nom de la base : $DB_NAME"
    echo "  - Utilisateur : $DB_USER"
    echo "  - Mot de passe : $DB_PASSWORD"
    echo "  - Port : 5432"
    echo ""
    echo "🔧 Pour se connecter :"
    echo "  psql -h localhost -U $DB_USER -d $DB_NAME"
    echo ""
else
    echo "❌ Erreur : PostgreSQL n'a pas démarré correctement"
    exit 1
fi

# Créer le fichier .env.local pour le backend
echo "📝 Création du fichier .env.local pour le backend..."
cat > backend/.env.local << EOL
# Configuration de la base de données locale
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Configuration de l'environnement
NODE_ENV=development
PORT=3001

# Configuration Meta API (à remplacer par vos valeurs)
META_ACCESS_TOKEN=your_meta_access_token
META_AD_ACCOUNT_ID=your_ad_account_id

# Configuration JWT
JWT_SECRET=local_development_secret
EOL

echo "✅ Fichier .env.local créé dans le dossier backend"
echo ""
echo "🎉 Configuration locale terminée !"
echo "💡 Vous pouvez maintenant démarrer l'application avec ./start-local.sh"

