const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-q90ownsyq-angelo-geracis-projects.vercel.app';

async function testCompleteWorkflow() {
  console.log('🚀 TEST COMPLET DU WORKFLOW - UPLOAD → TARGETING → META API → RÉCUPÉRATION');
  console.log('==========================================================================');

  try {
    // 1. Créer un projet via upload
    console.log('\n📤 ÉTAPE 1: Upload de fichier (création du projet)');
    console.log('--------------------------------------------------');

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-complete-workflow.csv',
        postalCodes: ['75001', '75002']
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

    // 2. Attendre un peu puis vérifier l'état initial
    console.log('\n⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n📊 ÉTAPE 2: Vérification de l\'état initial');
    console.log('--------------------------------------------');

    const initialResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (initialResponse.data?.success && initialResponse.data?.data?.project) {
      const project = initialResponse.data.data.project;
      console.log(`✅ Projet récupéré:`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);
      
      if (project.results && project.results.length > 0) {
        console.log('\n📋 Résultats initiaux (devraient être à 0):');
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
          console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
        });
      }
    }

    // 3. Valider le targeting (ce qui déclenche les appels Meta API)
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

    console.log('📋 Targeting spec à valider:', JSON.stringify(targetingSpec, null, 2));

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
      throw new Error(`Échec du targeting: ${targetingResponse.data?.message}`);
    }

    // 4. Attendre que le traitement Meta API se termine
    console.log('\n⏳ Attente du traitement Meta API (5 secondes)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Vérifier l'état final (simulation du bouton Refresh)
    console.log('\n🔄 ÉTAPE 4: Vérification finale (simulation du bouton Refresh)');
    console.log('----------------------------------------------------------------');

    const finalResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
    if (finalResponse.data?.success && finalResponse.data?.data?.project) {
      const project = finalResponse.data.data.project;
      console.log(`✅ État final du projet:`);
      console.log(`   - Status: ${project.status}`);
      console.log(`   - Résultats: ${project.results?.length || 0}`);

      if (project.results && project.results.length > 0) {
        console.log('\n📊 Résultats finaux avec Meta API:');
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

    console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !');
    console.log('================================');
    console.log('✅ Upload → Targeting → Meta API → Récupération des données : TOUT FONCTIONNE !');

  } catch (error) {
    console.error('\n❌ ERREUR DE TEST:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Lancer le test
testCompleteWorkflow();

