const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-m6n9mb4nr-angelo-geracis-projects.vercel.app';

async function testDebugTargeting() {
  console.log('🔍 DEBUG DE LA VALIDATION DU TARGETING');
  console.log('======================================');
  
  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-debug-targeting.csv',
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
    
    // 3. Tester la validation du targeting avec plus de logs
    console.log('\n🎯 Test de la validation du targeting (avec debug)...');
    
    const targetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      interests: [
        { id: "6003985771306", name: "Technology (computers and electronics)" }
      ],
      countries: ['US']
    };
    
    console.log('📋 Targeting spec:', JSON.stringify(targetingSpec, null, 2));
    
    const targetingResponse = await axios.patch(
      `${BASE_URL}/api/projects/${projectId}/targeting`,
      { targeting_spec: targetingSpec },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('\n📊 Réponse complète de la validation:');
    console.log('   - Status:', targetingResponse.status);
    console.log('   - Success:', targetingResponse.data?.success);
    console.log('   - Message:', targetingResponse.data?.message);
    
    if (targetingResponse.data?.success) {
      console.log(`✅ Targeting validé !`);
      
      if (targetingResponse.data.data) {
        console.log('📊 Données de réponse:');
        console.log('   - Project:', !!targetingResponse.data.data.project);
        console.log('   - Results:', targetingResponse.data.data.results?.length || 0);
        console.log('   - TotalProcessed:', targetingResponse.data.data.totalProcessed);
        console.log('   - Successful:', targetingResponse.data.data.successful);
        console.log('   - Errors:', targetingResponse.data.data.errors);
        
        if (targetingResponse.data.data.results) {
          console.log('\n📊 Résultats détaillés:');
          targetingResponse.data.data.results.forEach(result => {
            console.log(`   - ${result.postal_code}:`);
            console.log(`     * Success: ${result.success}`);
            console.log(`     * Audience: ${result.audience_estimate}`);
            console.log(`     * Targeting: ${result.targeting_estimate}`);
            console.log(`     * Error: ${result.error || 'none'}`);
          });
        }
      }
    } else {
      console.log('❌ Échec du targeting:', targetingResponse.data);
    }
    
    // 4. Vérifier l'état final immédiatement
    console.log('\n🗄️ État final immédiat...');
    
    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        console.log('\n📊 Résultats finaux détaillés:');
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
          
          // Vérifier si les données ont été mises à jour
          if (geoEstimate === 'N/A' && targetingEstimate === 'N/A') {
            console.log(`     ❌ Données non mises à jour (toujours N/A)`);
          } else if (geoEstimate > 0 && targetingEstimate > 0) {
            console.log(`     ✅ Données mises à jour avec succès !`);
          } else {
            console.log(`     ⚠️  Données partiellement mises à jour`);
          }
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
testDebugTargeting();

