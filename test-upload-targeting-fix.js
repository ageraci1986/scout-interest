const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-ct00czoui-angelo-geracis-projects.vercel.app';

async function testUploadTargetingFix() {
  console.log('🔧 TEST DE L\'UPLOAD AVEC TARGETING CORRIGÉ');
  console.log('=============================================');
  
  try {
    const testPostalCodes = ['75001', '75002'];
    
    console.log(`\n📤 Test de l'upload avec ${testPostalCodes.length} codes postaux`);
    console.log('------------------------------------------------------------');
    
    // Test de l'upload
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-targeting-fix.csv',
        postalCodes: testPostalCodes
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (uploadResponse.data?.success) {
      const projectId = uploadResponse.data.project_id;
      console.log(`✅ Upload réussi, projet créé: ${projectId}`);
      
      console.log('\n📊 Résultats de l\'upload:');
      uploadResponse.data.results.forEach(result => {
        console.log(`   - ${result.postal_code}:`);
        console.log(`     * Audience estimate: ${result.audience_estimate}`);
        console.log(`     * Targeting estimate: ${result.targeting_estimate}`);
        
        // Vérifier la logique
        if (result.targeting_estimate < result.audience_estimate) {
          console.log(`     ✅ Logique correcte: targeting réduit l'audience`);
        } else if (result.targeting_estimate === result.audience_estimate) {
          console.log(`     ⚠️  Même audience: targeting n'affecte pas l'estimation`);
        } else {
          console.log(`     ❌ Logique incorrecte: targeting augmente l'audience`);
        }
      });
      
      // Attendre un peu pour que le traitement se termine
      console.log('\n⏳ Attente de 3 secondes pour le traitement...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Vérifier les résultats en base de données
      console.log('\n🗄️ Vérification des résultats en base de données');
      console.log('------------------------------------------------');
      
      const dbResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
      
      if (dbResponse.data?.success && dbResponse.data?.data?.project) {
        const project = dbResponse.data.data.project;
        console.log(`✅ Projet récupéré de la base:`);
        console.log(`   - Nom: ${project.name}`);
        console.log(`   - Total codes postaux: ${project.total_postal_codes}`);
        console.log(`   - Traités: ${project.processed_postal_codes}`);
        console.log(`   - Erreurs: ${project.error_postal_codes}`);
        
        console.log('\n📊 Résultats en base de données:');
        if (project.results && project.results.length > 0) {
          project.results.forEach(result => {
            const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
            const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
            console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
            
            // Vérifier la logique en base
            if (geoEstimate !== 'N/A' && targetingEstimate !== 'N/A') {
              if (parseInt(targetingEstimate) < parseInt(geoEstimate)) {
                console.log(`     ✅ Logique correcte en base: targeting réduit l'audience`);
              } else if (parseInt(targetingEstimate) === parseInt(geoEstimate)) {
                console.log(`     ⚠️  Même audience en base: targeting n'affecte pas l'estimation`);
              } else {
                console.log(`     ❌ Logique incorrecte en base: targeting augmente l'audience`);
              }
            }
          });
        } else {
          console.log('   ❌ Aucun résultat trouvé en base');
        }
        
        // Vérification finale
        console.log('\n🔍 VÉRIFICATION FINALE');
        console.log('------------------------');
        
        let allDataCorrect = true;
        let mockDataDetected = false;
        
        project.results.forEach(result => {
          const geoEstimate = result.postal_code_only_estimate?.audience_size;
          const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size;
          
          if (geoEstimate && targetingEstimate) {
            // Vérifier si ce sont des données réalistes (pas des millions)
            if (geoEstimate > 1000000 || targetingEstimate > 1000000) {
              console.log(`   ❌ ${result.postal_code}: Données suspectes (trop élevées)`);
              mockDataDetected = true;
              allDataCorrect = false;
            } else {
              // Vérifier la logique
              if (targetingEstimate < geoEstimate) {
                console.log(`   ✅ ${result.postal_code}: Données Meta API correctes`);
              } else {
                console.log(`   ⚠️  ${result.postal_code}: Logique incorrecte`);
                allDataCorrect = false;
              }
            }
          }
        });
        
        if (mockDataDetected) {
          console.log('\n🚨 PROBLÈME DÉTECTÉ: Données mock encore présentes !');
        } else if (allDataCorrect) {
          console.log('\n🎉 SUCCÈS: L\'upload utilise maintenant les vraies données Meta API !');
        } else {
          console.log('\n⚠️  ATTENTION: Certaines données ont une logique incorrecte');
        }
        
      } else {
        throw new Error('Impossible de récupérer le projet de la base');
      }
      
    } else {
      throw new Error('Upload échoué');
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
testUploadTargetingFix();
