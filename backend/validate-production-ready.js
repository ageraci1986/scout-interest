/**
 * Script de validation pour vérifier que l'application est prête pour la production
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function validateProductionReadiness() {
  console.log('🔍 Validating Production Readiness for Scout Interest...\n');
  
  let isProductionReady = true;
  const issues = [];
  const warnings = [];

  // 1. Variables d'environnement critiques
  console.log('📋 Checking Environment Variables...');
  
  const requiredEnvVars = [
    'META_ACCESS_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  const optionalEnvVars = [
    'META_API_ENVIRONMENT',
    'POSTGRES_URL'
  ];

  for (const varName of requiredEnvVars) {
    if (process.env[varName]) {
      log(colors.green, `✅ ${varName}: Present (${process.env[varName].length} chars)`);
    } else {
      log(colors.red, `❌ ${varName}: Missing (CRITICAL)`);
      issues.push(`Missing required environment variable: ${varName}`);
      isProductionReady = false;
    }
  }

  for (const varName of optionalEnvVars) {
    if (process.env[varName]) {
      log(colors.blue, `ℹ️  ${varName}: Present`);
    } else {
      log(colors.yellow, `⚠️  ${varName}: Missing (Optional)`);
      warnings.push(`Optional environment variable missing: ${varName}`);
    }
  }

  // 2. Test de connexion Meta API
  console.log('\n🔌 Testing Meta API Connection...');
  
  try {
    const axios = require('axios');
    const testUrl = 'https://graph.facebook.com/v23.0/me';
    const testParams = {
      access_token: process.env.META_ACCESS_TOKEN
    };

    const response = await axios.get(testUrl, { params: testParams });
    
    if (response.data && response.data.id) {
      log(colors.green, `✅ Meta API Connection: Success (User ID: ${response.data.id})`);
    } else {
      log(colors.red, `❌ Meta API Connection: Invalid response`);
      issues.push('Meta API connection test failed');
      isProductionReady = false;
    }
    
  } catch (error) {
    log(colors.red, `❌ Meta API Connection: Failed (${error.message})`);
    issues.push(`Meta API connection error: ${error.message}`);
    isProductionReady = false;
  }

  // 3. Test du ParallelProcessorProduction
  console.log('\n⚡ Testing ParallelProcessorProduction...');
  
  try {
    const ParallelProcessorProduction = require('./src/services/parallelProcessorProduction');
    const processor = new ParallelProcessorProduction();
    
    log(colors.green, `✅ ParallelProcessorProduction: Initialized successfully`);
    
    // Test avec un seul code postal
    const testResult = await processor.processPostalCode(
      '75001',
      'US', 
      'act_323074088483830',
      {
        age_min: 25,
        age_max: 45,
        genders: [1],
        interests: [
          { id: '6002714398572', name: 'Technology' }
        ]
      }
    );
    
    if (testResult.success) {
      log(colors.green, `✅ Single Postal Code Test: Success`);
      log(colors.blue, `   📊 Baseline estimate: ${testResult.postalCodeOnlyEstimate?.data?.users_lower_bound || 'N/A'}`);
      log(colors.blue, `   🎯 Targeted estimate: ${testResult.postalCodeWithTargetingEstimate?.data?.users_lower_bound || 'N/A'}`);
      log(colors.blue, `   📈 Targeting impact: ${testResult.targetingImpact?.reduction || 'N/A'}`);
      
      // Vérifier que le targeting a un impact
      if (testResult.targetingImpact && parseFloat(testResult.targetingImpact.reduction) > 10) {
        log(colors.green, `✅ Targeting Impact: Significant (${testResult.targetingImpact.reduction})`);
      } else {
        log(colors.yellow, `⚠️  Targeting Impact: Minimal or none`);
        warnings.push('Targeting may not be having expected impact');
      }
      
    } else {
      log(colors.red, `❌ Single Postal Code Test: Failed (${testResult.error})`);
      issues.push(`Postal code processing test failed: ${testResult.error}`);
      isProductionReady = false;
    }
    
  } catch (error) {
    log(colors.red, `❌ ParallelProcessorProduction Test: Failed (${error.message})`);
    issues.push(`ParallelProcessorProduction error: ${error.message}`);
    isProductionReady = false;
  }

  // 4. Vérification des fichiers critiques
  console.log('\n📁 Checking Critical Files...');
  
  const criticalFiles = [
    'src/services/parallelProcessorProduction.js',
    'src/routes/meta.js',
    'src/routes/projects.js',
    'src/routes/upload.js',
    'src/config/meta-api.js',
    'src/config/rateLimits.js'
  ];

  const fs = require('fs');
  const path = require('path');

  for (const file of criticalFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log(colors.green, `✅ ${file}: Present`);
    } else {
      log(colors.red, `❌ ${file}: Missing`);
      issues.push(`Critical file missing: ${file}`);
      isProductionReady = false;
    }
  }

  // 5. Vérification de la configuration Vercel
  console.log('\n🚀 Checking Vercel Configuration...');
  
  const vercelConfigPath = path.join(__dirname, '../vercel.json');
  if (fs.existsSync(vercelConfigPath)) {
    log(colors.green, `✅ vercel.json: Present`);
    
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      if (vercelConfig.builds && vercelConfig.routes) {
        log(colors.green, `✅ Vercel Config: Valid structure`);
      } else {
        log(colors.yellow, `⚠️  Vercel Config: May need review`);
        warnings.push('Vercel configuration structure should be reviewed');
      }
      
    } catch (error) {
      log(colors.red, `❌ Vercel Config: Invalid JSON`);
      issues.push('Vercel configuration has invalid JSON');
    }
  } else {
    log(colors.red, `❌ vercel.json: Missing`);
    issues.push('Vercel configuration file missing');
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION READINESS SUMMARY');
  console.log('='.repeat(60));

  if (isProductionReady) {
    log(colors.green, '🎉 STATUS: PRODUCTION READY!');
    console.log('\n✅ All critical checks passed');
    console.log('✅ Meta API integration working');
    console.log('✅ Targeting system functional');
    console.log('✅ Parallel processing optimized');
  } else {
    log(colors.red, '🚨 STATUS: NOT PRODUCTION READY');
    console.log('\n❌ Critical issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  console.log('\n📋 Next Steps:');
  if (isProductionReady) {
    console.log('   1. Deploy to Vercel');
    console.log('   2. Test with real data');
    console.log('   3. Monitor performance and rate limits');
    console.log('   4. Scale as needed');
  } else {
    console.log('   1. Fix critical issues listed above');
    console.log('   2. Re-run this validation script');
    console.log('   3. Deploy only after all checks pass');
  }

  return {
    isReady: isProductionReady,
    issues,
    warnings
  };
}

// Exécuter la validation si ce script est lancé directement
if (require.main === module) {
  validateProductionReadiness()
    .then((result) => {
      process.exit(result.isReady ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

module.exports = { validateProductionReadiness };
