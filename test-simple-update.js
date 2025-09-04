const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-m6n9mb4nr-angelo-geracis-projects.vercel.app';

async function testSimpleUpdate() {
  console.log('🧪 TEST SIMPLE DE MISE À JOUR');
  console.log('==============================');
  
  try {
    // 1. Créer un projet simple
    console.log('\n📤 Création d\'un projet simple...');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-simple-update.csv',
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
    console.log('\n🗄️ État initial en base...');
    
    const initialResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (initialResponse.data?.success && initialResponse.data?.data?.project) {
      const project = initialResponse.data.data.project;
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
        });
      }
    }
    
    // 3. Tester la validation du targeting
    console.log('\n🎯 Test de la validation du targeting...');
    
    const targetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      interests: [
        { id: "6003985771306", name: "Technology (computers and electronics)" }
      ],
      countries: ['US']
    };
    
    const targetingResponse = await axios.patch(
      `${BASE_URL}/api/projects/${projectId}/targeting`,
      { targeting_spec: targetingSpec },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (targetingResponse.data?.success) {
      console.log(`✅ Targeting validé !`);
      console.log(`📋 Message: ${targetingResponse.data.message}`);
      console.log(`📊 Résultats: ${targetingResponse.data.data.results?.length || 0}`);
      
      if (targetingResponse.data.data.results) {
        targetingResponse.data.data.results.forEach(result => {
          console.log(`   - ${result.postal_code}: audience=${result.audience_estimate}, targeting=${result.targeting_estimate}`);
        });
      }
    } else {
      console.log('❌ Échec du targeting:', targetingResponse.data);
    }
    
    // 4. Vérifier l'état final
    console.log('\n🗄️ État final en base...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`   - Status: ${project.status}`);
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
testSimpleUpdate();

