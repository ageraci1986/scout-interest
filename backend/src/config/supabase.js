const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://scout-interest-optimized-a9fxapxv5-angelo-geracis-projects.vercel.app';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'default_anon_key';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Log de la configuration
console.log('🔧 Configuration Supabase:', {
  url: supabaseUrl,
  hasKey: !!supabaseKey,
  timestamp: new Date().toISOString()
});

module.exports = {
  supabase,
  isMock: false // On utilise Supabase directement
};
