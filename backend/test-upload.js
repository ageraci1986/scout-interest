const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration de test
const TEST_CONFIG = {
  apiUrl: 'http://localhost:3001',
  testFiles: [
    {
      name: 'test-postal-codes.csv',
      content: `Code Postal,Ville,Pays
10001,New York,US
10002,New York,US
75001,Paris,FR
75002,Paris,FR
75003,Paris,FR`
    },
    {
      name: 'test-postal-codes-simple.csv',
      content: `PostalCode
10001
10002
75001
75002
75003`
    }
  ]
};

// Créer un fichier de test temporaire
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
      statistics: response.data.data?.statistics,
      invalidPostalCodes: response.data.data?.invalidPostalCodes?.length || 0,
      duplicates: response.data.data?.duplicates?.length || 0
    });

    return response.data;
  } catch (error) {
    console.error('❌ Validation failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message
    });
    throw error;
  }
}

// Test de la santé du serveur
async function testServerHealth() {
  try {
    console.log('🏥 Testing server health...');
    
    const response = await axios.get(`${TEST_CONFIG.apiUrl}/api/health`, {
      timeout: 5000
    });

    console.log('✅ Server is healthy:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

// Test des routes d'upload
async function testUploadRoutes() {
  try {
    console.log('🔗 Testing upload routes...');
    
    // Test GET /api/upload (si elle existe)
    try {
      const response = await axios.get(`${TEST_CONFIG.apiUrl}/api/upload`);
      console.log('✅ GET /api/upload response:', response.data);
    } catch (error) {
      console.log('ℹ️ GET /api/upload not available (expected)');
    }

    return true;
  } catch (error) {
    console.error('❌ Upload routes test failed:', error.message);
    return false;
  }
}

// Test de création de fichiers de test
async function createTestFiles() {
  console.log('📝 Creating test files...');
  
  const testFiles = [];
  
  for (const testFile of TEST_CONFIG.testFiles) {
    const filePath = createTestFile(testFile.name, testFile.content);
    testFiles.push({
      path: filePath,
      name: testFile.name,
      content: testFile.content
    });
    console.log(`✅ Created test file: ${filePath}`);
  }
  
  return testFiles;
}

// Nettoyer les fichiers de test
function cleanupTestFiles(testFiles) {
  console.log('🧹 Cleaning up test files...');
  
  for (const testFile of testFiles) {
    try {
      fs.unlinkSync(testFile.path);
      console.log(`✅ Deleted: ${testFile.path}`);
    } catch (error) {
      console.log(`⚠️ Could not delete: ${testFile.path}`, error.message);
    }
  }
  
  // Supprimer le dossier de test s'il est vide
  const testDir = path.join(__dirname, 'test-files');
  try {
    const files = fs.readdirSync(testDir);
    if (files.length === 0) {
      fs.rmdirSync(testDir);
      console.log('✅ Deleted test directory');
    }
  } catch (error) {
    // Dossier déjà supprimé ou erreur
  }
}

// Test principal
async function runUploadTests() {
  console.log('🚀 Starting Upload System Tests');
  console.log('================================\n');

  let testFiles = [];

  try {
    // 1. Test de la santé du serveur
    const serverHealthy = await testServerHealth();
    if (!serverHealthy) {
      console.error('❌ Server is not healthy. Please start the backend server first.');
      return;
    }

    // 2. Test des routes d'upload
    await testUploadRoutes();

    // 3. Créer les fichiers de test
    testFiles = await createTestFiles();

    // 4. Tester l'upload de chaque fichier
    for (const testFile of testFiles) {
      console.log(`\n📁 Testing file: ${testFile.name}`);
      console.log('📄 Content preview:');
      console.log(testFile.content);
      console.log('');

      try {
        // Test d'upload
        const uploadResult = await testFileUpload(testFile.path, testFile.name);
        
        // Test de validation
        await testFileValidation(testFile.path, testFile.name);
        
        console.log('✅ All tests passed for this file!\n');
      } catch (error) {
        console.error(`❌ Tests failed for ${testFile.name}\n`);
      }
    }

    console.log('🎉 Upload system tests completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    // Nettoyer les fichiers de test
    cleanupTestFiles(testFiles);
  }
}

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    const response = await axios.get(`${TEST_CONFIG.apiUrl}/api/health`);
    console.log('✅ Backend server is accessible');
    return true;
  } catch (error) {
    console.error('❌ Backend server is not accessible. Please start the server first.');
    console.error('Run: cd backend && node src/server.js');
    return false;
  }
}

// Exécution principale
async function main() {
  const serverAvailable = await checkServer();
  if (!serverAvailable) {
    process.exit(1);
  }
  
  await runUploadTests();
}

main().catch(console.error);


