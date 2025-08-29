import React, { useState, useEffect, useRef } from 'react';
import { Interest } from '../services/metaService';
import metaService from '../services/metaService';
import toast from 'react-hot-toast';

interface InterestSearchProps {
  onInterestSelect: (interest: Interest) => void;
  selectedInterests: Interest[];
  targetingSpec?: any; // For real-time audience estimation
}

const InterestSearch: React.FC<InterestSearchProps> = ({ onInterestSelect, selectedInterests, targetingSpec }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Interest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search to avoid too many API calls
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Search interests
  const searchInterests = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Call real Meta API
        const apiResults = await metaService.searchInterests(searchQuery, 10);
        
        // Transform Meta API response to match our Interest interface
        const transformedResults: Interest[] = apiResults.map((item: any) => ({
          id: item.id,
          name: item.name,
          audience_size: item.audience_size_lower_bound || item.audience_size_upper_bound || 0,
          audience_size_lower: item.audience_size_lower_bound,
          audience_size_upper: item.audience_size_upper_bound,
          path: item.path || [],
          description: item.description || '',
          topic: item.topic || ''
        }));
        
        setResults(transformedResults);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching interests:', error);
        toast.error('Error searching interests');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchInterests(value);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle interest selection
  const handleInterestSelect = (interest: Interest) => {
    // Check if already selected
    const isAlreadySelected = selectedInterests.some(selected => selected.id === interest.id);
    if (isAlreadySelected) {
      toast.error('This interest is already selected');
      return;
    }

    onInterestSelect(interest);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    toast.success(`${interest.name} added`);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format audience size range
  const formatAudienceSize = (lower: number, upper?: number): string => {
    if (upper) {
      const avgSize = (lower + upper) / 2;
      if (avgSize >= 1000000) {
        return `${(avgSize / 1000000).toFixed(1)}M`;
      } else if (avgSize >= 1000) {
        return `${(avgSize / 1000).toFixed(1)}K`;
      }
      return avgSize.toString();
    }
    
    if (lower >= 1000000) {
      return `${(lower / 1000000).toFixed(1)}M`;
    } else if (lower >= 1000) {
      return `${(lower / 1000).toFixed(1)}K`;
    }
    return lower.toString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Interests
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Ex: fitness, cooking, travel..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {isLoading && (
            <div className="absolute right-3 top-2.5">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((interest) => (
            <div
              key={interest.id}
              onClick={() => handleInterestSelect(interest)}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{interest.name}</div>
                  <div className="text-sm text-gray-500">{interest.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {interest.path.join(' > ')}
                  </div>
                </div>
                <div className="text-sm font-medium text-primary-600 ml-4">
                  {formatAudienceSize(interest.audience_size_lower || interest.audience_size, interest.audience_size_upper)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && query && !isLoading && results.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-gray-500">
            No interests found for "{query}"
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestSearch;
