require('dotenv').config();
const fileProcessor = require('./src/services/fileProcessor');
const path = require('path');

async function testFileProcessing() {
  console.log('🔍 Test du traitement de fichiers...\n');
  
  try {
    // Test avec le fichier américain
    const testFilePath = path.join(__dirname, 'test-us-zipcodes.csv');
    
    console.log('📁 Traitement du fichier:', testFilePath);
    
    // Lire le fichier CSV directement
    const fileData = await fileProcessor.readCSV(testFilePath);
    console.log('✅ Fichier lu avec succès');
    console.log('📊 Données brutes:', {
      headers: fileData.headers,
      totalRows: fileData.totalRows,
      sampleRows: fileData.rows ? fileData.rows.slice(0, 3) : 'No rows'
    });
    
    // Valider et nettoyer les données
    const validatedData = fileProcessor.validateAndCleanData(fileData);
    console.log('\n✅ Validation terminée');
    console.log('📈 Statistiques:', validatedData.statistics);
    
    // Afficher les codes postaux valides
    console.log('\n✅ Codes postaux valides:', validatedData.validPostalCodes.length);
    validatedData.validPostalCodes.slice(0, 5).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.value} (ligne ${item.row})`);
    });
    
    // Afficher les erreurs
    if (validatedData.invalidPostalCodes.length > 0) {
      console.log('\n❌ Codes postaux invalides:', validatedData.invalidPostalCodes.length);
      validatedData.invalidPostalCodes.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.value}" (ligne ${item.row}) - ${item.error}`);
      });
    }
    
    // Afficher les doublons
    if (validatedData.duplicates.length > 0) {
      console.log('\n⚠️ Doublons:', validatedData.duplicates.length);
      validatedData.duplicates.slice(0, 5).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.value} (ligne ${item.row})`);
      });
    }
    
    // Générer un aperçu
    const preview = fileProcessor.generatePreview(validatedData, 10);
    console.log('\n👀 Aperçu (10 premiers résultats):');
    console.log('Headers:', preview.headers);
    preview.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.value} - ${item.data[1]} (${item.data[2]})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  testFileProcessing()
    .then(() => {
      console.log('\n✅ Test terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erreur lors du test:', error);
      process.exit(1);
    });
}

module.exports = { testFileProcessing };
