const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-3e3fk7ep5-angelo-geracis-projects.vercel.app';

async function testMethodExists() {
  console.log('🔍 TEST DE L\'EXISTENCE DE LA MÉTHODE');
  console.log('=====================================');
  
  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-method-exists.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }
    
    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);
    
    // 2. Tester la validation du targeting avec des logs très détaillés
    console.log('\n🎯 Test de la validation du targeting (logs détaillés)...');
    
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
    
    // 3. Faire la requête et capturer tous les détails
    const targetingResponse = await axios.patch(
      `${BASE_URL}/api/projects/${projectId}/targeting`,
      { targeting_spec: targetingSpec },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    console.log('\n📊 Réponse complète:');
    console.log(JSON.stringify(targetingResponse.data, null, 2));
    
    if (targetingResponse.data?.success) {
      console.log(`\n✅ Targeting validé !`);
      
      // 4. Vérifier immédiatement l'état en base
      console.log('\n🗄️ Vérification immédiate en base...');
      
      const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
      if (finalResponse.data?.success && finalResponse.data?.data?.project) {
        const project = finalResponse.data.data.project;
        console.log(`   - Status: ${project.status}`);
        console.log(`   - Résultats: ${project.results?.length || 0}`);
        
        if (project.results && project.results.length > 0) {
          console.log('\n📊 Résultats finaux (bruts):');
          project.results.forEach(result => {
            console.log(`   - ${result.postal_code}:`, JSON.stringify(result, null, 2));
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
testMethodExists();
