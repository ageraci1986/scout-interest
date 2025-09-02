const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testVercelUpload() {
  console.log('🧪 Testing Vercel upload with memory storage...');
  
  // Créer un fichier de test simple
  const testContent = `Code Postal,Ville,Pays
75001,Paris,FR
75002,Paris,FR
75003,Paris,FR
75004,Paris,FR
75005,Paris,FR`;
  
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const filePath = path.join(testDir, 'test-vercel.csv');
  fs.writeFileSync(filePath, testContent);
  
  try {
    console.log('📤 Testing upload to Vercel...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: 'test-vercel.csv',
      contentType: 'text/csv'
    });

    const response = await axios.post('https://scout-interest.vercel.app/api/upload/file', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    console.log('✅ Upload successful!');
    console.log('📊 Response:', {
      success: response.data.success,
      message: response.data.message,
      uploadId: response.data.data?.uploadId,
      filename: response.data.data?.filename,
      statistics: response.data.data?.statistics
    });

    // Nettoyer
    fs.unlinkSync(filePath);
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Upload failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    // Nettoyer en cas d'erreur
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// Exécuter le test
testVercelUpload().catch(console.error);
