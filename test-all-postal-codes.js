const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-kpplajigt-angelo-geracis-projects.vercel.app';

async function testAllPostalCodes() {
  console.log('🔍 TEST DE TRAITEMENT DE TOUS LES CODES POSTAUX');
  console.log('================================================');

  try {
    // 1. Créer un projet avec 5 codes postaux
    console.log('\n📤 Création d\'un projet avec 5 codes postaux...');

    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-all-postal-codes.csv',
        postalCodes: ['75001', '75002', '75003', '75004', '75005']
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
      
      if (project.results && project.results.length > 0) {
        console.log('\n📋 Codes postaux dans le projet:');
        project.results.forEach(result => {
          console.log(`   - ${result.postal_code}: ${result.success ? 'Success' : 'Error'}`);
        });
      }
    }

    // 3. Valider le targeting (ce qui devrait traiter TOUS les codes postaux)
    console.log('\n🎯 Validation du targeting (traitement de tous les codes postaux)...');

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

    if (targetingResponse.data?.success) {
      console.log(`✅ Targeting validé !`);
      console.log(`   - Total traité: ${targetingResponse.data.data?.totalProcessed || 0}`);
      console.log(`   - Succès: ${targetingResponse.data.data?.successful || 0}`);
      
      if (targetingResponse.data.data?.results) {
        console.log('\n📋 Résultats du targeting:');
        targetingResponse.data.data.results.forEach(result => {
          console.log(`   - ${result.postal_code}: audience=${result.audience_estimate}, targeting=${result.targeting_estimate}`);
          
          // Vérifier que les estimations sont différentes
          if (result.audience_estimate === result.targeting_estimate) {
            console.log(`     ⚠️  Même estimation: ${result.audience_estimate} = ${result.targeting_estimate}`);
          } else {
            const reduction = ((result.audience_estimate - result.targeting_estimate) / result.audience_estimate * 100).toFixed(1);
            console.log(`     ✅ Estimations différentes: ${result.audience_estimate} → ${result.targeting_estimate} (réduction: ${reduction}%)`);
          }
        });
      }
    } else {
      throw new Error('Échec du targeting');
    }

    // 4. Attendre et vérifier l'état final
    console.log('\n⏳ Attente de 8 secondes pour le traitement Meta API...');
    await new Promise(resolve => setTimeout(resolve, 8000));

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
          
          // Vérifier si les données Meta API sont présentes et différentes
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
          
          // Vérifier la différence
          if (geoEstimate && targetingEstimate && geoEstimate > 0 && targetingEstimate > 0) {
            if (geoEstimate === targetingEstimate) {
              console.log(`     ⚠️  Même estimation: ${geoEstimate} = ${targetingEstimate}`);
            } else {
              const reduction = ((geoEstimate - targetingEstimate) / geoEstimate * 100).toFixed(1);
              console.log(`     ✅ Estimations différentes: ${geoEstimate} → ${targetingEstimate} (réduction: ${reduction}%)`);
            }
          }
        });
      }

      // 5. Vérification finale
      console.log('\n🔍 VÉRIFICATION FINALE:');
      if (project.results && project.results.length === 5) {
        console.log('✅ Tous les 5 codes postaux sont traités');
      } else {
        console.log(`❌ Seulement ${project.results?.length || 0}/5 codes postaux traités`);
      }
      
      if (project.status === 'completed') {
        console.log('✅ Projet marqué comme terminé');
      } else {
        console.log(`⚠️  Projet pas encore terminé: ${project.status}`);
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
testAllPostalCodes();

