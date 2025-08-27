// Test script pour le format correct des codes postaux
const axios = require('axios');

async function testCorrectPostalFormat() {
  console.log('🔍 Test du format correct pour les codes postaux...\n');

  const adAccountId = 'act_379481728925498';
  const postalCode = '10001';
  const country = 'US';

  const formats = [
    {
      name: 'Format 1: zips avec objet JSON (US)',
      targetingSpec: {
        geo_locations: {
          zips: [{
            key: postalCode,
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
      name: 'Format 2: zips avec objet simple (US)',
      targetingSpec: {
        geo_locations: {
          zips: [{
            key: postalCode
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Format 3: postal_codes avec objet JSON',
      targetingSpec: {
        geo_locations: {
          postal_codes: [{
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
      name: 'Format 4: postal_codes avec objet simple',
      targetingSpec: {
        geo_locations: {
          postal_codes: [{
            key: `${country}:${postalCode}`
          }]
        },
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      }
    },
    {
      name: 'Format 5: postal_codes avec objet et ID numérique',
      targetingSpec: {
        geo_locations: {
          postal_codes: [{
            key: postalCode,
            country: country
          }]
        },
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
    console.log('Targeting spec:', JSON.stringify(format.targetingSpec, null, 2));
    
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

  console.log('❌ Aucun format n\'a fonctionné. Testons avec l\'API de recherche de ciblage...');
  
  // Test avec l'API de recherche de ciblage pour voir les formats supportés
  console.log('\n🔧 Test avec l\'API de recherche de ciblage...');
  try {
    const searchResponse = await axios.get(`http://localhost:3001/api/meta/targeting-sentence-lines?adAccountId=${adAccountId}&q=10001`);
    console.log('Résultats de recherche:', searchResponse.data);
  } catch (error) {
    console.log('Erreur recherche:', error.response?.data || error.message);
  }
}

testCorrectPostalFormat();
