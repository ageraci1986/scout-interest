const axios = require('axios');

async function checkDBStructure() {
  console.log('🔍 Checking database structure...');
  
  const baseURL = 'https://scout-interest-6n5aciqlb-angelo-geracis-projects.vercel.app';
  
  try {
    // Test 1: Vérifier les tables existantes
    console.log('\n📋 Test 1: Check existing tables...');
    try {
      const tablesResponse = await axios.get(`${baseURL}/api/debug/tables`);
      console.log('✅ Tables check successful:', tablesResponse.status, tablesResponse.data);
    } catch (error) {
      console.log('❌ Tables endpoint not available, trying alternative...');
      
      // Test alternatif : essayer de créer une table de test
      try {
        const createTestResponse = await axios.post(`${baseURL}/api/debug/create-test-table`);
        console.log('✅ Create test table successful:', createTestResponse.status, createTestResponse.data);
      } catch (createError) {
        console.log('❌ Create test table failed:', createError.response?.status, createError.response?.data);
      }
    }
    
    // Test 2: Vérifier la structure de la table projects
    console.log('\n📋 Test 2: Check projects table structure...');
    try {
      const structureResponse = await axios.get(`${baseURL}/api/debug/table-structure/projects`);
      console.log('✅ Table structure successful:', structureResponse.status, structureResponse.data);
    } catch (error) {
      console.log('❌ Table structure endpoint not available');
    }
    
    // Test 3: Essayer une requête SQL simple
    console.log('\n📋 Test 3: Try simple SQL query...');
    try {
      const simpleQueryResponse = await axios.get(`${baseURL}/api/debug/simple-query`);
      console.log('✅ Simple query successful:', simpleQueryResponse.status, simpleQueryResponse.data);
    } catch (error) {
      console.log('❌ Simple query failed:', error.response?.status, error.response?.data);
    }
    
    console.log('\n🎉 Database structure check completed!');
    
  } catch (error) {
    console.error('❌ Overall check failed:', error.message);
  }
}

// Exécuter le check
checkDBStructure().catch(console.error);
