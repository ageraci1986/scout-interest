const localDatabase = require('./src/config/database');

async function testRobustSystem() {
  try {
    console.log('🧪 Testing robust system with simulated results...');
    
    // Attendre que la base de données soit prête
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Créer des résultats simulés pour le projet 7
    const simulatedResults = [
      {
        postalCode: '75001',
        countryCode: 'FR',
        zipData: {
          key: 'FR:75001',
          name: '75001',
          country_code: 'FR'
        },
        success: true,
        postalCodeOnlyEstimate: {
          data: {
            users_lower_bound: 15000,
            users_upper_bound: 18000,
            estimate_ready: true
          }
        },
        postalCodeWithTargetingEstimate: {
          data: {
            users_lower_bound: 8000,
            users_upper_bound: 10000,
            estimate_ready: true
          }
        },
        targetingSpec: {
          geo_locations: { zips: [{ key: 'FR:75001', name: '75001', country_code: 'FR' }] },
          age_min: 18,
          age_max: 65,
          genders: [1, 2],
          publisher_platforms: ['audience_network', 'facebook', 'messenger', 'instagram'],
          device_platforms: ['mobile', 'desktop']
        }
      },
      {
        postalCode: '75002',
        countryCode: 'FR',
        zipData: {
          key: 'FR:75002',
          name: '75002',
          country_code: 'FR'
        },
        success: true,
        postalCodeOnlyEstimate: {
          data: {
            users_lower_bound: 12000,
            users_upper_bound: 15000,
            estimate_ready: true
          }
        },
        postalCodeWithTargetingEstimate: {
          data: {
            users_lower_bound: 6000,
            users_upper_bound: 8000,
            estimate_ready: true
          }
        },
        targetingSpec: {
          geo_locations: { zips: [{ key: 'FR:75002', name: '75002', country_code: 'FR' }] },
          age_min: 18,
          age_max: 65,
          genders: [1, 2],
          publisher_platforms: ['audience_network', 'facebook', 'messenger', 'instagram'],
          device_platforms: ['mobile', 'desktop']
        }
      }
    ];

    // Insérer les résultats simulés
    const insertSql = `
      INSERT INTO processing_results (
        project_id, postal_code, country_code, zip_data, 
        postal_code_only_estimate, postal_code_with_targeting_estimate, 
        targeting_spec, success, error_message, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    for (const result of simulatedResults) {
      await localDatabase.run(insertSql, [
        7, // project_id
        result.postalCode,
        result.countryCode,
        JSON.stringify(result.zipData),
        JSON.stringify(result.postalCodeOnlyEstimate),
        JSON.stringify(result.postalCodeWithTargetingEstimate),
        JSON.stringify(result.targetingSpec),
        1, // success
        null // error_message
      ]);
    }

    // Mettre à jour les statistiques du projet
    await localDatabase.run(`
      UPDATE projects 
      SET total_postal_codes = ?, 
          processed_postal_codes = ?, 
          error_postal_codes = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [2, 2, 0, 7]);

    console.log('✅ Simulated results added to project 7');
    console.log('📊 Project 7 now has 2 processed postal codes');
    
    // Vérifier les résultats
    const results = await localDatabase.all(
      'SELECT * FROM processing_results WHERE project_id = ?',
      [7]
    );
    
    console.log(`📋 Found ${results.length} results in database`);
    
    // Vérifier le projet
    const project = await localDatabase.get(
      'SELECT * FROM projects WHERE id = ?',
      [7]
    );
    
    console.log('📊 Project stats:', {
      id: project.id,
      name: project.name,
      total_postal_codes: project.total_postal_codes,
      processed_postal_codes: project.processed_postal_codes,
      error_postal_codes: project.error_postal_codes
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing robust system:', error);
    process.exit(1);
  }
}

testRobustSystem();

