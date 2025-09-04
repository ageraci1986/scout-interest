const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-igxupdyg9-angelo-geracis-projects.vercel.app';

async function testDifferentEstimates() {
  console.log('🎯 TEST DES ESTIMATIONS DIFFÉRENTES');
  console.log('===================================');
  
  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-different-estimates.csv',
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
    
    // 3. Tester la validation du targeting avec des intérêts spécifiques
    console.log('\n🎯 Test de la validation du targeting (avec intérêts)...');
    
    const targetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      interests: [
        { id: "6003985771306", name: "Technology (computers and electronics)" },
        { id: "6003348631833", name: "Software" }
      ],
      countries: ['US']
    };
    
    console.log('📋 Targeting spec avec intérêts:', JSON.stringify(targetingSpec, null, 2));
    
    const targetingResponse = await axios.patch(
      `${BASE_URL}/api/projects/${projectId}/targeting`,
      { targeting_spec: targetingSpec },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (targetingResponse.data?.success) {
      console.log(`✅ Targeting validé !`);
      
      if (targetingResponse.data.data) {
        console.log('📊 Données de réponse:');
        console.log('   - Results:', targetingResponse.data.data.results?.length || 0);
        console.log('   - TotalProcessed:', targetingResponse.data.data.totalProcessed);
        console.log('   - Successful:', targetingResponse.data.data.successful);
        console.log('   - Errors:', targetingResponse.data.data.errors);
        
        if (targetingResponse.data.data.results) {
          console.log('\n📊 Résultats détaillés:');
          targetingResponse.data.data.results.forEach(result => {
            console.log(`   - ${result.postal_code}:`);
            console.log(`     * Success: ${result.success}`);
            console.log(`     * Audience (géographique): ${result.audience_estimate}`);
            console.log(`     * Targeting (avec intérêts): ${result.targeting_estimate}`);
            console.log(`     * Différence: ${result.audience_estimate - result.targeting_estimate}`);
            console.log(`     * Réduction: ${((result.audience_estimate - result.targeting_estimate) / result.audience_estimate * 100).toFixed(1)}%`);
          });
        }
      }
    } else {
      console.log('❌ Échec du targeting:', targetingResponse.data);
    }
    
    // 4. Vérifier l'état final en base
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
    
  } catch (error) {
    console.error('\n❌ ERREUR DE TEST:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Lancer le test
testDifferentEstimates();

