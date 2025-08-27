// Test script to verify Meta API connection from frontend
const axios = require('axios');

async function testMetaConnection() {
  console.log('🔍 Test de connexion Meta API depuis le frontend...\n');
  
  try {
    const response = await axios.get('http://localhost:3001/api/meta/interests/search', {
      params: {
        q: 'fitness',
        limit: 3
      }
    });
    
    console.log('✅ Connexion réussie !');
    console.log('📊 Résultats:', response.data.data.length, 'intérêts trouvés');
    
    response.data.data.forEach((interest, index) => {
      console.log(`\n${index + 1}. ${interest.name}`);
      console.log(`   ID: ${interest.id}`);
      console.log(`   Audience: ${interest.audience_size_lower_bound.toLocaleString()} - ${interest.audience_size_upper_bound.toLocaleString()}`);
      console.log(`   Path: ${interest.path.join(' > ')}`);
      console.log(`   Topic: ${interest.topic}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testMetaConnection();
