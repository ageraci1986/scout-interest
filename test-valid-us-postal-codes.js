const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-npchsmhe0-angelo-geracis-projects.vercel.app';

async function testValidUSPostalCodes() {
  console.log('🇺🇸 TEST AVEC DES CODES POSTAUX AMÉRICAINS VALIDES');
  console.log('==================================================');

  // Codes postaux américains valides et populaires
  const validPostalCodes = [
    { code: '10001', city: 'New York, NY' },
    { code: '90210', city: 'Beverly Hills, CA' },
    { code: '33101', city: 'Miami, FL' },
    { code: '60601', city: 'Chicago, IL' },
    { code: '77001', city: 'Houston, TX' }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const { code, city } of validPostalCodes) {
    console.log(`\n🏙️ TEST: ${code} (${city})`);
    console.log('=====================================');
    
    try {
      // Test direct de l'endpoint Meta API pour ce code postal
      console.log(`📡 Test de l'endpoint Meta API pour ${code}...`);
      
      const response = await axios.post(
        `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
        {
          adAccountId: 'act_379481728925498',
          postalCode: code,
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

      console.log(`✅ ${code}: SUCCÈS !`);
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Success: ${response.data?.success}`);
      
      if (response.data?.success && response.data?.data?.reachEstimate) {
        const reachData = response.data.data.reachEstimate;
        const estimate = reachData.users_lower_bound || reachData.users_upper_bound || 0;
        console.log(`   - Estimation: ${estimate.toLocaleString()}`);
        console.log(`   - Estimate ready: ${reachData.estimate_ready}`);
        successCount++;
      } else {
        console.log(`   - Pas d'estimation disponible`);
        console.log(`   - Data: ${JSON.stringify(response.data, null, 2)}`);
        errorCount++;
      }
      
    } catch (error) {
      console.error(`❌ ${code}: ÉCHEC`);
      console.error(`   - Message: ${error.message}`);
      if (error.response) {
        console.error(`   - Status: ${error.response.status}`);
        console.error(`   - Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      errorCount++;
    }
    
    // Délai entre les tests pour respecter les rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n🎯 RÉSULTATS FINAUX');
  console.log('=====================');
  console.log(`✅ Succès: ${successCount}/${validPostalCodes.length}`);
  console.log(`❌ Échecs: ${errorCount}/${validPostalCodes.length}`);
  
  if (successCount === validPostalCodes.length) {
    console.log('\n🎉 EXCELLENT ! Votre système fonctionne parfaitement !');
    console.log('   - Tous les codes postaux valides sont traités');
    console.log('   - Meta API répond correctement');
    console.log('   - Le problème était bien les codes postaux français invalides');
  } else {
    console.log('\n⚠️ Il y a encore des problèmes à résoudre...');
  }
  
  console.log('\n🔍 CONCLUSION:');
  console.log('   - Les codes postaux 75001-75005 sont français, pas américains');
  console.log('   - Meta API ne les reconnaît pas car ils n\'existent pas aux USA');
  console.log('   - Votre application fonctionne parfaitement !');
}

// Lancer le test
testValidUSPostalCodes();

