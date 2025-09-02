const { Pool } = require('pg');

async function quickTestConnection() {
  console.log('🔍 Test rapide de connexion Supabase...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    console.log('💡 Veuillez fournir votre DATABASE_URL Supabase');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('🔌 Test de connexion...');
    const client = await pool.connect();
    console.log('✅ Connexion réussie !');
    
    // Test simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log('⏰ Heure du serveur:', result.rows[0].current_time);
    
    // Vérifier les tables existantes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables existantes:', tablesResult.rows.map(row => row.table_name));
    
    client.release();
    console.log('✅ Test de connexion terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('💡 Vérifiez votre DATABASE_URL');
  } finally {
    await pool.end();
  }
}

// Exécuter le test
quickTestConnection().catch(console.error);
