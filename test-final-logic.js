const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-3e3fk7ep5-angelo-geracis-projects.vercel.app';

async function testFinalLogic() {
  console.log('🎯 TEST FINAL DE LA LOGIQUE COMPLÈTE');
  console.log('====================================');
  
  try {
    // 1. Upload sans appel Meta API
    console.log('\n📤 Étape 1: Upload sans appel Meta API');
    console.log('------------------------------------------');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-final-logic.csv',
        postalCodes: ['75001', '75002']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }
    
    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);
    console.log(`📋 Message: ${uploadResponse.data.message}`);
    console.log(`📊 Status: ${uploadResponse.data.status}`);
    
    console.log('\n📊 Résultats de l\'upload (devraient être à 0):');
    uploadResponse.data.results.forEach(result => {
      console.log(`   - ${result.postal_code}: audience=${result.audience_estimate}, targeting=${result.targeting_estimate}`);
    });
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Vérifier que les données sont bien à 0 en base
    console.log('\n🗄️ Étape 2: Vérification en base (devraient être à 0)');
    console.log('--------------------------------------------------------');
    
    const dbResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    
    if (dbResponse.data?.success && dbResponse.data?.data?.project) {
      const project = dbResponse.data.data.project;
      console.log(`✅ Projet récupéré de la base:`);
      console.log(`   - Nom: ${project.name}`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        console.log('\n📊 Résultats en base (devraient être à 0):');
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
        });
      }
    }
    
    // 3. Valider le targeting (ce qui devrait déclencher les appels Meta API)
    console.log('\n🎯 Étape 3: Validation du targeting (déclenche Meta API)');
    console.log('--------------------------------------------------------');
    
    const targetingSpec = {
      age_min: 18,
      age_max: 65,
      genders: [1, 2],
      interests: [
        { id: "6003985771306", name: "Technology (computers and electronics)" }
      ],
      countries: ['US']
    };
    
    console.log('📋 Targeting spec à valider:', JSON.stringify(targetingSpec, null, 2));
    
    const targetingResponse = await axios.patch(
      `${BASE_URL}/api/projects/${projectId}/targeting`,
      { targeting_spec: targetingSpec },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (targetingResponse.data?.success) {
      console.log(`✅ Targeting validé avec succès !`);
      console.log(`📋 Message: ${targetingResponse.data.message}`);
      console.log(`📊 Total traité: ${targetingResponse.data.data.totalProcessed}`);
      console.log(`📊 Succès: ${targetingResponse.data.data.successful}`);
      console.log(`📊 Erreurs: ${targetingResponse.data.data.errors}`);
      
      console.log('\n📊 Résultats après validation du targeting:');
      targetingResponse.data.data.results.forEach(result => {
        console.log(`   - ${result.postal_code}: audience=${result.audience_estimate}, targeting=${result.targeting_estimate}`);
      });
      
      // 4. Vérifier que les données sont maintenant calculées en base
      console.log('\n🗄️ Étape 4: Vérification finale en base (devraient être calculées)');
      console.log('--------------------------------------------------------------------');
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre que les calculs se terminent
      
      const finalDbResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
      
      if (finalDbResponse.data?.success && finalDbResponse.data?.data?.project) {
        const finalProject = finalDbResponse.data.data.project;
        console.log(`✅ Projet final récupéré de la base:`);
        console.log(`   - Status: ${finalProject.status}`);
        console.log(`   - Traités: ${finalProject.processed_postal_codes}`);
        console.log(`   - Erreurs: ${finalProject.error_postal_codes}`);
        
        if (finalProject.results && finalProject.results.length > 0) {
          console.log('\n📊 Résultats finaux en base:');
          finalProject.results.forEach(result => {
            const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
            const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
            console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
          });
          
          // Vérification finale
          console.log('\n🔍 VÉRIFICATION FINALE');
          console.log('------------------------');
          
          let allDataCalculated = true;
          let mockDataDetected = false;
          
          finalProject.results.forEach(result => {
            const geoEstimate = result.postal_code_only_estimate?.audience_size;
            const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size;
            
            if (geoEstimate === 0 || targetingEstimate === 0) {
              console.log(`   ❌ ${result.postal_code}: Données non calculées (toujours à 0)`);
              allDataCalculated = false;
            } else if (geoEstimate > 1000000 || targetingEstimate > 1000000) {
              console.log(`   ❌ ${result.postal_code}: Données suspectes (trop élevées)`);
              mockDataDetected = true;
              allDataCalculated = false;
            } else {
              console.log(`   ✅ ${result.postal_code}: Données Meta API calculées correctement`);
            }
          });
          
          if (mockDataDetected) {
            console.log('\n🚨 PROBLÈME: Données mock détectées !');
          } else if (allDataCalculated) {
            console.log('\n🎉 SUCCÈS: Toutes les données Meta API sont calculées !');
          } else {
            console.log('\n⚠️  ATTENTION: Certaines données ne sont pas calculées');
          }
        }
      }
      
    } else {
      console.log('❌ Échec de la validation du targeting:', targetingResponse.data);
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
testFinalLogic();

