// Test script pour des codes postaux valides et autres formats
const axios = require('axios');

async function testValidPostalCodes() {
  console.log('🔍 Test avec des codes postaux valides et autres formats...\n');

  const adAccountId = 'act_379481728925498';

  const testCases = [
    {
      name: 'Test 1: Code postal US valide (90210 - Beverly Hills)',
      targetingSpec: {
        geo_locations: {
          zips: [{
            key: '90210'
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Test 2: Code postal US valide (10001 avec plus d\'infos)',
      targetingSpec: {
        geo_locations: {
          zips: [{
            key: '10001',
            name: 'New York',
            region: 'NY',
            country: 'US'
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Test 3: Code postal US valide (33101 - Miami)',
      targetingSpec: {
        geo_locations: {
          zips: [{
            key: '33101'
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Test 4: Code postal US valide (94102 - San Francisco)',
      targetingSpec: {
        geo_locations: {
          zips: [{
            key: '94102'
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Test 5: Code postal US valide (20001 - Washington DC)',
      targetingSpec: {
        geo_locations: {
          zips: [{
            key: '20001'
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Test 6: Géolocalisation par ville (New York)',
      targetingSpec: {
        geo_locations: {
          cities: [{
            key: '2434',
            name: 'New York',
            region: 'NY',
            country: 'US'
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Test 7: Géolocalisation par région (New York State)',
      targetingSpec: {
        geo_locations: {
          regions: [{
            key: '3886',
            name: 'New York',
            country: 'US'
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 1}️⃣ ${testCase.name}`);
    console.log('Targeting spec:', JSON.stringify(testCase.targetingSpec, null, 2));
    
    try {
      const response = await axios.post('http://localhost:3001/api/meta/reach-estimate', {
        adAccountId: adAccountId,
        targetingSpec: testCase.targetingSpec
      });
      
      console.log('✅ SUCCÈS:', {
        testCase: testCase.name,
        reachEstimate: response.data.data
      });
      
      // Si on trouve un format qui marche, on continue pour voir les autres
      console.log('🎉 Format fonctionnel trouvé !');
      
    } catch (error) {
      console.log('❌ ÉCHEC:', {
        testCase: testCase.name,
        error: error.response?.data?.message || error.message
      });
    }
    
    console.log(''); // Ligne vide pour séparer
  }

  console.log('📋 Résumé des tests :');
  console.log('- Si aucun code postal ne fonctionne, Meta pourrait utiliser un système différent');
  console.log('- Les villes et régions pourraient être une alternative');
  console.log('- Il faudrait peut-être utiliser l\'API de recherche pour trouver les bons IDs');
}

testValidPostalCodes();
