const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-780f2c8rx-angelo-geracis-projects.vercel.app';

async function testTargetingFix() {
  console.log('🔧 TEST DE LA CORRECTION DE LA ROUTE TARGETING');
  console.log('==============================================');

  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-targeting-fix.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }

    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);

    // 2. Tester la validation du targeting
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

    console.log('\n📊 Réponse du targeting:');
    console.log('Status:', targetingResponse.status);
    console.log('Data:', JSON.stringify(targetingResponse.data, null, 2));

    if (targetingResponse.data?.success) {
      console.log(`\n✅ Targeting validé avec succès !`);
      console.log(`   - Total traité: ${targetingResponse.data.data?.totalProcessed || 0}`);
      console.log(`   - Succès: ${targetingResponse.data.data?.successful || 0}`);
      console.log(`   - Erreurs: ${targetingResponse.data.data?.errors || 0}`);
    } else {
      console.log(`\n❌ Échec du targeting:`, targetingResponse.data?.message);
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
testTargetingFix();
