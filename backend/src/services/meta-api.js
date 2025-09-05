const META_API_BASE = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

console.log('🔧 Meta API Service Loaded');
console.log('🔍 ACCESS_TOKEN exists:', !!ACCESS_TOKEN);
console.log('🔍 AD_ACCOUNT_ID:', AD_ACCOUNT_ID);

if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
  console.error('❌ Meta API credentials missing!');
  console.error('Besoin de: META_ACCESS_TOKEN et META_AD_ACCOUNT_ID');
}

// Fonction helper pour faire des requêtes HTTP avec fetch
async function makeRequest(url) {
  try {
    console.log('📡 Making request to:', url.replace(ACCESS_TOKEN, 'ACCESS_TOKEN_HIDDEN'));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Scout-Interest/1.0'
      }
    });
    
    const responseText = await response.text();
    console.log('📡 Response status:', response.status);
    console.log('📡 Response:', responseText);
    
    const parsed = JSON.parse(responseText);
    
    if (!response.ok || parsed.error) {
      const errorMessage = parsed.error ? 
        `${parsed.error.message} (Code: ${parsed.error.code})` : 
        `HTTP ${response.status}`;
      throw new Error(`Meta API Error: ${errorMessage}`);
    }
    
    return parsed;
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    throw error;
  }
}

// Get geo audience (just postal code targeting)
async function getGeoAudience(postalCode, countryCode = 'US') {
  try {
    console.log(`🌍 Getting geo audience for ${postalCode} in ${countryCode}...`);
    
    // Create the Meta API key directly: COUNTRY_CODE:POSTAL_CODE
    const metaKey = `${countryCode}:${postalCode}`;
    console.log(`🔑 Using Meta key: ${metaKey}`);
    
    // Create targeting spec with the constructed key
    const targetingSpec = {
      geo_locations: {
        zips: [{
          key: metaKey
        }]
      }
    };
    
    const params = new URLSearchParams({
      access_token: ACCESS_TOKEN,
      targeting_spec: JSON.stringify(targetingSpec),
      optimization_goal: 'REACH' // Required parameter
    });
    
    const url = `${META_API_BASE}/${AD_ACCOUNT_ID}/reachestimate?${params}`;
    const response = await makeRequest(url);
    
    // Extract audience estimate from Meta API response
    const estimate = response.data?.users_lower_bound || 0;
    
    console.log(`📊 Geo audience for ${postalCode}: ${estimate}`);
    return estimate;
    
  } catch (error) {
    console.error(`❌ Geo audience error for ${postalCode}:`, error.message);
    throw error;
  }
}

// Get targeting audience (postal code + targeting criteria)
async function getTargetingAudience(postalCode, targetingCriteria, countryCode = 'US') {
  try {
    console.log(`🎯 Getting targeting audience for ${postalCode} in ${countryCode}...`);
    
    // Create the Meta API key directly: COUNTRY_CODE:POSTAL_CODE
    const metaKey = `${countryCode}:${postalCode}`;
    console.log(`🔑 Using Meta key: ${metaKey}`);
    
    // Create targeting spec with the constructed key + targeting criteria (excluding geo_locations)
    const cleanTargetingCriteria = { ...targetingCriteria };
    
    // Remove fields that conflict with our postal code targeting
    delete cleanTargetingCriteria.geo_locations;
    delete cleanTargetingCriteria.countries;
    
    // Handle interestGroups conversion with proper AND logic using flexible_spec
    if (cleanTargetingCriteria.interestGroups && Array.isArray(cleanTargetingCriteria.interestGroups)) {
      // Use flexible_spec for AND logic between interest groups
      const flexibleSpec = [];
      
      for (const group of cleanTargetingCriteria.interestGroups) {
        if (group.interests && Array.isArray(group.interests)) {
          // Each group becomes an OR clause within the AND logic
          const groupInterests = group.interests.map(interest => ({
            id: interest.id,
            name: interest.name
          }));
          
          if (groupInterests.length > 0) {
            flexibleSpec.push({
              interests: groupInterests
            });
          }
        }
      }
      
      if (flexibleSpec.length > 0) {
        cleanTargetingCriteria.flexible_spec = flexibleSpec;
        console.log('🎯 Using flexible_spec for AND logic:', JSON.stringify(flexibleSpec, null, 2));
      }
      
      delete cleanTargetingCriteria.interestGroups;
    }
    
    // Clean up empty arrays
    if (cleanTargetingCriteria.genders && cleanTargetingCriteria.genders.length === 0) {
      delete cleanTargetingCriteria.genders;
    }
    if (cleanTargetingCriteria.device_platforms && cleanTargetingCriteria.device_platforms.length === 0) {
      delete cleanTargetingCriteria.device_platforms;
    }
    
    const targetingSpec = {
      geo_locations: {
        zips: [{
          key: metaKey
        }]
      },
      ...cleanTargetingCriteria
    };
    
    console.log('🎯 Final targeting spec:', JSON.stringify(targetingSpec, null, 2));
    
    const params = new URLSearchParams({
      access_token: ACCESS_TOKEN,
      targeting_spec: JSON.stringify(targetingSpec),
      optimization_goal: 'REACH' // Required parameter
    });
    
    const url = `${META_API_BASE}/${AD_ACCOUNT_ID}/reachestimate?${params}`;
    const response = await makeRequest(url);
    
    // Extract audience estimate from Meta API response
    const estimate = response.data?.users_lower_bound || 0;
    
    console.log(`📊 Targeting audience for ${postalCode}: ${estimate}`);
    return estimate;
    
  } catch (error) {
    console.error(`❌ Targeting audience error for ${postalCode}:`, error.message);
    throw error;
  }
}

// Test function
async function testMetaAPI() {
  try {
    console.log('🧪 Testing Meta API...');
    
    if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
      throw new Error('Meta API credentials not configured');
    }
    
    // Test with a simple postal code
    const testPostalCode = '10001';
    const geoAudience = await getGeoAudience(testPostalCode);
    console.log(`✅ Test successful! Geo audience for ${testPostalCode}: ${geoAudience}`);
    
    return true;
  } catch (error) {
    console.error('❌ Meta API test failed:', error.message);
    return false;
  }
}

module.exports = {
  getGeoAudience,
  getTargetingAudience,
  testMetaAPI
};