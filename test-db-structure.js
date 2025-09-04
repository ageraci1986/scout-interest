const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-7600mj87o-angelo-geracis-projects.vercel.app';

async function testDbStructure() {
  console.log('🔍 TEST DE LA STRUCTURE DE LA BASE DE DONNÉES');
  console.log('=============================================');

  try {
    // 1. Créer un projet
    console.log('\n📤 Création d\'un projet...');

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-db-structure.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }

    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);

    // 2. Vérifier la structure exacte des données en base
    console.log('\n📊 Structure des données en base (après upload):');
    const initialResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (initialResponse.data?.success && initialResponse.data?.data?.project) {
      const project = initialResponse.data.data.project;
      console.log(`✅ Projet récupéré:`);
      console.log(`   - ID: ${project.id}`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        console.log('\n📋 Structure détaillée du premier résultat:');
        const result = project.results[0];
        console.log('   - Clés disponibles:', Object.keys(result));
        console.log('   - Valeurs:');
        Object.entries(result).forEach(([key, value]) => {
          console.log(`     * ${key}: ${JSON.stringify(value)}`);
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
      
      // Vérifier les résultats retournés par le targeting
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
    console.log('\n⏳ Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n🔄 État final en base (après targeting):');
    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`✅ État final du projet:`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);

      if (project.results && project.results.length > 0) {
        console.log('\n📋 Structure détaillée du résultat final:');
        const result = project.results[0];
        console.log('   - Clés disponibles:', Object.keys(result));
        console.log('   - Valeurs:');
        Object.entries(result).forEach(([key, value]) => {
          console.log(`     * ${key}: ${JSON.stringify(value)}`);
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
testDbStructure();

