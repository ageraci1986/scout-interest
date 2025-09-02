import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import projectService, { Project, ProcessingResult } from '../services/projectService';

interface ProjectsPageProps {}

const ProjectsPage: React.FC<ProjectsPageProps> = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectResults, setProjectResults] = useState<ProcessingResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const result = await projectService.getUserProjects('anonymous');
      
      if (result.success && result.projects) {
        setProjects(result.projects);
        console.log('✅ Projects loaded:', result.projects);
      } else {
        console.error('❌ Failed to load projects:', result.error);
        toast.error('Erreur lors du chargement des projets');
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectResults = async (project: Project) => {
    try {
      setLoadingResults(true);
      setSelectedProject(project);
      
      const result = await projectService.getProjectResults(project.id);
      
      if (result.success && result.results) {
        setProjectResults(result.results);
        console.log('✅ Project results loaded:', result.results);
      } else {
        console.error('❌ Failed to load project results:', result.error);
        toast.error('Erreur lors du chargement des résultats');
      }
    } catch (error) {
      console.error('❌ Error loading project results:', error);
      toast.error('Erreur lors du chargement des résultats');
    } finally {
      setLoadingResults(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      return;
    }

    try {
      const result = await projectService.deleteProject(projectId);
      
      if (result.success) {
        toast.success('Projet supprimé avec succès');
        loadProjects(); // Recharger la liste
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
          setProjectResults([]);
        }
      } else {
        toast.error(`Erreur lors de la suppression: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      toast.error('Erreur lors de la suppression du projet');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSuccessRate = (project: Project) => {
    if (project.total_postal_codes === 0) return 0;
    return Math.round((project.processed_postal_codes / project.total_postal_codes) * 100);
  };

  const getStatusColor = (project: Project) => {
    const successRate = getSuccessRate(project);
    if (successRate >= 80) return 'text-green-600';
    if (successRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (project: Project) => {
    const successRate = getSuccessRate(project);
    if (successRate >= 80) return 'Excellent';
    if (successRate >= 50) return 'Bon';
    if (successRate > 0) return 'Partiel';
    return 'Aucun résultat';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Projets</h1>
          <p className="text-gray-600 mt-2">Gérez vos projets de traitement de codes postaux</p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="btn-primary"
        >
          Nouveau Projet
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-600 mb-6">Commencez par créer votre premier projet en uploadant un fichier</p>
          <button
            onClick={() => navigate('/upload')}
            className="btn-primary"
          >
            Créer un Projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des projets */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Projets ({projects.length})</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedProject?.id === project.id ? 'bg-primary-50 border-primary-200' : ''
                    }`}
                    onClick={() => loadProjectResults(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{formatDate(project.created_at)}</span>
                      <span className={`font-medium ${getStatusColor(project)}`}>
                        {getStatusText(project)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {project.total_postal_codes} codes • {project.processed_postal_codes} traités • {project.error_postal_codes} erreurs
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Détails du projet sélectionné */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedProject.description}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getStatusColor(selectedProject)}`}>
                        {getSuccessRate(selectedProject)}% de succès
                      </div>
                      <div className="text-sm text-gray-500">
                        {getStatusText(selectedProject)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{selectedProject.total_postal_codes}</div>
                      <div className="text-sm text-gray-600">Codes postaux</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedProject.processed_postal_codes}</div>
                      <div className="text-sm text-green-600">Traités</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{selectedProject.error_postal_codes}</div>
                      <div className="text-sm text-red-600">Erreurs</div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Résultats du traitement</h3>
                    <button
                      onClick={() => navigate(`/results?projectId=${selectedProject.id}`)}
                      className="btn-secondary text-sm"
                    >
                      Voir Détails
                    </button>
                  </div>

                  {loadingResults ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Chargement des résultats...</p>
                    </div>
                  ) : projectResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Code Postal
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Pays
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Audience
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {projectResults.slice(0, 10).map((result) => (
                            <tr key={result.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {result.postal_code}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {result.country_code}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  result.success 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.success ? 'Succès' : 'Erreur'}
                                </span>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {result.success && result.postal_code_with_targeting_estimate ? (
                                  <span>
                                    {result.postal_code_with_targeting_estimate.users_lower_bound?.toLocaleString()} - {result.postal_code_with_targeting_estimate.users_upper_bound?.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(result.processed_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {projectResults.length > 10 && (
                        <div className="mt-4 text-center">
                          <p className="text-sm text-gray-600">
                            Affichage de 10 résultats sur {projectResults.length}
                          </p>
                          <button
                            onClick={() => navigate(`/results?projectId=${selectedProject.id}`)}
                            className="btn-secondary text-sm mt-2"
                          >
                            Voir Tous les Résultats
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
                      <p className="text-gray-600">Ce projet n'a pas encore de résultats de traitement</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un projet</h3>
                <p className="text-gray-600">Cliquez sur un projet dans la liste pour voir ses détails et résultats</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
