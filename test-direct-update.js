const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-m6n9mb4nr-angelo-geracis-projects.vercel.app';

async function testDirectUpdate() {
  console.log('🧪 TEST DIRECT DE LA MISE À JOUR');
  console.log('==================================');
  
  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-direct-update.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }
    
    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);
    
    // 2. Vérifier l'état initial
    console.log('\n🗄️ État initial...');
    
    const initialResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (initialResponse.data?.success && initialResponse.data?.data?.project) {
      const project = initialResponse.data.data.project;
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
        });
      }
    }
    
    // 3. Tester directement la mise à jour via l'API
    console.log('\n🔧 Test direct de la mise à jour...');
    
    // D'abord, obtenir un résultat de test depuis Meta API
    const testMetaResponse = await axios.post(
      `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
      {
        adAccountId: 'act_379481728925498',
        postalCode: '75001',
        targetingSpec: {
          age_min: 18,
          age_max: 65,
          genders: [1, 2],
          interests: [
            { id: "6003985771306", name: "Technology (computers and electronics)" }
          ]
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (testMetaResponse.data?.success) {
      const reachData = testMetaResponse.data.data.reachEstimate;
      const audienceEstimate = reachData.users_lower_bound || reachData.users_upper_bound || 0;
      
      console.log(`✅ Données Meta API obtenues: ${audienceEstimate}`);
      
      // Maintenant, essayer de mettre à jour directement via l'API des projets
      console.log('\n📤 Tentative de mise à jour directe...');
      
      const updateResponse = await axios.put(
        `${BASE_URL}/api/projects/${projectId}/results`,
        {
          results: [{
            postalCode: '75001',
            countryCode: 'US',
            success: true,
            postalCodeOnlyEstimate: { audience_size: audienceEstimate },
            postalCodeWithTargetingEstimate: { audience_size: audienceEstimate }
          }]
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (updateResponse.data?.success) {
        console.log(`✅ Mise à jour directe réussie !`);
        console.log(`📊 Résultats sauvegardés: ${updateResponse.data.data?.savedCount || 0}`);
      } else {
        console.log('❌ Échec de la mise à jour directe:', updateResponse.data);
      }
    } else {
      console.log('❌ Échec de l\'obtention des données Meta API:', testMetaResponse.data);
    }
    
    // 4. Vérifier l'état final
    console.log('\n🗄️ État final...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
        });
      }
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
testDirectUpdate();

