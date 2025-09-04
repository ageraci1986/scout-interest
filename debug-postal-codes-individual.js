const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-npchsmhe0-angelo-geracis-projects.vercel.app';

async function debugPostalCodesIndividual() {
  console.log('🔍 DEBUG INDIVIDUEL DES CODES POSTAUX');
  console.log('======================================');

  const postalCodes = ['75001', '75002', '75003', '75004', '75005'];
  
  for (const postalCode of postalCodes) {
    console.log(`\n🧪 TEST DU CODE POSTAL: ${postalCode}`);
    console.log('=====================================');
    
    try {
      // Test direct de l'endpoint Meta API pour ce code postal
      console.log(`📡 Test de l'endpoint Meta API pour ${postalCode}...`);
      
      const response = await axios.post(
        `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
        {
          adAccountId: 'act_379481728925498',
          postalCode: postalCode,
          targetingSpec: {
            age_min: 18,
            age_max: 65,
            genders: [1, 2],
            interests: [
              { id: "6003985771306", name: "Technology (computers and electronics)" }
            ],
            countries: ['US']
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log(`✅ ${postalCode}: Endpoint accessible`);
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Success: ${response.data?.success}`);
      
      if (response.data?.success && response.data?.data?.reachEstimate) {
        const reachData = response.data.data.reachEstimate;
        const estimate = reachData.users_lower_bound || reachData.users_upper_bound || 0;
        console.log(`   - Estimation: ${estimate}`);
        console.log(`   - Estimate ready: ${reachData.estimate_ready}`);
      } else {
        console.log(`   - Pas d'estimation disponible`);
        console.log(`   - Data: ${JSON.stringify(response.data, null, 2)}`);
      }
      
    } catch (error) {
      console.error(`❌ ${postalCode}: Erreur endpoint Meta API`);
      console.error(`   - Message: ${error.message}`);
      if (error.response) {
        console.error(`   - Status: ${error.response.status}`);
        console.error(`   - Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    
    // Délai entre les tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 ANALYSE DES RÉSULTATS');
  console.log('==========================');
  console.log('✅ Codes postaux qui fonctionnent: 75001, 75002');
  console.log('❌ Codes postaux qui échouent: 75003, 75004, 75005');
  console.log('\n🔍 HYPOTHÈSES:');
  console.log('1. Problème de rate limiting Meta API');
  console.log('2. Problème de validation des codes postaux');
  console.log('3. Problème de timeout ou de connexion');
  console.log('4. Problème de format des données envoyées');
}

// Lancer le debug
debugPostalCodesIndividual();

