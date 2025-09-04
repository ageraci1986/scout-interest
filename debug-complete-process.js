const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-7600mj87o-angelo-geracis-projects.vercel.app';

async function debugCompleteProcess() {
  console.log('🔍 DEBUG COMPLET DU PROCESSUS META API');
  console.log('=====================================');

  try {
    // 1. Créer un projet
    console.log('\n📤 ÉTAPE 1: Création du projet');
    console.log('--------------------------------');

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'debug-complete-process.csv',
        postalCodes: ['75001']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!uploadResponse.data?.success) {
      throw new Error('Upload échoué');
    }

    const projectId = uploadResponse.data.project_id;
    console.log(`✅ Projet créé: ${projectId}`);
    console.log(`   - Message: ${uploadResponse.data.message}`);
    console.log(`   - Status: ${uploadResponse.data.status}`);

    // 2. Vérifier l'état initial en base
    console.log('\n📊 ÉTAPE 2: État initial en base');
    console.log('----------------------------------');

    const initialResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (initialResponse.data?.success && initialResponse.data?.data?.project) {
      const project = initialResponse.data.data.project;
      console.log(`✅ Projet récupéré de la base:`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        console.log('\n📋 Résultats initiaux en base:');
        project.results.forEach(result => {
          console.log(`   - ${result.postal_code}:`);
          console.log(`     * postal_code_only_estimate: ${JSON.stringify(result.postal_code_only_estimate)}`);
          console.log(`     * postal_code_with_targeting_estimate: ${JSON.stringify(result.postal_code_with_targeting_estimate)}`);
          console.log(`     * success: ${result.success}`);
        });
      }
    }

    // 3. Valider le targeting (ce qui devrait déclencher Meta API)
    console.log('\n🎯 ÉTAPE 3: Validation du targeting (déclenche Meta API)');
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

    console.log('📋 Targeting spec:', JSON.stringify(targetingSpec, null, 2));

    const targetingResponse = await axios.patch(
      `${BASE_URL}/api/projects/${projectId}/targeting`,
      { targeting_spec: targetingSpec },
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('\n📊 Réponse complète du targeting:');
    console.log('Status:', targetingResponse.status);
    console.log('Data:', JSON.stringify(targetingResponse.data, null, 2));

    if (targetingResponse.data?.success) {
      console.log(`\n✅ Targeting validé !`);
      console.log(`   - Total traité: ${targetingResponse.data.data?.totalProcessed || 0}`);
      console.log(`   - Succès: ${targetingResponse.data.data?.successful || 0}`);
      console.log(`   - Erreurs: ${targetingResponse.data.data?.errors || 0}`);
      
      // Vérifier les résultats retournés par le targeting
      if (targetingResponse.data.data?.results) {
        console.log('\n📋 Résultats retournés par le targeting:');
        targetingResponse.data.data.results.forEach(result => {
          console.log(`   - ${result.postal_code}: audience=${result.audience_estimate}, targeting=${result.targeting_estimate}`);
        });
      }
    } else {
      throw new Error(`Échec du targeting: ${targetingResponse.data?.message}`);
    }

    // 4. Attendre et vérifier l'état final en base
    console.log('\n⏳ Attente de 5 secondes pour le traitement Meta API...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🔄 ÉTAPE 4: État final en base (après Meta API)');
    console.log('------------------------------------------------');

    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`✅ État final du projet:`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);

      if (project.results && project.results.length > 0) {
        console.log('\n📊 Résultats finaux en base:');
        project.results.forEach(result => {
          console.log(`   - ${result.postal_code}:`);
          console.log(`     * postal_code_only_estimate: ${JSON.stringify(result.postal_code_only_estimate)}`);
          console.log(`     * postal_code_with_targeting_estimate: ${JSON.stringify(result.postal_code_with_targeting_estimate)}`);
          console.log(`     * success: ${result.success}`);
          
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
    }

    // 5. Test direct de l'endpoint Meta API
    console.log('\n🧪 ÉTAPE 5: Test direct de l\'endpoint Meta API');
    console.log('------------------------------------------------');

    try {
      const metaResponse = await axios.post(
        `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
        {
          adAccountId: 'act_379481728925498',
          postalCode: '75001',
          targetingSpec: {
            age_min: 18,
            age_max: 65,
            genders: [1, 2],
            interests: [
              { id: "6003985771306", name: "Technology (computers and electronics)" }
            ],
            countries: ['US']
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('✅ Endpoint Meta API accessible:');
      console.log('Status:', metaResponse.status);
      console.log('Data:', JSON.stringify(metaResponse.data, null, 2));
    } catch (metaError) {
      console.error('❌ Erreur endpoint Meta API:', metaError.message);
      if (metaError.response) {
        console.error('   Status:', metaError.response.status);
        console.error('   Data:', metaError.response.data);
      }
    }

  } catch (error) {
    console.error('\n❌ ERREUR DE DEBUG:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Lancer le debug
debugCompleteProcess();

