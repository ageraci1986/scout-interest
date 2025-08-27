// Test script pour différents formats de ciblage par code postal
const axios = require('axios');

async function testPostalCodeFormats() {
  console.log('🔍 Test de différents formats de ciblage par code postal...\n');

  const adAccountId = 'act_379481728925498';
  const postalCode = '10001';
  const country = 'US';

  const formats = [
    {
      name: 'Format 1: postal_codes dans geo_locations',
      targetingSpec: {
        geo_locations: {
          postal_codes: [`${country}:${postalCode}`]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Format 2: postal_codes directement dans targeting_spec',
      targetingSpec: {
        postal_codes: [`${country}:${postalCode}`],
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Format 3: geo_locations avec cities et postal_codes',
      targetingSpec: {
        geo_locations: {
          cities: [{
            key: `${country}:${postalCode}`,
            name: 'New York',
            region: 'NY',
            country: country
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Format 4: geo_locations avec regions et postal_codes',
      targetingSpec: {
        geo_locations: {
          regions: [{
            key: `${country}:${postalCode}`,
            name: 'New York',
            country: country
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Format 5: geo_locations avec zips (format US)',
      targetingSpec: {
        geo_locations: {
          zips: [postalCode]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Format 6: geo_locations avec postal_codes comme array simple',
      targetingSpec: {
        geo_locations: [`${country}:${postalCode}`],
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    }
  ];

  for (let i = 0; i < formats.length; i++) {
    const format = formats[i];
    console.log(`${i + 1}️⃣ Test: ${format.name}`);
    
    try {
      const response = await axios.post('http://localhost:3001/api/meta/reach-estimate', {
        adAccountId: adAccountId,
        targetingSpec: format.targetingSpec
      });
      
      console.log('✅ SUCCÈS:', {
        format: format.name,
        reachEstimate: response.data.data
      });
      
      // Si on trouve un format qui marche, on s'arrête
      console.log('🎉 Format trouvé !');
      return format;
      
    } catch (error) {
      console.log('❌ ÉCHEC:', {
        format: format.name,
        error: error.response?.data?.message || error.message
      });
    }
    
    console.log(''); // Ligne vide pour séparer
  }

  console.log('❌ Aucun format n\'a fonctionné. Testons avec curl directement...');
  
  // Test direct avec curl pour voir la réponse exacte
  console.log('\n🔧 Test direct avec curl...');
  const testFormat = formats[0]; // Premier format
  const targetingSpec = JSON.stringify(testFormat.targetingSpec);
  
  console.log('Targeting spec testé:', targetingSpec);
  console.log('URL de test: https://graph.facebook.com/v23.0/' + adAccountId + '/reachestimate');
  console.log('Paramètres: targeting_spec=' + encodeURIComponent(targetingSpec) + '&optimization_goal=REACH');
}

testPostalCodeFormats();
