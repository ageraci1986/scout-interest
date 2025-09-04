// Test simple pour vérifier le chargement des routes
console.log('🧪 Test de chargement des routes...');

try {
  console.log('📁 Test 1: Chargement des routes Meta...');
  const metaRoutes = require('./src/routes/meta');
  console.log('✅ Routes Meta chargées avec succès');
  
  console.log('📁 Test 2: Chargement des routes Projects...');
  const projectRoutes = require('./src/routes/projects');
  console.log('✅ Routes Projects chargées avec succès');
  
  console.log('📁 Test 3: Chargement des routes Upload...');
  const uploadRoutes = require('./src/routes/upload');
  console.log('✅ Routes Upload chargées avec succès');
  
  console.log('🎉 Toutes les routes sont chargées correctement !');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes:', error.message);
  console.error('Stack:', error.stack);
}

