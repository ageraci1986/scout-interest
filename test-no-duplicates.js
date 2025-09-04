const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-23ipm6m29-angelo-geracis-projects.vercel.app';

async function testNoDuplicates() {
  console.log('🔧 TEST DE LA CORRECTION DU DOUBLON');
  console.log('====================================');

  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-no-duplicates.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }

    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);

    // 2. Vérifier l'état initial (devrait avoir 1 résultat)
    console.log('\n📊 État initial (après upload):');
    const initialResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (initialResponse.data?.success && initialResponse.data?.data?.project) {
      const project = initialResponse.data.data.project;
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        console.log('\n📋 Résultats initiaux:');
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
        });
      }
    }

    // 3. Valider le targeting
    console.log('\n🎯 Validation du targeting...');

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
    } else {
      throw new Error('Échec du targeting');
    }

    // 4. Attendre et vérifier l'état final
    console.log('\n⏳ Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🔄 État final (après targeting):');
    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        console.log('\n📋 Résultats finaux:');
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
        });

        // Vérifier qu'il n'y a pas de doublons
        if (project.results.length === 1) {
          console.log('\n✅ SUCCÈS: Aucun doublon détecté !');
          console.log('   - 1 résultat initial (upload)');
          console.log('   - 1 résultat final (avec Meta API)');
          console.log('   - Total: 1 résultat (pas de doublon)');
        } else {
          console.log('\n❌ DOUBLON DÉTECTÉ:');
          console.log(`   - Résultats attendus: 1`);
          console.log(`   - Résultats trouvés: ${project.results.length}`);
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
testNoDuplicates();

