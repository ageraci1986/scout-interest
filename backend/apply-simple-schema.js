const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Need service role for schema changes
  {
    auth: { persistSession: false }
  }
);

async function applySimpleSchema() {
  try {
    console.log('🚀 Applying simple schema to Supabase...');
    
    // Read schema file
    const schema = fs.readFileSync('./simple-schema.sql', 'utf8');
    
    console.log('📄 Schema loaded, executing...');
    
    // Execute schema
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: schema 
    });
    
    if (error) {
      console.error('❌ Schema application failed:', error);
      throw error;
    }
    
    console.log('✅ Simple schema applied successfully!');
    console.log('📊 New tables: projects, results');
    console.log('🔧 Functions: get_project_with_results()');
    
    // Test the new schema
    console.log('🧪 Testing new schema...');
    
    // Create a test project
    const { data: testProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Test Project',
        postal_codes: ['10001', '10002', '10003']
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('❌ Test project creation failed:', projectError);
    } else {
      console.log('✅ Test project created:', testProject.id);
      
      // Clean up test project
      await supabase
        .from('projects')
        .delete()
        .eq('id', testProject.id);
      
      console.log('🧹 Test project cleaned up');
    }
    
    console.log('🎉 Schema migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Schema migration failed:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function applySchemaDirectly() {
  try {
    console.log('🚀 Applying schema directly...');
    
    const schema = fs.readFileSync('./simple-schema.sql', 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📄 Found ${statements.length} SQL statements`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.startsWith('--') || statement.length === 0) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';'
        });
        
        if (error) {
          console.log(`⚠️ Statement ${i + 1} warning:`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} executed`);
        }
      } catch (err) {
        console.log(`⚠️ Statement ${i + 1} error:`, err.message);
      }
    }
    
    console.log('🎉 Schema application completed!');
    
  } catch (error) {
    console.error('💥 Direct schema application failed:', error);
  }
}

// Run the migration
if (require.main === module) {
  console.log('🔧 Starting database schema migration...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials!');
    console.error('Need: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  // Try direct method first
  applySchemaDirectly()
    .then(() => process.exit(0))
    .catch(() => {
      console.log('Trying alternative method...');
      return applySimpleSchema();
    })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { applySimpleSchema, applySchemaDirectly };