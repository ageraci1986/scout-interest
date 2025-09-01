import axios from 'axios';

const API_BASE_URL = '/api';

export interface Interest {
  id: string;
  name: string;
  audience_size: number;
  audience_size_lower?: number;
  audience_size_upper?: number;
  path: string[];
  description?: string;
  topic?: string;
}

export interface TargetingSpec {
  interests?: Interest[];
  geo_locations?: any[];
  age_min?: number;
  age_max?: number;
  genders?: string[];
  devices?: string[];
  countries?: string[];
}

// Meta API specific targeting spec
export interface MetaTargetingSpec {
  interests?: Interest[];
  interestGroups?: InterestGroup[];
  geo_locations?: { countries: string[] }[];
  age_min?: number;
  age_max?: number;
  genders?: string[];
  device_platforms?: string[];
  country_code?: string; // New field for postal code targeting
}

// Advanced targeting spec with interest groups
export interface AdvancedTargetingSpec {
  interestGroups: InterestGroup[];
  age_min?: number;
  age_max?: number;
  genders?: string[];
  device_platforms?: string[];
  countries?: string[];
}

// Interest group interface
export interface InterestGroup {
  id: string;
  name: string;
  operator: 'AND' | 'OR';
  interests: Interest[];
}

export interface DeliveryEstimate {
  estimate_ready?: boolean;
  users_lower_bound?: number;
  users_upper_bound?: number;
  estimate_mau_lower_bound?: number;
  estimate_mau_upper_bound?: number;
  data?: {
    users?: number;
    bid_estimate?: {
      median_bid: string;
      bid_currency: string;
    };
    estimate_dau?: number;
  };
}

// New interfaces for postal code functionality
export interface ZipCodeData {
  key: string;
  name: string;
  type: string;
  country_code: string;
  country_name: string;
  region: string;
  region_id: number;
  primary_city: string;
  primary_city_id: number;
  supports_region: boolean;
  supports_city: boolean;
}

export interface PostalCodeSearchResult {
  query: string;
  country_code: string;
  results: ZipCodeData[];
}

export interface PostalCodeReachEstimate {
  postalCode: string;
  country_code: string;
  zipCodeData: ZipCodeData;
  reachEstimate: DeliveryEstimate;
  targetingSpec: MetaTargetingSpec;
}

export interface BatchPostalCodeResult {
  totalProcessed: number;
  successful: number;
  errors: number;
  results: PostalCodeReachEstimate[];
  errorDetails: Array<{
    postalCode: string;
    country_code: string;
    success: false;
    error: string;
  }>;
}

class MetaService {
  // Search interests
  async searchInterests(query: string, limit: number = 10): Promise<Interest[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/meta/interests/search`, {
        params: { q: query, limit }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching interests:', error);
      throw error;
    }
  }

  // Get reach estimate (taille d'audience)
  async getDeliveryEstimate(adAccountId: string, targetingSpec: MetaTargetingSpec): Promise<DeliveryEstimate> {
    try {
      const response = await axios.post(`${API_BASE_URL}/meta/reach-estimate`, {
        adAccountId,
        targetingSpec
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting reach estimate:', error);
      throw error;
    }
  }

  // Get advanced delivery estimate with interest groups
  async getAdvancedDeliveryEstimate(adAccountId: string, advancedTargetingSpec: AdvancedTargetingSpec): Promise<DeliveryEstimate> {
    try {
      const response = await axios.post(`${API_BASE_URL}/meta/reach-estimate`, {
        adAccountId,
        advancedTargetingSpec: advancedTargetingSpec
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error getting advanced delivery estimate:', error);
      throw error;
    }
  }

  // Get targeting sentence lines
  async getTargetingSentenceLines(adAccountId: string, query: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/meta/targeting-sentence-lines`, {
        params: { adAccountId, q: query }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting targeting sentence lines:', error);
      throw error;
    }
  }

  // Validate access token
  async validateToken() {
    try {
      const response = await axios.get(`${API_BASE_URL}/meta/validate-token`);
      return response.data.data;
    } catch (error) {
      console.error('Error validating token:', error);
      throw error;
    }
  }

  // Get rate limit status
  async getRateLimitStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/meta/rate-limit`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      throw error;
    }
  }

  // Get ad account configuration
  async getAdAccountConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/meta/ad-account`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting ad account config:', error);
      throw error;
    }
  }

  // New methods for postal code functionality
  async searchPostalCodes(
    query: string,
    country_code: string = 'US',
    limit: number = 10
  ): Promise<PostalCodeSearchResult> {
    try {
      const response = await axios.get(`${API_BASE_URL}/search-postal-codes`, {
        params: { q: query, country_code, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching postal codes:', error);
      throw error;
    }
  }

  async getPostalCodeReachEstimate(
    adAccountId: string,
    postalCode: string,
    targetingSpec: MetaTargetingSpec
  ): Promise<PostalCodeReachEstimate> {
    try {
      const response = await axios.post(`${API_BASE_URL}/postal-code-reach-estimate-v2`, {
        adAccountId,
        postalCode,
        targetingSpec
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting postal code reach estimate:', error);
      throw error;
    }
  }

  async getBatchPostalCodesReachEstimate(
    adAccountId: string,
    postalCodes: string[],
    targetingSpec: MetaTargetingSpec
  ): Promise<BatchPostalCodeResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/batch-postal-codes-reach-estimate-v2`, {
        adAccountId,
        postalCodes,
        targetingSpec
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting batch postal codes reach estimate:', error);
      throw error;
    }
  }

  async getProjectPostalCodesReachEstimate(
    projectId: number,
    adAccountId: string,
    targetingSpec: MetaTargetingSpec
  ): Promise<BatchPostalCodeResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/project-postal-codes-reach-estimate-v2`, {
        projectId,
        adAccountId,
        targetingSpec
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting project postal codes reach estimate:', error);
      throw error;
    }
  }

  async getProjectPostalCodes(projectId: number): Promise<{
    projectId: number;
    postalCodes: Array<{
      postal_code: string;
      country: string;
      status: string;
    }>;
    total: number;
    valid: number;
    invalid: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/project/${projectId}/postal-codes`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting project postal codes:', error);
      throw error;
    }
  }

  // Rate limit configuration methods
  async getRateLimitsConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/rate-limits-config`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting rate limits config:', error);
      throw error;
    }
  }

  async updateRateLimitEnvironment(environment: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/rate-limits-config`, {
        environment
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating rate limit environment:', error);
      throw error;
    }
  }

  async estimateProcessingTime(postalCodes: number, environment: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/estimate-processing-time`, {
        postalCodes,
        environment
      });
      return response.data.data;
    } catch (error) {
      console.error('Error estimating processing time:', error);
      throw error;
    }
  }


}

export default new MetaService();
