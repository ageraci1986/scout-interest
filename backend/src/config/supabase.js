// Configuration pour base de données locale SQLite
// Cette configuration sera facilement migrable vers Supabase plus tard

console.log('✅ Using local SQLite database (easily migrable to Supabase)');

module.exports = {
  supabase: null,
  isMock: false // Plus de mock, on utilise SQLite
};
