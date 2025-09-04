const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-ct00czoui-angelo-geracis-projects.vercel.app';

async function testSequenceDebug() {
  console.log('🔍 DEBUG DE LA SÉQUENCE COMPLÈTE');
  console.log('==================================');
  
  try {
    const testPostalCodes = ['75001', '75002'];
    
    console.log(`\n📤 Étape 1: Upload du fichier`);
    console.log('--------------------------------');
    
    // Test de l'upload
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-sequence-debug.csv',
        postalCodes: testPostalCodes
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (uploadResponse.data?.success) {
      const projectId = uploadResponse.data.project_id;
      console.log(`✅ Upload réussi, projet créé: ${projectId}`);
      
      console.log('\n📊 Résultats de l\'upload (réponse immédiate):');
      uploadResponse.data.results.forEach(result => {
        console.log(`   - ${result.postal_code}:`);
        console.log(`     * Audience estimate: ${result.audience_estimate}`);
        console.log(`     * Targeting estimate: ${result.targeting_estimate}`);
      });
      
      // Attendre un peu pour que le traitement se termine
      console.log('\n⏳ Attente de 3 secondes pour le traitement...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`\n🗄️ Étape 2: Vérification en base de données`);
      console.log('--------------------------------------------');
      
      // Vérifier les résultats en base de données
      const dbResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
      
      if (dbResponse.data?.success && dbResponse.data?.data?.project) {
        const project = dbResponse.data.data.project;
        console.log(`✅ Projet récupéré de la base:`);
        console.log(`   - Nom: ${project.name}`);
        console.log(`   - Total codes postaux: ${project.total_postal_codes}`);
        console.log(`   - Traités: ${project.processed_postal_codes}`);
        console.log(`   - Erreurs: ${project.error_postal_codes}`);
        
        console.log('\n📊 Résultats en base de données (bruts):');
        if (project.results && project.results.length > 0) {
          project.results.forEach(result => {
            console.log(`   - ${result.postal_code}:`);
            console.log(`     * postal_code_only_estimate:`, result.postal_code_only_estimate);
            console.log(`     * postal_code_with_targeting_estimate:`, result.postal_code_with_targeting_estimate);
            console.log(`     * Raw result object:`, JSON.stringify(result, null, 2));
          });
        } else {
          console.log('   ❌ Aucun résultat trouvé en base');
        }
        
        // Test 3: Vérification de l'endpoint API avec le même projectId
        console.log(`\n🔍 Étape 3: Test de l'endpoint API avec le même projectId`);
        console.log('----------------------------------------------------------------');
        
        const apiResponse = await axios.get(`${BASE_URL}/api/projects/${projectId}`);
        
        if (apiResponse.data?.success && apiResponse.data?.data?.project) {
          const apiProject = apiResponse.data.data.project;
          console.log(`✅ Projet récupéré via API:`);
          console.log(`   - Nom: ${apiProject.name}`);
          console.log(`   - Résultats: ${apiProject.results?.length || 0}`);
          
          if (apiProject.results && apiProject.results.length > 0) {
            console.log('\n📊 Résultats via API:');
            apiProject.results.forEach(result => {
              console.log(`   - ${result.postal_code}:`);
              console.log(`     * postal_code_only_estimate:`, result.postal_code_only_estimate);
              console.log(`     * postal_code_with_targeting_estimate:`, result.postal_code_with_targeting_estimate);
            });
          }
        }
        
        // Test 4: Comparaison des données
        console.log(`\n🔍 Étape 4: Comparaison des données`);
        console.log('--------------------------------------');
        
        const uploadData = {};
        const dbData = {};
        const apiData = {};
        
        // Organiser les données par code postal
        uploadResponse.data.results.forEach(result => {
          uploadData[result.postal_code] = {
            audience: result.audience_estimate,
            targeting: result.targeting_estimate
          };
        });
        
        if (project.results) {
          project.results.forEach(result => {
            dbData[result.postal_code] = {
              audience: result.postal_code_only_estimate?.audience_size,
              targeting: result.postal_code_with_targeting_estimate?.audience_size
            };
          });
        }
        
        if (apiResponse.data?.success && apiResponse.data?.data?.project?.results) {
          apiResponse.data.data.project.results.forEach(result => {
            apiData[result.postal_code] = {
              audience: result.postal_code_only_estimate?.audience_size,
              targeting: result.postal_code_with_targeting_estimate?.audience_size
            };
          });
        }
        
        console.log('\n📊 Comparaison des données par code postal:');
        testPostalCodes.forEach(code => {
          console.log(`\n   ${code}:`);
          console.log(`     Upload:     ${uploadData[code]?.audience} / ${uploadData[code]?.targeting}`);
          console.log(`     Base:        ${dbData[code]?.audience} / ${dbData[code]?.targeting}`);
          console.log(`     API:         ${apiData[code]?.audience} / ${apiData[code]?.targeting}`);
          
          // Vérifier la cohérence
          const uploadAudience = uploadData[code]?.audience;
          const dbAudience = dbData[code]?.audience;
          const apiAudience = apiData[code]?.audience;
          
          if (uploadAudience === dbAudience && dbAudience === apiAudience) {
            console.log(`     ✅ Données cohérentes`);
          } else {
            console.log(`     ❌ Données incohérentes !`);
            if (uploadAudience !== dbAudience) {
              console.log(`        Upload vs Base: ${uploadAudience} ≠ ${dbAudience}`);
            }
            if (dbAudience !== apiAudience) {
              console.log(`        Base vs API: ${dbAudience} ≠ ${apiAudience}`);
            }
          }
        });
        
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
testSequenceDebug();

