const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-1b4cjidns-angelo-geracis-projects.vercel.app';

async function testNoInfiniteLoop() {
  console.log('🔄 TEST DE LA CORRECTION DE LA BOUCLE INFINIE');
  console.log('==============================================');

  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-no-infinite-loop.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }

    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);
    console.log(`   - Status: ${uploadResponse.data.status}`);
    console.log(`   - Message: ${uploadResponse.data.message}`);

    // 2. Vérifier l'état initial
    console.log('\n📊 État initial (après upload):');
    const initialResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (initialResponse.data?.success && initialResponse.data?.data?.project) {
      const project = initialResponse.data.data.project;
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      console.log(`   - Processed: ${project.processed_postal_codes}/${project.total_postal_codes}`);
    }

    // 3. Valider le targeting (ce qui devrait déclencher Meta API et arrêter le polling)
    console.log('\n🎯 Validation du targeting (déclenche Meta API et arrête le polling)...');

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
      console.log(`   - Total traité: ${targetingResponse.data.data?.totalProcessed || 0}`);
      console.log(`   - Succès: ${targetingResponse.data.data?.successful || 0}`);
      
      if (targetingResponse.data.data?.results) {
        console.log('\n📋 Résultats retournés par le targeting:');
        targetingResponse.data.data.results.forEach(result => {
          console.log(`   - ${result.postal_code}: audience=${result.audience_estimate}, targeting=${result.targeting_estimate}`);
        });
      }
    } else {
      throw new Error('Échec du targeting');
    }

    // 4. Attendre et vérifier l'état final
    console.log('\n⏳ Attente de 5 secondes pour le traitement Meta API...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🔄 État final en base (après targeting):');
    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`✅ État final du projet:`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      console.log(`   - Processed: ${project.processed_postal_codes}/${project.total_postal_codes}`);

      if (project.results && project.results.length > 0) {
        console.log('\n📊 Résultats finaux en base:');
        project.results.forEach(result => {
          console.log(`   - ${result.postal_code}:`);
          console.log(`     * postal_code_only_estimate: ${JSON.stringify(result.postal_code_only_estimate)}`);
          console.log(`     * postal_code_with_targeting_estimate: ${JSON.stringify(result.postal_code_with_targeting_estimate)}`);
          
          // Vérifier si les données Meta API sont présentes
          const geoEstimate = result.postal_code_only_estimate?.audience_size;
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size;
          
          if (geoEstimate && geoEstimate > 0) {
            console.log(`     ✅ Estimation géographique: ${geoEstimate}`);
          } else {
            console.log(`     ❌ Estimation géographique manquante ou à 0`);
          }
          
          if (targetingEstimate && targetingEstimate > 0) {
            console.log(`     ✅ Estimation targeting: ${targetingEstimate}`);
          } else {
            console.log(`     ❌ Estimation targeting manquante ou à 0`);
          }
        });
      }

      // 5. Vérifier que le projet est bien terminé
      console.log('\n🔍 Vérification de l\'état final:');
      if (project.status === 'completed') {
        console.log('✅ Projet marqué comme terminé - le polling devrait s\'arrêter automatiquement');
      } else if (project.processed_postal_codes >= project.total_postal_codes) {
        console.log('✅ Tous les codes postaux traités - le polling devrait s\'arrêter automatiquement');
      } else {
        console.log('⚠️  Projet pas encore terminé - le polling peut continuer légitimement');
      }
    }

    console.log('\n🎉 TEST TERMINÉ !');
    console.log('==================');
    console.log('✅ Si le projet est marqué comme "completed" ou tous les codes postaux sont traités,');
    console.log('   le polling devrait s\'arrêter automatiquement dans le frontend.');

  } catch (error) {
    console.error('\n❌ ERREUR DE TEST:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Lancer le test
testNoInfiniteLoop();

