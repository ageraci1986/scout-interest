const localDatabase = require('../config/database');

class ProjectService {
  constructor() {
    this.db = localDatabase;
  }

  // Créer un nouveau projet
  async createProject(projectData) {
    try {
      const sql = `
        INSERT INTO projects (name, description, user_id, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const result = await this.db.run(sql, [
        projectData.name || 'Untitled Project',
        projectData.description || '',
        projectData.userId || 'anonymous',
        'active'
      ]);

      const project = result.rows[0];
      console.log('✅ Project created:', project.id);
      return { success: true, project };
    } catch (error) {
      console.error('❌ Error creating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer un projet par ID
  async getProject(projectId) {
    try {
      const result = await this.db.run('SELECT * FROM projects WHERE id = $1', [projectId]);
      const project = result.rows[0];
      
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      return { success: true, project };
    } catch (error) {
      console.error('❌ Error getting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer tous les projets d'un utilisateur
  async getUserProjects(userId) {
    try {
      const result = await this.db.run(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return { success: true, projects: result.rows };
    } catch (error) {
      console.error('❌ Error getting user projects:', error);
      return { success: false, error: error.message };
    }
  }

  // Sauvegarder les résultats de traitement
  async saveProcessingResults(projectId, results) {
    try {
      console.log(`📋 Saving ${results.length} results for project ${projectId}`);
      console.log(`📋 Sample result structure:`, results[0]);
      
      // Insérer les résultats
      const insertSql = `
        INSERT INTO processing_results (
          project_id, postal_code, country_code, zip_data, 
          postal_code_only_estimate, postal_code_with_targeting_estimate, 
          targeting_spec, success, error_message, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      `;

      for (const result of results) {
        await this.db.run(insertSql, [
          projectId,
          result.postalCode,
          result.countryCode,
          result.zipData ? JSON.stringify(result.zipData) : null,
          result.postalCodeOnlyEstimate ? JSON.stringify(result.postalCodeOnlyEstimate) : null,
          result.postalCodeWithTargetingEstimate ? JSON.stringify(result.postalCodeWithTargetingEstimate) : null,
          result.targetingSpec ? JSON.stringify(result.targetingSpec) : null,
          result.success ? 1 : 0,
          result.error || null
        ]);
      }

      // Mettre à jour les statistiques du projet
      const successfulResults = results.filter(r => r.success);
      const errorResults = results.filter(r => !r.success);

      await this.db.run(`
        UPDATE projects 
        SET total_postal_codes = total_postal_codes + $1, 
            processed_postal_codes = processed_postal_codes + $2, 
            error_postal_codes = error_postal_codes + $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [results.length, successfulResults.length, errorResults.length, projectId]);

      console.log(`✅ Saved ${results.length} processing results for project ${projectId}`);
      return { success: true, savedCount: results.length };
    } catch (error) {
      console.error('❌ Error saving processing results:', error);
      return { success: false, error: error.message };
    }
  }

  // Récupérer les résultats d'un projet
  async getProjectResults(projectId) {
    try {
      const result = await this.db.run(
        'SELECT * FROM processing_results WHERE project_id = $1 ORDER BY processed_at DESC',
        [projectId]
      );
      const results = result.rows;

      // Parser les champs JSON
      const parsedResults = results.map(result => ({
        ...result,
        zip_data: result.zip_data ? JSON.parse(result.zip_data) : null,
        postal_code_only_estimate: result.postal_code_only_estimate ? JSON.parse(result.postal_code_only_estimate) : null,
        postal_code_with_targeting_estimate: result.postal_code_with_targeting_estimate ? JSON.parse(result.postal_code_with_targeting_estimate) : null,
        targeting_spec: result.targeting_spec ? JSON.parse(result.targeting_spec) : null,
        success: Boolean(result.success)
      }));

      return { success: true, results: parsedResults };
    } catch (error) {
      console.error('❌ Error getting project results:', error);
      return { success: false, error: error.message };
    }
  }

  // Mettre à jour un projet
  async updateProject(projectId, updateData) {
    try {
      const updateFields = [];
      const updateValues = [];

      for (const [key, value] of Object.entries(updateData)) {
        if (key !== 'id') {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      }

      updateFields.push('updated_at = datetime(\'now\')');
      updateValues.push(projectId);

      const sql = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.db.run(sql, updateValues);

      // Récupérer le projet mis à jour
      const project = await this.db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
      
      return { success: true, project };
    } catch (error) {
      console.error('❌ Error updating project:', error);
      return { success: false, error: error.message };
    }
  }

  // Supprimer un projet
  async deleteProject(projectId) {
    try {
      // Supprimer d'abord les résultats de traitement
      await this.db.run('DELETE FROM processing_results WHERE project_id = $1', [projectId]);
      
      // Puis supprimer le projet
      await this.db.run('DELETE FROM projects WHERE id = $1', [projectId]);
      
      console.log(`✅ Project ${projectId} deleted successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Créer un projet à partir d'un upload de fichier
  async createProjectFromUpload(fileName, postalCodeCount) {
    const projectData = {
      name: `Project from ${fileName}`,
      description: `Auto-generated project from file upload with ${postalCodeCount} postal codes`,
      userId: 'anonymous'
    };

    return this.createProject(projectData);
  }

  // Mettre à jour le targeting spec d'un projet
  async updateProjectTargetingSpec(projectId, targetingSpec) {
    try {
      await this.db.run(
        'UPDATE projects SET targeting_spec = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(targetingSpec), projectId]
      );

      // Récupérer le projet mis à jour
      const project = await this.db.get('SELECT * FROM projects WHERE id = $1', [projectId]);
      
      if (project) {
        // Parser le targeting_spec JSON seulement s'il est une chaîne
        if (project.targeting_spec && typeof project.targeting_spec === 'string') {
          try {
            project.targeting_spec = JSON.parse(project.targeting_spec);
          } catch (parseError) {
            console.warn('⚠️ Could not parse targeting_spec JSON:', parseError);
            project.targeting_spec = null;
          }
        }
      }
      
      console.log(`✅ Updated targeting spec for project ${projectId}`);
      return { success: true, project };
    } catch (error) {
      console.error('❌ Error updating project targeting spec:', error);
      return { success: false, error: error.message };
    }
  }

  // Get project processing status
  async getProjectStatus(projectId) {
    try {
      // Get project info
      const project = await this.db.get('SELECT * FROM projects WHERE id = $1', [projectId]);
      
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Get processing results count
      const results = await this.db.all('SELECT * FROM processing_results WHERE project_id = $1', [projectId]);
      
      const total = results.length;
      const completed = results.filter(r => r.success).length;
      const errors = results.filter(r => !r.success).length;
      const success = completed;

      const status = {
        total,
        completed,
        success,
        errors,
        isProcessing: total > 0 && completed < total
      };

      console.log(`📊 Project ${projectId} status:`, status);
      return { success: true, status };
    } catch (error) {
      console.error('❌ Error getting project status:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ProjectService();
