const axios = require('axios');

const BASE_URL = 'https://scout-interest-optimized-eb7m8h3gg-angelo-geracis-projects.vercel.app';

async function debugUpload() {
  console.log('🔍 DEBUG COMPLET DE L\'UPLOAD');
  console.log('==============================');
  
  try {
    const postalCodes = ['75001', '75002'];
    
    console.log(`\n📋 Codes postaux à traiter: ${postalCodes.join(', ')}`);
    
    // Simuler exactement ce que fait l'upload
    for (const code of postalCodes) {
      console.log(`\n🔍 Traitement de ${code}...`);
      
      try {
        // 1. Appel à l'endpoint Meta API
        console.log(`   📤 Appel Meta API pour ${code}...`);
        
        const metaResponse = await axios.post(
          `${BASE_URL}/api/meta/postal-code-reach-estimate-v2`,
          {
            adAccountId: 'act_379481728925498',
            postalCode: code,
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
        
        console.log(`   ✅ Réponse Meta API reçue pour ${code}:`);
        console.log(`      - Success: ${metaResponse.data?.success}`);
        console.log(`      - Has reachEstimate: ${!!metaResponse.data?.data?.reachEstimate}`);
        
        if (metaResponse.data?.success && metaResponse.data?.data?.reachEstimate) {
          const reachData = metaResponse.data.data.reachEstimate;
          const audienceEstimate = reachData.users_lower_bound || reachData.users_upper_bound || 0;
          const targetingEstimate = Math.floor(audienceEstimate * 0.1);
          
          console.log(`      - Audience estimate: ${audienceEstimate}`);
          console.log(`      - Targeting estimate: ${targetingEstimate}`);
          console.log(`      - Raw response:`, JSON.stringify(reachData, null, 2));
          
        } else {
          console.log(`      ❌ Réponse Meta API invalide:`, metaResponse.data);
        }
        
        // Délai entre les appels
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`   ❌ Erreur Meta API pour ${code}:`, error.message);
        if (error.response) {
          console.error(`      Status: ${error.response.status}`);
          console.error(`      Data:`, error.response.data);
        }
      }
    }
    
    // 2. Test de l'upload complet
    console.log(`\n📤 Test de l'upload complet...`);
    
    const uploadResponse = await axios.post(
      `${BASE_URL}/api/upload/file/json`,
      {
        filename: 'debug-test.csv',
        postalCodes: ['75001', '75002']
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (uploadResponse.data?.success) {
      console.log(`✅ Upload réussi, projet: ${uploadResponse.data.project_id}`);
      console.log(`📊 Résultats de l'upload:`);
      
      uploadResponse.data.results.forEach(result => {
        console.log(`   - ${result.postal_code}: ${result.audience_estimate} / ${result.targeting_estimate}`);
      });
      
      // 3. Vérification en base
      console.log(`\n🗄️ Vérification en base de données...`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const dbResponse = await axios.get(`${BASE_URL}/api/projects/${uploadResponse.data.project_id}`);
      
      if (dbResponse.data?.success && dbResponse.data?.data?.project) {
        const project = dbResponse.data.data.project;
        console.log(`✅ Projet en base:`);
        console.log(`   - Nom: ${project.name}`);
        console.log(`   - Résultats: ${project.results?.length || 0}`);
        
        if (project.results && project.results.length > 0) {
          project.results.forEach(result => {
            const geoEstimate = result.postal_code_only_estimate?.audience_size || 'N/A';
            const targetingEstimate = result.postal_code_with_targeting_estimate?.audience_size || 'N/A';
            console.log(`   - ${result.postal_code}: ${geoEstimate} / ${targetingEstimate}`);
          });
        }
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
debugUpload();

