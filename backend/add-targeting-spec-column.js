const { Pool } = require('pg');

async function addTargetingSpecColumn() {
  console.log('🔧 Adding targeting_spec column to projects table...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    return;
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
  });
  
  try {
    console.log('🔌 Connecting to Supabase...');
    const client = await pool.connect();
    console.log('✅ Connected to Supabase');
    
    // Vérifier si la colonne existe déjà
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'targeting_spec'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Column targeting_spec already exists');
    } else {
      console.log('📝 Adding targeting_spec column...');
      
      // Ajouter la colonne targeting_spec
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN targeting_spec JSONB
      `);
      
      console.log('✅ Column targeting_spec added successfully');
      
      // Créer l'index pour les performances
      try {
        await client.query(`
          CREATE INDEX idx_projects_targeting_spec 
          ON projects USING GIN (targeting_spec)
        `);
        console.log('✅ Index created for targeting_spec');
      } catch (indexError) {
        if (indexError.message.includes('already exists')) {
          console.log('⚠️ Index already exists');
        } else {
          console.error('❌ Error creating index:', indexError.message);
        }
      }
    }
    
    // Vérification finale
    const finalCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'targeting_spec'
    `);
    
    console.log('📋 Final check - targeting_spec column:', finalCheck.rows);
    
    client.release();
    console.log('✅ Targeting spec column setup completed!');
    
  } catch (error) {
    console.error('❌ Error adding targeting_spec column:', error.message);
    console.error('❌ Error details:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
addTargetingSpecColumn().catch(console.error);
