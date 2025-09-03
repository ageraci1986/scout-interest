const adsSdk = require('facebook-nodejs-business-sdk');

// Initialize the Facebook Ads API only if token is available
let api = null;
if (process.env.META_ACCESS_TOKEN) {
  api = adsSdk.FacebookAdsApi.init(process.env.META_ACCESS_TOKEN);
} else {
  console.log('⚠️  META_ACCESS_TOKEN not found, Meta API will be unavailable');
}

// Enable debug mode in development
if (process.env.NODE_ENV === 'development' && api) {
  api.setDebug(true);
}

// Rate limiting configuration
const rateLimiter = {
  callsPerHour: parseInt(process.env.META_RATE_LIMIT_CALLS_PER_HOUR) || 200,
  retryDelay: parseInt(process.env.META_RATE_LIMIT_RETRY_DELAY) || 5000,
  currentCalls: 0,
  lastReset: Date.now(),
  
  canMakeCall() {
    const now = Date.now();
    if (now - this.lastReset >= 3600000) { // 1 hour
      this.currentCalls = 0;
      this.lastReset = now;
    }
    return this.currentCalls < this.callsPerHour;
  },
  
  recordCall() {
    this.currentCalls++;
  },
  
  getWaitTime() {
    const now = Date.now();
    const timeSinceReset = now - this.lastReset;
    const timeUntilReset = 3600000 - timeSinceReset;
    return Math.max(timeUntilReset, this.retryDelay);
  }
};

// Meta API service class
class MetaApiService {
  constructor() {
    this.isConfigured = this.checkConfiguration();
    this.api = api;
    this.rateLimiter = rateLimiter;
    
    if (this.isConfigured) {
      console.log('✅ Meta API configurée avec les vraies clés');
    } else {
      console.log('⚠️  Meta API non configurée, utilisation des données mock');
    }
  }

  checkConfiguration() {
    return !!(process.env.META_APP_ID && 
              process.env.META_APP_SECRET && 
              process.env.META_ACCESS_TOKEN);
  }

  // Get Ad Account
  getAdAccount(adAccountId) {
    const AdAccount = adsSdk.AdAccount;
    return new AdAccount(adAccountId);
  }

  // Search for interests
  async searchInterests(query, limit = 10) {
    if (!this.isConfigured) {
      throw new Error('Meta API not configured');
    }

    if (!this.rateLimiter.canMakeCall()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getWaitTime()}ms`);
    }

    try {
      this.rateLimiter.recordCall();
      
      const response = await this.api.call(
        'GET',
        ['search'],
        {
          q: query,
          type: 'adinterest',
          limit: limit,
          access_token: process.env.META_ACCESS_TOKEN
        }
      );

      return response.data || [];
    } catch (error) {
      console.error('Error searching interests:', error);
      throw error;
    }
  }

  // Get reach estimate (taille d'audience)
  async getDeliveryEstimate(adAccountId, targetingSpec) {
    if (!this.rateLimiter.canMakeCall()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getWaitTime()}ms`);
    }

    try {
      this.rateLimiter.recordCall();
      
      const account = this.getAdAccount(adAccountId);
      
      // Format targeting spec correctly for Meta API
      const formattedTargetingSpec = {
        geo_locations: targetingSpec.geo_locations?.[0] || targetingSpec.geo_locations,
        age_min: targetingSpec.age_min,
        age_max: targetingSpec.age_max,
        genders: targetingSpec.genders,
        device_platforms: targetingSpec.device_platforms,
        interests: targetingSpec.interests
      };
      
      // Use REST API directly for reach estimate
      const response = await this.api.call(
        'GET',
        [adAccountId, 'reachestimate'],
        {
          targeting_spec: JSON.stringify(formattedTargetingSpec),
          optimization_goal: 'REACH',
          access_token: process.env.META_ACCESS_TOKEN
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting reach estimate:', error);
      throw error;
    }
  }

  // Get targeting sentence lines (for interest suggestions)
  async getTargetingSentenceLines(adAccountId, query) {
    if (!this.rateLimiter.canMakeCall()) {
      throw new Error(`Rate limit exceeded. Wait ${this.rateLimiter.getWaitTime()}ms`);
    }

    try {
      this.rateLimiter.recordCall();
      
      const account = this.getAdAccount(adAccountId);
      
      const response = await account.getTargetingSentenceLines(
        [],
        {
          q: query,
          type: 'adinterest'
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting targeting sentence lines:', error);
      throw error;
    }
  }

  // Validate access token
  async validateToken() {
    try {
      const response = await this.api.call(
        'GET',
        ['me'],
        {
          access_token: process.env.META_ACCESS_TOKEN
        }
      );
      return response;
    } catch (error) {
      console.error('Error validating token:', error);
      throw error;
    }
  }

  // Get rate limit status
  getRateLimitStatus() {
    return {
      callsPerHour: this.rateLimiter.callsPerHour,
      currentCalls: this.rateLimiter.currentCalls,
      remainingCalls: this.rateLimiter.callsPerHour - this.rateLimiter.currentCalls,
      timeUntilReset: this.rateLimiter.getWaitTime(),
      canMakeCall: this.rateLimiter.canMakeCall()
    };
  }
}

module.exports = new MetaApiService();
