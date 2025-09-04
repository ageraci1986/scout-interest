require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'CONFIGURÉ' : 'MANQUANT');

if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test de connexion simple
    supabase.from('projects').select('count').limit(1)
        .then(({ data, error }) => {
            if (error) {
                console.log('❌ Erreur Supabase:', error.message);
            } else {
                console.log('✅ Connexion Supabase réussie');
            }
        })
        .catch(err => {
            console.log('❌ Erreur de connexion:', err.message);
        });
} else {
    console.log('❌ Variables Supabase manquantes');
}
