const { Pool } = require('pg');

async function testSupabaseFullConnection() {
  console.log('🔍 Testing complete Supabase connection...');
  
  // Vérifier les variables d'environnement
  console.log('📋 Environment variables:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'undefined');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    console.log('💡 Please set your Supabase DATABASE_URL in your environment');
    console.log('💡 Format: postgresql://postgres.wnugqzgzzwmebjjsfrns:VOTRE_MOT_DE_PASSE@aws-1-eu-west-3.pooler.supabase.com:5432/postgres');
    return;
  }
  
  // Analyser l'URL de connexion
  try {
    const url = new URL(process.env.DATABASE_URL);
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
    const url = new URL(process.env.DATABASE_URL);
    console.log('🌐 Testing DNS resolution for:', url.hostname);
    const addresses = await dns.resolve4(url.hostname);
    console.log('✅ DNS resolution successful:', addresses);
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
    return;
  }
  
  // Tester la connexion PostgreSQL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  
  try {
    console.log('🔌 Testing PostgreSQL connection...');
    const client = await pool.connect();
    console.log('✅ PostgreSQL connection successful!');
    
    // Tester une requête simple
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database query successful:');
    console.log('- Current time:', result.rows[0].current_time);
    console.log('- PostgreSQL version:', result.rows[0].pg_version.split(' ')[0]);
    
    // Vérifier les tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('📋 Available tables:', tablesResult.rows.map(row => row.table_name));
    
    // Vérifier si les tables de notre application existent
    const appTables = ['projects', 'processing_results'];
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('🔍 Checking application tables:');
    for (const table of appTables) {
      if (existingTables.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
        
        // Compter les lignes
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   - Rows: ${countResult.rows[0].count}`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    client.release();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 This is a DNS resolution error. Check your DATABASE_URL.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused. Check if the database is accessible.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timeout. Check network connectivity.');
    } else if (error.message.includes('authentication')) {
      console.log('💡 Authentication failed. Check username/password in DATABASE_URL.');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Database does not exist. Check the database name in your URL.');
    }
  } finally {
    await pool.end();
  }
}

// Exécuter le test
testSupabaseFullConnection().catch(console.error);
