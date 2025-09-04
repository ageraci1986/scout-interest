const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-eb7m8h3gg-angelo-geracis-projects.vercel.app';

async function testTargetingSpecific() {
  console.log('🎯 TEST SPÉCIFIQUE DU TARGETING COMBINÉ');
  console.log('========================================');
  
  try {
    const testPostalCode = '75001';
    const testTargetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      interests: [
        { id: "6003985771306", name: "Technology (computers and electronics)" }
      ]
    };
    
    console.log(`\n🔍 Test 1: Targeting avec code postal + intérêts`);
    console.log('------------------------------------------------');
    console.log(`📋 Code postal: ${testPostalCode}`);
    console.log(`🎯 Targeting spec:`, JSON.stringify(testTargetingSpec, null, 2));
    
    // Test de l'endpoint avec targeting
    const targetingResponse = await axios.post(
      `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
      {
        adAccountId: 'act_379481728925498',
        postalCode: testPostalCode,
        targetingSpec: testTargetingSpec
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (targetingResponse.data?.success) {
      console.log(`✅ Réponse reçue pour le targeting combiné:`);
      console.log(`   - Code postal trouvé: ${targetingResponse.data.data.zipCodeData?.name} (${targetingResponse.data.data.zipCodeData?.key})`);
      
      const reachData = targetingResponse.data.data.reachEstimate;
      if (reachData) {
        const audienceEstimate = reachData.users_lower_bound || reachData.users_upper_bound || 0;
        console.log(`   - Audience estimate: ${audienceEstimate}`);
        console.log(`   - Raw Meta response:`, JSON.stringify(reachData, null, 2));
        
        // Vérifier si c'est vraiment des données Meta ou des données mock
        if (audienceEstimate > 1000000) {
          console.log(`   ⚠️  ATTENTION: Audience estimate très élevée (${audienceEstimate}) - possiblement des données mock`);
        } else {
          console.log(`   ✅ Audience estimate réaliste: ${audienceEstimate}`);
        }
      } else {
        console.log(`   ❌ Pas de données d'estimation dans la réponse`);
      }
      
      console.log(`   - Targeting spec utilisé:`, JSON.stringify(targetingResponse.data.data.targetingSpec, null, 2));
      
    } else {
      console.log(`❌ Réponse invalide pour le targeting combiné:`, targetingResponse.data);
    }
    
    // Test 2: Comparaison avec code postal seul (sans intérêts)
    console.log(`\n🔍 Test 2: Code postal seul (sans intérêts)`);
    console.log('--------------------------------------------');
    
    const geoOnlyTargetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2]
      // Pas d'intérêts
    };
    
    const geoOnlyResponse = await axios.post(
      `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
      {
        adAccountId: 'act_379481728925498',
        postalCode: testPostalCode,
        targetingSpec: geoOnlyTargetingSpec
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (geoOnlyResponse.data?.success) {
      const reachData = geoOnlyResponse.data.data.reachEstimate;
      const geoOnlyEstimate = reachData.users_lower_bound || reachData.users_upper_bound || 0;
      console.log(`✅ Code postal seul: ${geoOnlyEstimate}`);
      
      // Comparer avec le targeting combiné
      if (targetingResponse.data?.success) {
        const targetingEstimate = targetingResponse.data.data.reachEstimate.users_lower_bound || 
                                targetingResponse.data.data.reachEstimate.users_upper_bound || 0;
        
        console.log(`📊 Comparaison des estimations:`);
        console.log(`   - Code postal seul: ${geoOnlyEstimate}`);
        console.log(`   - Avec intérêts: ${targetingEstimate}`);
        
        if (targetingEstimate < geoOnlyEstimate) {
          console.log(`   ✅ Logique correcte: le targeting réduit l'audience (${targetingEstimate} < ${geoOnlyEstimate})`);
        } else if (targetingEstimate === geoOnlyEstimate) {
          console.log(`   ⚠️  Même audience: le targeting n'affecte pas l'estimation`);
        } else {
          console.log(`   ❌ Logique incorrecte: le targeting augmente l'audience (${targetingEstimate} > ${geoOnlyEstimate})`);
        }
      }
    }
    
    // Test 3: Vérification directe de l'API Meta
    console.log(`\n🔍 Test 3: Vérification directe de l'API Meta`);
    console.log('----------------------------------------------');
    
    console.log(`📋 Token Meta disponible: ${!!process.env.META_ACCESS_TOKEN}`);
    console.log(`📋 Longueur du token: ${process.env.META_ACCESS_TOKEN ? process.env.META_ACCESS_TOKEN.length : 0}`);
    
    // Test de validation du token
    try {
      const tokenValidation = await axios.get(`${BASE_URL}/api/meta/validate-token`);
      if (tokenValidation.data?.success) {
        console.log(`✅ Token Meta valide`);
        console.log(`   - Permissions:`, tokenValidation.data.data);
      } else {
        console.log(`❌ Token Meta invalide:`, tokenValidation.data);
      }
    } catch (error) {
      console.log(`❌ Erreur validation token:`, error.message);
    }
    
    // Test de configuration du compte publicitaire
    try {
      const adAccountConfig = await axios.get(`${BASE_URL}/api/meta/ad-account`);
      if (adAccountConfig.data?.success) {
        console.log(`✅ Configuration compte publicitaire:`);
        console.log(`   - ID: ${adAccountConfig.data.data.ad_account_id}`);
        console.log(`   - Configuré: ${adAccountConfig.data.data.is_configured}`);
      } else {
        console.log(`❌ Erreur config compte publicitaire:`, adAccountConfig.data);
      }
    } catch (error) {
      console.log(`❌ Erreur config compte publicitaire:`, error.message);
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR DE TEST:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Lancer le test
testTargetingSpecific();

