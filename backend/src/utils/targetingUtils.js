/**
 * Utility functions for handling Meta API targeting specifications
 */

/**
 * Convert interest groups to Meta API compatible format using flexible_spec
 * NEW LOGIC: Each group has its own operator that defines how it combines with previous groups.
 * Within each group, interests are always OR.
 */
function convertInterestGroupsToMetaFormat(interestGroups) {
  if (!interestGroups || interestGroups.length === 0) {
    return { interests: [] };
  }

  console.log('🔄 Converting interest groups:', JSON.stringify(interestGroups, null, 2));

  // If only one group, all interests within the group are OR
  if (interestGroups.length === 1) {
    const group = interestGroups[0];
    console.log(`📋 Single group: all interests are OR within the group`);
    
    return {
      interests: group.interests.map(interest => ({
        id: interest.id,
        name: interest.name
      }))
    };
  }

  // For multiple groups, process each group based on its operator
  const flexibleSpecs = [];
  
  interestGroups.forEach((group, index) => {
    if (group.interests.length === 0) return;
    
    console.log(`📋 Group ${index + 1} (${group.operator}):`, group.interests.map(i => i.name));
    
    const currentGroupInterests = group.interests.map(interest => ({
      id: interest.id,
      name: interest.name
    }));
    
    if (index === 0 || group.operator === 'AND') {
      // First group or AND operator - create new flexible_spec entry
      flexibleSpecs.push({
        interests: currentGroupInterests
      });
    } else if (group.operator === 'OR') {
      // OR operator - merge with the last flexible_spec entry
      if (flexibleSpecs.length > 0) {
        const lastEntry = flexibleSpecs[flexibleSpecs.length - 1];
        lastEntry.interests = [...lastEntry.interests, ...currentGroupInterests];
      } else {
        // Fallback - create new entry
        flexibleSpecs.push({
          interests: currentGroupInterests
        });
      }
    }
  });
  
  console.log('🎯 Final flexible_spec:', JSON.stringify(flexibleSpecs, null, 2));
  
  if (flexibleSpecs.length === 0) {
    return { interests: [] };
  } else if (flexibleSpecs.length === 1) {
    // If only one flexible_spec, return it directly
    return flexibleSpecs[0];
  } else {
    // Multiple flexible_specs - use flexible_spec array (implicitly ANDed)
    return { flexible_spec: flexibleSpecs };
  }
}

/**
 * Convert advanced targeting spec to Meta API format
 */
function convertAdvancedTargetingToMetaFormat(advancedTargetingSpec) {
  const {
    interestGroups,
    geo_locations,
    age_min,
    age_max,
    genders,
    device_platforms,
    countries
  } = advancedTargetingSpec;

  // Convert interest groups
  const interestTargeting = convertInterestGroupsToMetaFormat(interestGroups);

  // Build final targeting spec
  const metaTargetingSpec = {
    ...interestTargeting,
    age_min: age_min || 18,
    age_max: age_max || 65,
    genders: genders && genders.length > 0 ? genders : [1, 2],
    device_platforms: device_platforms && device_platforms.length > 0 ? device_platforms : ['mobile', 'desktop'],
    publisher_platforms: ['audience_network', 'facebook', 'messenger', 'instagram']
  };

  // Handle geo locations
  if (geo_locations && geo_locations.length > 0) {
    metaTargetingSpec.geo_locations = geo_locations[0] || geo_locations;
  } else if (countries && countries.length > 0) {
    metaTargetingSpec.geo_locations = {
      countries: countries
    };
  }

  return metaTargetingSpec;
}

/**
 * Validate targeting specification
 */
function validateTargetingSpec(targetingSpec) {
  const errors = [];

  if (!targetingSpec) {
    errors.push('Targeting specification is required');
    return errors;
  }

  // Validate age range
  if (targetingSpec.age_min && targetingSpec.age_max) {
    if (targetingSpec.age_min < 13 || targetingSpec.age_max > 65) {
      errors.push('Age range must be between 13 and 65');
    }
    if (targetingSpec.age_min > targetingSpec.age_max) {
      errors.push('Minimum age cannot be greater than maximum age');
    }
  }

  // Validate genders
  if (targetingSpec.genders && targetingSpec.genders.length > 0) {
    const validGenders = ['1', '2', 'all', 1, 2];
    const invalidGenders = targetingSpec.genders.filter(g => !validGenders.includes(g));
    if (invalidGenders.length > 0) {
      errors.push(`Invalid gender values: ${invalidGenders.join(', ')}`);
    }
  }

  // Validate device platforms
  if (targetingSpec.device_platforms && targetingSpec.device_platforms.length > 0) {
    const validPlatforms = ['mobile', 'desktop', 'tablet', 'all'];
    const invalidPlatforms = targetingSpec.device_platforms.filter(p => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      errors.push(`Invalid device platforms: ${invalidPlatforms.join(', ')}`);
    }
  }

  return errors;
}

/**
 * Get targeting summary for display
 */
function getTargetingSummary(advancedTargetingSpec) {
  const summary = {
    totalGroups: 0,
    totalInterests: 0,
    groupDetails: [],
    demographics: {
      ageRange: null,
      genders: null,
      devices: null,
      countries: null
    }
  };

  if (advancedTargetingSpec.interestGroups) {
    summary.totalGroups = advancedTargetingSpec.interestGroups.length;
    summary.totalInterests = advancedTargetingSpec.interestGroups.reduce(
      (total, group) => total + group.interests.length, 0
    );
    summary.groupDetails = advancedTargetingSpec.interestGroups.map(group => ({
      name: group.name,
      operator: group.operator,
      interestCount: group.interests.length
    }));
  }

  if (advancedTargetingSpec.age_min && advancedTargetingSpec.age_max) {
    summary.demographics.ageRange = `${advancedTargetingSpec.age_min}-${advancedTargetingSpec.age_max}`;
  }

  if (advancedTargetingSpec.genders && advancedTargetingSpec.genders.length > 0) {
    summary.demographics.genders = advancedTargetingSpec.genders.join(', ');
  }

  if (advancedTargetingSpec.device_platforms && advancedTargetingSpec.device_platforms.length > 0) {
    summary.demographics.devices = advancedTargetingSpec.device_platforms.join(', ');
  }

  if (advancedTargetingSpec.countries && advancedTargetingSpec.countries.length > 0) {
    summary.demographics.countries = advancedTargetingSpec.countries.join(', ');
  }

  return summary;
}

module.exports = {
  convertInterestGroupsToMetaFormat,
  convertAdvancedTargetingToMetaFormat,
  validateTargetingSpec,
  getTargetingSummary
};
