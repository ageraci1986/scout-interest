import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Project {
  id: string;
  name: string;
  status: string;
  total_postal_codes: number;
  processed_postal_codes: number;
  error_postal_codes: number;
  results?: Array<{
    postal_code: string;
    success: boolean;
    audience_estimate: number;
    error?: string;
  }>;
}

interface InterestGroup {
  id: string;
  name: string;
  interests: Array<{
    id: string;
    name: string;
    audience_size: number;
  }>;
}

interface TargetingSpec {
  age_min: number;
  age_max: number;
  genders: number[];
  interests: string[];
  geo_locations: any;
}

interface AppState {
  // Projects
  projects: Project[];
  currentProject: Project | null;
  
  // Postal codes from upload
  uploadedPostalCodes: string[];
  uploadedFileName: string | null;
  
  // Targeting configuration
  targetingSpec: TargetingSpec;
  selectedCountry: string;
  
  // Interest groups
  interestGroups: InterestGroup[];
  selectedInterests: string[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  
  setUploadedPostalCodes: (codes: string[], filename?: string) => void;
  clearUploadedPostalCodes: () => void;
  
  setTargetingSpec: (spec: Partial<TargetingSpec>) => void;
  setSelectedCountry: (country: string) => void;
  
  setInterestGroups: (groups: InterestGroup[]) => void;
  addInterestGroup: (group: InterestGroup) => void;
  removeInterestGroup: (groupId: string) => void;
  updateInterestGroup: (groupId: string, updates: Partial<InterestGroup>) => void;
  
  setSelectedInterests: (interests: string[]) => void;
  addSelectedInterest: (interestId: string) => void;
  removeSelectedInterest: (interestId: string) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Reset functions
  resetTargeting: () => void;
  resetAll: () => void;
}

const defaultTargetingSpec: TargetingSpec = {
  age_min: 18,
  age_max: 65,
  genders: [1, 2], // All genders
  interests: [],
  geo_locations: {}
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      currentProject: null,
      uploadedPostalCodes: [],
      uploadedFileName: null,
      targetingSpec: defaultTargetingSpec,
      selectedCountry: 'US',
      interestGroups: [],
      selectedInterests: [],
      isLoading: false,
      error: null,

      // Project actions
      setProjects: (projects) => set({ projects }),
      
      setCurrentProject: (project) => set({ currentProject: project }),
      
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project],
        currentProject: project
      })),
      
      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === projectId ? { ...p, ...updates } : p
        ),
        currentProject: state.currentProject?.id === projectId 
          ? { ...state.currentProject, ...updates } 
          : state.currentProject
      })),

      // Upload actions
      setUploadedPostalCodes: (codes, filename) => set({
        uploadedPostalCodes: codes,
        uploadedFileName: filename || null
      }),
      
      clearUploadedPostalCodes: () => set({
        uploadedPostalCodes: [],
        uploadedFileName: null
      }),

      // Targeting actions
      setTargetingSpec: (spec) => set((state) => ({
        targetingSpec: { ...state.targetingSpec, ...spec }
      })),
      
      setSelectedCountry: (country) => set({ selectedCountry: country }),

      // Interest group actions
      setInterestGroups: (groups) => set({ interestGroups: groups }),
      
      addInterestGroup: (group) => set((state) => ({
        interestGroups: [...state.interestGroups, group]
      })),
      
      removeInterestGroup: (groupId) => set((state) => ({
        interestGroups: state.interestGroups.filter(g => g.id !== groupId),
        selectedInterests: state.selectedInterests.filter(id => {
          const group = state.interestGroups.find(g => g.id === groupId);
          return !group?.interests.some(i => i.id === id);
        })
      })),
      
      updateInterestGroup: (groupId, updates) => set((state) => ({
        interestGroups: state.interestGroups.map(g =>
          g.id === groupId ? { ...g, ...updates } : g
        )
      })),

      // Interest selection actions
      setSelectedInterests: (interests) => set({ selectedInterests: interests }),
      
      addSelectedInterest: (interestId) => set((state) => ({
        selectedInterests: state.selectedInterests.includes(interestId) 
          ? state.selectedInterests 
          : [...state.selectedInterests, interestId]
      })),
      
      removeSelectedInterest: (interestId) => set((state) => ({
        selectedInterests: state.selectedInterests.filter(id => id !== interestId)
      })),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Reset actions
      resetTargeting: () => set({
        targetingSpec: defaultTargetingSpec,
        selectedInterests: [],
        selectedCountry: 'US'
      }),
      
      resetAll: () => set({
        projects: [],
        currentProject: null,
        uploadedPostalCodes: [],
        uploadedFileName: null,
        targetingSpec: defaultTargetingSpec,
        selectedCountry: 'US',
        interestGroups: [],
        selectedInterests: [],
        isLoading: false,
        error: null
      })
    }),
    {
      name: 'scout-interest-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields, not UI state
      partialize: (state) => ({
        projects: state.projects,
        uploadedPostalCodes: state.uploadedPostalCodes,
        uploadedFileName: state.uploadedFileName,
        targetingSpec: state.targetingSpec,
        selectedCountry: state.selectedCountry,
        interestGroups: state.interestGroups,
        selectedInterests: state.selectedInterests
      }),
    }
  )
);

// Selectors for derived state
export const useCurrentProjectResults = () => {
  return useAppStore((state) => state.currentProject?.results || []);
};

export const useUploadStats = () => {
  return useAppStore((state) => ({
    totalCodes: state.uploadedPostalCodes.length,
    hasUpload: state.uploadedPostalCodes.length > 0,
    fileName: state.uploadedFileName
  }));
};

export const useTargetingStats = () => {
  return useAppStore((state) => ({
    hasTargeting: state.selectedInterests.length > 0,
    interestCount: state.selectedInterests.length,
    targetingComplete: state.selectedInterests.length > 0 && 
                      state.uploadedPostalCodes.length > 0
  }));
};

export default useAppStore;