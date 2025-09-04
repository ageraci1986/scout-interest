const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-4wvukbsis-angelo-geracis-projects.vercel.app';

async function testCompleteUpload() {
  console.log('🧪 TEST COMPLET DE L\'UPLOAD AVEC META API');
  console.log('==========================================');
  
  try {
    // 1. Test de l'endpoint Meta API directement
    console.log('\n🔍 Étape 1: Test direct de l\'endpoint Meta API');
    console.log('------------------------------------------------');
    
    const testPostalCode = '75001';
    const metaResponse = await axios.post(
      `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
      {
        adAccountId: 'act_379481728925498',
        postalCode: testPostalCode,
        targetingSpec: {
          age_min: 18,
          age_max: 65,
          genders: [1, 2],
          interests: [
            { id: "6003985771306", name: "Technology (computers and electronics)" }
          ]
        }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (metaResponse.data?.success && metaResponse.data?.data?.reachEstimate) {
      const reachData = metaResponse.data.data.reachEstimate;
      console.log(`✅ Meta API fonctionne pour ${testPostalCode}:`);
      console.log(`   - Audience: ${reachData.users_lower_bound || reachData.users_upper_bound}`);
      console.log(`   - Zip data: ${metaResponse.data.data.zipCodeData?.name} (${metaResponse.data.data.zipCodeData?.key})`);
    } else {
      throw new Error('Meta API response invalide');
    }
    
    // 2. Test de l'upload complet
    console.log('\n📤 Étape 2: Test de l\'upload complet');
    console.log('----------------------------------------');
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'test-complete-verification.csv',
        postalCodes: ['75001', '75002', '75003']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (uploadResponse.data?.success) {
      const projectId = uploadResponse.data.project_id;
      console.log(`✅ Upload réussi, projet créé: ${projectId}`);
      console.log(`📊 Résultats retournés par l'upload:`);
      
      uploadResponse.data.results.forEach(result => {
        console.log(`   - ${result.postal_code}: ${result.audience_estimate} / ${result.targeting_estimate}`);
      });
      
      // 3. Vérification des résultats en base de données
      console.log('\n🗄️ Étape 3: Vérification des résultats en base de données');
      console.log('------------------------------------------------------------');
      
      // Attendre un peu pour que le traitement se termine
      console.log('⏳ Attente de 5 secondes pour le traitement...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
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
          });
        } else {
          console.log('   ❌ Aucun résultat trouvé en base');
        }
        
        // 4. Vérification que les données sont bien celles de Meta API
        console.log('\n🔍 Étape 4: Vérification des vraies données Meta');
        console.log('------------------------------------------------');
        
        const expectedData = {
          '75001': { geo: 25300, targeting: 2530 }, // Données Meta API réelles
          '75002': { geo: 31900, targeting: 3190 },
          '75003': { geo: 13138, targeting: 1314 }
        };
        
        let dataMatch = true;
        project.results.forEach(result => {
          const expected = expectedData[result.postal_code];
          if (expected) {
            const geoMatch = Math.abs((result.postal_code_only_estimate?.audience_size || 0) - expected.geo) < 1000;
            const targetingMatch = Math.abs((result.postal_code_with_targeting_estimate?.audience_size || 0) - expected.targeting) < 1000;
            
            if (geoMatch && targetingMatch) {
              console.log(`   ✅ ${result.postal_code}: Données Meta API correctes`);
            } else {
              console.log(`   ❌ ${result.postal_code}: Données incorrectes (attendu: ${expected.geo}/${expected.targeting}, reçu: ${result.postal_code_only_estimate?.audience_size}/${result.postal_code_with_targeting_estimate?.audience_size})`);
              dataMatch = false;
            }
          }
        });
        
        if (dataMatch) {
          console.log('\n🎉 SUCCÈS: L\'upload utilise bien les vraies données Meta API !');
        } else {
          console.log('\n🚨 ÉCHEC: L\'upload n\'utilise pas les vraies données Meta API !');
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
testCompleteUpload();

