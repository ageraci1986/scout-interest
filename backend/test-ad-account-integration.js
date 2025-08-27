// Test script pour vérifier l'intégration complète avec l'Ad Account ID
const axios = require('axios');

async function testAdAccountIntegration() {
  console.log('🔍 Test de l\'intégration Ad Account ID...\n');

  try {
    // Test 1: Vérifier l'Ad Account ID
    console.log('1️⃣ Test de l\'Ad Account ID...');
    const adAccountResponse = await axios.get('http://localhost:3001/api/meta/ad-account');
    console.log('✅ Ad Account ID configuré:', adAccountResponse.data.data.ad_account_id);
    console.log('✅ Configuration valide:', adAccountResponse.data.data.is_configured);

    // Test 2: Recherche d'intérêts
    console.log('\n2️⃣ Test de recherche d\'intérêts...');
    const interestsResponse = await axios.get('http://localhost:3001/api/meta/interests/search', {
      params: { q: 'fitness', limit: 3 }
    });
    console.log('✅ Intérêts trouvés:', interestsResponse.data.data.length);

    // Test 3: Estimation d'audience
    console.log('\n3️⃣ Test d\'estimation d\'audience...');
    const estimateResponse = await axios.post('http://localhost:3001/api/meta/delivery-estimate', {
      adAccountId: adAccountResponse.data.data.ad_account_id,
      targetingSpec: {
        interests: [{
          id: interestsResponse.data.data[0].id,
          name: interestsResponse.data.data[0].name
        }],
        geo_locations: [{ countries: ['FR'] }],
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['facebook', 'instagram']
      }
    });
    console.log('✅ Estimation d\'audience réussie');
    console.log('📊 Données d\'estimation:', estimateResponse.data.data[0]);

    // Test 4: Health check
    console.log('\n4️⃣ Test du health check...');
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Backend opérationnel:', healthResponse.data.status);

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Ouvrir http://localhost:3000 dans votre navigateur');
    console.log('2. Aller à la page "Targeting"');
    console.log('3. Rechercher des intérêts (ex: "fitness", "cooking")');
    console.log('4. Voir l\'estimation d\'audience en temps réel');
    console.log('5. L\'estimation utilise maintenant votre vrai Ad Account ID !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAdAccountIntegration();
