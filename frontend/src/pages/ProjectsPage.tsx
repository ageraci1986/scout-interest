import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlusIcon, FolderIcon, TrashIcon, EyeIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

interface Project {
  id: number;
  name: string;
  postal_codes: string[];
  status: string;
  created_at: string;
  targeting_spec?: any;
}

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; project: Project | null }>({ show: false, project: null });
  const [targetingModal, setTargetingModal] = useState<{ show: boolean; project: Project | null }>({ show: false, project: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/upload');
  };

  const handleViewProject = (projectId: number) => {
    navigate(`/results/${projectId}`);
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast.success('Project deleted successfully');
      setDeleteModal({ show: false, project: null });
      
      // Refresh projects list
      await fetchProjects();
      
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleShowTargeting = (project: Project) => {
    setTargetingModal({ show: true, project });
  };

  const renderTargetingInfo = (targeting: any) => {
    if (!targeting) {
      return <p className="text-gray-500">No targeting criteria defined</p>;
    }

    const hasAnyTargeting = 
      (targeting.age_min && targeting.age_max) ||
      (targeting.genders && targeting.genders.length > 0) ||
      (targeting.countries && targeting.countries.length > 0) ||
      (targeting.interests && targeting.interests.length > 0) ||
      (targeting.interestGroups && targeting.interestGroups.length > 0);

    if (!hasAnyTargeting) {
      return <p className="text-gray-500">No targeting criteria defined</p>;
    }

    return (
      <div className="space-y-3">
        {targeting.age_min && targeting.age_max && (
          <div>
            <span className="font-medium">Age:</span> {targeting.age_min}-{targeting.age_max} years
          </div>
        )}
        {targeting.genders && targeting.genders.length > 0 && (
          <div>
            <span className="font-medium">Genders:</span> {targeting.genders.map((g: number) => g === 1 ? 'Male' : 'Female').join(', ')}
          </div>
        )}
        {targeting.countries && targeting.countries.length > 0 && (
          <div>
            <span className="font-medium">Countries:</span> {targeting.countries.join(', ')}
          </div>
        )}
        {targeting.interests && targeting.interests.length > 0 && (
          <div>
            <span className="font-medium">Interests:</span>
            <div className="ml-4 mt-1">
              {targeting.interests.map((interest: any, idx: number) => (
                <div key={idx} className="text-sm text-gray-600">• {interest.name}</div>
              ))}
            </div>
          </div>
        )}
        {targeting.interestGroups && targeting.interestGroups.length > 0 && (
          <div>
            <span className="font-medium">Interest Groups:</span>
            <div className="ml-4 mt-1">
              {targeting.interestGroups.map((group: any, idx: number) => (
                <div key={idx} className="mb-2">
                  <div className="font-medium text-sm">{group.name} ({group.operator}):</div>
                  {group.interests && group.interests.map((interest: any, i: number) => (
                    <div key={i} className="text-sm text-gray-600 ml-2">• {interest.name}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading projects..." fullScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">Manage your Meta audience analysis projects</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={fetchProjects}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first project by uploading a CSV file with postal codes
          </p>
          <Button onClick={handleCreateProject} variant="primary">
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div 
              key={project.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewProject(project.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {project.name}
                </h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  project.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Postal Codes:</span>
                  <span className="font-medium">{project.postal_codes?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-700">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewProject(project.id);
                  }}
                  variant="primary"
                  size="sm"
                  className="flex-1"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  View Results
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowTargeting(project);
                  }}
                  variant="secondary"
                  size="sm"
                  title="View targeting criteria"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModal({ show: true, project });
                  }}
                  variant="danger"
                  size="sm"
                  title="Delete project"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button
            onClick={() => navigate('/upload')}
            variant="secondary"
            className="flex items-center justify-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Upload New File</span>
          </Button>
          
          <Button
            onClick={() => navigate('/targeting')}
            variant="secondary"
            className="flex items-center justify-center space-x-2"
          >
            <span>Configure Targeting</span>
          </Button>
          
          <Button
            onClick={() => navigate('/settings')}
            variant="secondary"
            className="flex items-center justify-center space-x-2"
          >
            <span>Settings</span>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.project && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Project</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "<strong>{deleteModal.project.name}</strong>"? 
                  This will permanently delete the project and all its data including postal codes analysis results.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setDeleteModal({ show: false, project: null })}
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleDeleteProject(deleteModal.project!)}
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Targeting Info Modal */}
      {targetingModal.show && targetingModal.project && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-96 overflow-y-auto">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <AdjustmentsHorizontalIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4 text-center">
                Targeting Criteria
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                {targetingModal.project.name}
              </p>
              <div className="mt-4 text-left">
                {renderTargetingInfo(targetingModal.project.targeting_spec)}
              </div>
              <div className="items-center px-4 py-3 mt-4">
                <Button
                  onClick={() => setTargetingModal({ show: false, project: null })}
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;