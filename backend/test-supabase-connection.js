const { Pool } = require('pg');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection with pooler URL...');
  
  // URL de test avec le pooler Supabase
  const testDatabaseUrl = 'postgresql://postgres.wnugqzgzzwmebjjsfrns:[YOUR-PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres';
  
  console.log('📋 Testing URL format:', testDatabaseUrl.replace(/:[^:@]*@/, ':***@'));
  
  // Analyser l'URL de connexion
  try {
    const url = new URL(testDatabaseUrl);
    console.log('🔗 Connection URL analysis:');
    console.log('- Protocol:', url.protocol);
    console.log('- Hostname:', url.hostname);
    console.log('- Port:', url.port);
    console.log('- Database:', url.pathname);
    console.log('- Username:', url.username);
    console.log('- Password:', url.password ? '***' : 'Not set');
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error.message);
    return;
  }
  
  // Tester la résolution DNS
  const dns = require('dns').promises;
  try {
    const url = new URL(testDatabaseUrl);
    console.log('🌐 Testing DNS resolution for:', url.hostname);
    const addresses = await dns.resolve4(url.hostname);
    console.log('✅ DNS resolution successful:', addresses);
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
    return;
  }
  
  console.log('\n💡 Pour tester la connexion complète, vous devez :');
  console.log('1. Remplacer [YOUR-PASSWORD] par votre vrai mot de passe Supabase');
  console.log('2. Exécuter : DATABASE_URL="postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" node test-supabase-connection.js');
  console.log('\n🔧 Ou créer un fichier .env avec :');
  console.log('DATABASE_URL=postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres');
}

// Exécuter le test
testSupabaseConnection().catch(console.error);
