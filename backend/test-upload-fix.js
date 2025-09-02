const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration de test
const TEST_CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  testFiles: [
    {
      name: 'test-postal-codes.csv',
      content: `Code Postal,Ville,Pays
75001,Paris,FR
75002,Paris,FR
75003,Paris,FR
75004,Paris,FR
75005,Paris,FR`,
      type: 'text/csv'
    }
  ]
};

// Créer un fichier de test
function createTestFile(filename, content) {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Test de l'upload de fichier
async function testFileUpload(filePath, filename) {
  try {
    console.log(`📤 Testing upload for: ${filename}`);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: filename,
      contentType: 'text/csv'
    });

    const response = await axios.post(`${TEST_CONFIG.apiUrl}/api/upload/file`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000 // 30 secondes timeout
    });

    console.log('✅ Upload successful!');
    console.log('📊 Response:', {
      success: response.data.success,
      message: response.data.message,
      uploadId: response.data.data?.uploadId,
      filename: response.data.data?.filename,
      statistics: response.data.data?.statistics,
      headers: response.data.data?.headers,
      postalCodeColumn: response.data.data?.postalCodeColumn
    });

    return response.data;
  } catch (error) {
    console.error('❌ Upload failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    throw error;
  }
}

// Test de validation de fichier
async function testFileValidation(filePath, filename) {
  try {
    console.log(`🔍 Testing validation for: ${filename}`);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: filename,
      contentType: 'text/csv'
    });

    const response = await axios.post(`${TEST_CONFIG.apiUrl}/api/upload/validate`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    console.log('✅ Validation successful!');
    console.log('📊 Validation response:', {
      success: response.data.success,
      message: response.data.message,
      filename: response.data.data?.filename,
      statistics: response.data.data?.statistics,
      invalidPostalCodes: response.data.data?.invalidPostalCodes?.length || 0,
      duplicates: response.data.data?.duplicates?.length || 0
    });

    return response.data;
  } catch (error) {
    console.error('❌ Validation failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    throw error;
  }
}

// Test principal
async function runTests() {
  console.log('🧪 Starting upload tests...');
  console.log('🌐 API URL:', TEST_CONFIG.apiUrl);
  
  try {
    // Test 1: Upload de fichier
    for (const testFile of TEST_CONFIG.testFiles) {
      console.log(`\n📁 Testing file: ${testFile.name}`);
      
      const filePath = createTestFile(testFile.name, testFile.content);
      console.log(`📝 Created test file: ${filePath}`);
      
      // Test d'upload
      await testFileUpload(filePath, testFile.name);
      
      // Test de validation
      await testFileValidation(filePath, testFile.name);
      
      // Nettoyer le fichier de test
      fs.unlinkSync(filePath);
      console.log(`🧹 Cleaned up test file: ${filePath}`);
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
runTests().catch(console.error);
