// Test script to verify the complete Meta UI integration
const axios = require('axios');

async function testMetaUI() {
  console.log('🎯 Test de l\'interface Meta complète...\n');
  
  const testQueries = ['fitness', 'cooking', 'travel', 'technology'];
  
  for (const query of testQueries) {
    console.log(`🔍 Test de recherche: "${query}"`);
    
    try {
      const response = await axios.get('http://localhost:3001/api/meta/interests/search', {
        params: {
          q: query,
          limit: 3
        }
      });
      
      const results = response.data.data;
      console.log(`✅ ${results.length} résultats trouvés`);
      
      results.forEach((interest, index) => {
        const avgAudience = interest.audience_size_lower_bound && interest.audience_size_upper_bound 
          ? Math.round((interest.audience_size_lower_bound + interest.audience_size_upper_bound) / 2)
          : interest.audience_size_lower_bound || 0;
        
        const audienceFormatted = avgAudience >= 1000000 
          ? `${(avgAudience / 1000000).toFixed(1)}M`
          : avgAudience >= 1000 
            ? `${(avgAudience / 1000).toFixed(1)}K`
            : avgAudience.toString();
        
        console.log(`  ${index + 1}. ${interest.name}`);
        console.log(`     Audience: ${audienceFormatted}`);
        console.log(`     Path: ${interest.path.join(' > ')}`);
        console.log(`     Topic: ${interest.topic}`);
      });
      
    } catch (error) {
      console.error(`❌ Erreur pour "${query}":`, error.message);
    }
    
    console.log('');
  }
  
  console.log('✅ Test terminé !');
}

testMetaUI();
