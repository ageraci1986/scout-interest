import React, { useState } from 'react';
import { Interest, InterestGroup } from '../services/metaService';
import InterestSearch from './InterestSearch';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface InterestGroupManagerProps {
  interestGroups: InterestGroup[];
  onInterestGroupsChange: (groups: InterestGroup[]) => void;
}

const InterestGroupManager: React.FC<InterestGroupManagerProps> = ({
  interestGroups,
  onInterestGroupsChange
}) => {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const addNewGroup = () => {
    const newGroup: InterestGroup = {
      id: `group_${Date.now()}`,
      name: `Group ${interestGroups.length + 1}`,
      operator: 'OR',
      interests: []
    };
    onInterestGroupsChange([...interestGroups, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  const removeGroup = (groupId: string) => {
    onInterestGroupsChange(interestGroups.filter(group => group.id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
    }
  };

  const updateGroup = (groupId: string, updates: Partial<InterestGroup>) => {
    onInterestGroupsChange(
      interestGroups.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    );
  };

  const addInterestToGroup = (groupId: string, interest: Interest) => {
    updateGroup(groupId, {
      interests: [...interestGroups.find(g => g.id === groupId)!.interests, interest]
    });
  };

  const removeInterestFromGroup = (groupId: string, interestId: string) => {
    const group = interestGroups.find(g => g.id === groupId);
    if (group) {
      updateGroup(groupId, {
        interests: group.interests.filter((interest) => interest.id !== interestId)
      });
    }
  };

  // Removed unused functions to fix ESLint warnings

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Interest Groups</h3>
        <button
          onClick={addNewGroup}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          New Group
        </button>
      </div>

      {interestGroups.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No interest groups created</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first group to get started
          </p>
        </div>
      )}

      <div className="space-y-4">
        {interestGroups.map((group) => (
          <div
            key={group.id}
            className={`border rounded-lg p-4 transition-all ${
              activeGroupId === group.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                  className="text-lg font-medium bg-transparent border-none focus:ring-0 focus:outline-none"
                  placeholder="Group name"
                />
                <select
                  value={group.operator}
                  onChange={(e) => updateGroup(group.id, { operator: e.target.value as 'AND' | 'OR' })}
                  className="text-sm border border-gray-300 rounded px-3 py-1 w-20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {activeGroupId === group.id ? 'Hide' : 'Edit'}
                </button>
                <button
                  onClick={() => removeGroup(group.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {activeGroupId === group.id && (
              <div className="space-y-3">
                <InterestSearch
                  onInterestSelect={(interest) => addInterestToGroup(group.id, interest)}
                  selectedInterests={group.interests}
                  targetingSpec={{}}
                />

                {group.interests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Selected Interests ({group.interests.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {group.interests.map((interest) => (
                        <div
                          key={interest.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {interest.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {interest.audience_size.toLocaleString()} users
                            </p>
                          </div>
                          <button
                            onClick={() => removeInterestFromGroup(group.id, interest.id)}
                            className="ml-2 text-red-400 hover:text-red-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {group.interests.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {group.interests.length} interest(s) selected
                  </span>
                  <span className="text-xs text-gray-400">
                    At least one interest must match
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>




    </div>
  );
};

export default InterestGroupManager;
