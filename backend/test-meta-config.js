require('dotenv').config();
const metaApi = require('./src/config/meta-api');

async function testMetaConfig() {
  console.log('🔍 Test de la configuration Meta API...\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log(`- META_APP_ID: ${process.env.META_APP_ID ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`- META_APP_SECRET: ${process.env.META_APP_SECRET ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`- META_ACCESS_TOKEN: ${process.env.META_ACCESS_TOKEN ? '✅ Configuré' : '❌ Manquant'}`);
  console.log(`- META_API_VERSION: ${process.env.META_API_VERSION || 'v18.0'}\n`);

  // Test de validation du token
  try {
    console.log('🔐 Test de validation du token...');
    const tokenInfo = await metaApi.validateToken();
    console.log('✅ Token valide:', tokenInfo);
  } catch (error) {
    console.log('❌ Erreur de validation du token:', error.message);
  }

  // Test de recherche d'intérêts
  try {
    console.log('\n🔍 Test de recherche d\'intérêts...');
    const interests = await metaApi.searchInterests('fitness', 5);
    console.log('✅ Recherche d\'intérêts réussie:', interests.length, 'résultats');
  } catch (error) {
    console.log('❌ Erreur de recherche d\'intérêts:', error.message);
  }

  // Test du rate limit
  try {
    console.log('\n⏱️ Test du rate limit...');
    const rateLimit = await metaApi.getRateLimitStatus();
    console.log('✅ Status du rate limit:', rateLimit);
  } catch (error) {
    console.log('❌ Erreur du rate limit:', error.message);
  }
}

if (require.main === module) {
  testMetaConfig()
    .then(() => {
      console.log('\n✅ Test terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur lors du test:', error);
      process.exit(1);
    });
}

module.exports = { testMetaConfig };
