const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-igxupdyg9-angelo-geracis-projects.vercel.app';

async function testSimpleDifferent() {
  console.log('🎯 TEST SIMPLE DES ESTIMATIONS DIFFÉRENTES');
  console.log('==========================================');
  
  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-simple-different.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }
    
    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);
    
    // 2. Tester la validation du targeting avec un seul intérêt
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
    
    console.log('📋 Targeting spec:', JSON.stringify(targetingSpec, null, 2));
    
    const targetingResponse = await axios.patch(
      `${BASE_URL}/api/projects/${projectId}/targeting`,
      { targeting_spec: targetingSpec },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('\n📊 Réponse complète:');
    console.log(JSON.stringify(targetingResponse.data, null, 2));
    
    if (targetingResponse.data?.success) {
      console.log(`\n✅ Targeting validé !`);
      
      // 3. Vérifier l'état final en base
      console.log('\n🗄️ État final en base...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
      if (finalResponse.data?.success && finalResponse.data?.data?.project) {
        const project = finalResponse.data.data.project;
        console.log(`   - Status: ${project.status}`);
        console.log(`   - Résultats: ${project.results?.length || 0}`);
        
        if (project.results && project.results.length > 0) {
          console.log('\n📊 Résultats finaux en base:');
          project.results.forEach(result => {
            const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
            const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
            console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
            
            // Vérifier si les estimations sont différentes
            if (geoEstimate !== 'N/A' && targetingEstimate !== 'N/A') {
              if (geoEstimate > targetingEstimate) {
                const reduction = ((geoEstimate - targetingEstimate) / geoEstimate * 100).toFixed(1);
                console.log(`     ✅ Logique correcte: targeting réduit l'audience de ${reduction}%`);
              } else if (geoEstimate === targetingEstimate) {
                console.log(`     ⚠️  Même audience: le targeting n'affecte pas l'estimation`);
              } else {
                console.log(`     ❌ Logique incorrecte: le targeting augmente l'audience`);
              }
            }
          });
        }
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
testSimpleDifferent();

