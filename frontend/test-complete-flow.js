// Test script to verify the complete flow
const axios = require('axios');

async function testCompleteFlow() {
  console.log('🎯 Test du flux complet de l\'application...\n');
  
  // Test 1: Meta API connection
  console.log('1️⃣ Test de connexion Meta API...');
  try {
    const response = await axios.get('http://localhost:3001/api/meta/interests/search', {
      params: { q: 'fitness', limit: 3 }
    });
    console.log('✅ Meta API fonctionne:', response.data.data.length, 'résultats');
  } catch (error) {
    console.log('❌ Erreur Meta API:', error.message);
  }

  // Test 2: Health check
  console.log('\n2️⃣ Test du health check...');
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Backend fonctionne:', response.data.status);
  } catch (error) {
    console.log('❌ Erreur backend:', error.message);
  }

  // Test 3: Frontend connection
  console.log('\n3️⃣ Test du frontend...');
  try {
    const response = await axios.get('http://localhost:3000');
    console.log('✅ Frontend fonctionne (status:', response.status, ')');
  } catch (error) {
    console.log('❌ Erreur frontend:', error.message);
  }

  // Test 4: Simulate targeting data
  console.log('\n4️⃣ Test des données de targeting...');
  const mockTargetingData = {
    interests: [
      {
        id: '6003384248805',
        name: 'Fitness and wellness (fitness)',
        audience_size: 1083752219,
        audience_size_lower: 1083752219,
        audience_size_upper: 1274492610,
        path: ['Interests', 'Fitness and wellness (fitness)'],
        description: '',
        topic: 'Fitness and wellness'
      }
    ],
    age_min: 18,
    age_max: 65,
    genders: ['all'],
    countries: ['FR'],
    devices: ['all']
  };

  console.log('✅ Données de targeting simulées:', {
    interests: mockTargetingData.interests.length,
    age: `${mockTargetingData.age_min}-${mockTargetingData.age_max}`,
    countries: mockTargetingData.countries.join(', ')
  });

  // Test 5: Calculate audience estimate
  console.log('\n5️⃣ Test du calcul d\'audience...');
  const totalAudience = mockTargetingData.interests.reduce((sum, interest) => {
    const avgSize = interest.audience_size_lower && interest.audience_size_upper
      ? (interest.audience_size_lower + interest.audience_size_upper) / 2
      : interest.audience_size;
    return sum + avgSize;
  }, 0);

  // Apply targeting filters
  let filteredAudience = totalAudience;
  const ageRange = mockTargetingData.age_max - mockTargetingData.age_min;
  const ageFactor = ageRange / 47; // Assuming 18-65 range
  filteredAudience *= ageFactor;

  if (mockTargetingData.countries?.includes('FR')) {
    filteredAudience *= 0.08; // France represents ~8% of global Meta users
  }

  console.log('✅ Audience estimée:', {
    total: totalAudience.toLocaleString(),
    filtered: Math.round(filteredAudience).toLocaleString(),
    percentage: ((filteredAudience / totalAudience) * 100).toFixed(1) + '%'
  });

  console.log('\n🎉 Test du flux complet terminé !');
  console.log('\n📋 Prochaines étapes:');
  console.log('1. Ouvrir http://localhost:3000');
  console.log('2. Uploader un fichier CSV avec des codes postaux');
  console.log('3. Aller à la page Targeting');
  console.log('4. Rechercher des intérêts (ex: "fitness", "cooking")');
  console.log('5. Voir l\'estimation d\'audience en temps réel');
  console.log('6. Cliquer sur "Continuer vers l\'analyse"');
  console.log('7. Voir l\'analyse en cours et la redirection vers les résultats');
}

testCompleteFlow();
