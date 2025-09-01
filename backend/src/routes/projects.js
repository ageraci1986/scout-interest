const express = require('express');
const router = express.Router();
const projectService = require('../services/projectService');

// Créer un nouveau projet
router.post('/', async (req, res) => {
  try {
    const { name, description, userId } = req.body;
    
    const result = await projectService.createProject({
      name,
      description,
      userId: userId || 'anonymous'
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Récupérer un projet par ID
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.getProject(projectId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Récupérer tous les projets d'un utilisateur
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await projectService.getUserProjects(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        projects: result.projects
      }
    });
  } catch (error) {
    console.error('Error getting user projects:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mettre à jour un projet
router.put('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    
    const result = await projectService.updateProject(projectId, updateData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Supprimer un projet
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.deleteProject(projectId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Récupérer les résultats d'un projet
router.get('/:projectId/results', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.getProjectResults(projectId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        results: result.results
      }
    });
  } catch (error) {
    console.error('Error getting project results:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Sauvegarder les résultats de traitement
router.post('/:projectId/results', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { results } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: 'Results array is required'
      });
    }

    const result = await projectService.saveProcessingResults(projectId, results);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        savedCount: result.savedCount
      }
    });
  } catch (error) {
    console.error('Error saving project results:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mettre à jour le targeting spec d'un projet
router.patch('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targeting_spec } = req.body;
    
    if (!targeting_spec) {
      return res.status(400).json({
        success: false,
        message: 'Targeting spec is required'
      });
    }

    const result = await projectService.updateProjectTargetingSpec(projectId, targeting_spec);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: {
        project: result.project
      }
    });
  } catch (error) {
    console.error('Error updating project targeting spec:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get project processing status
router.get('/:projectId/status', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const result = await projectService.getProjectStatus(projectId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.status
    });
  } catch (error) {
    console.error('Error getting project status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

