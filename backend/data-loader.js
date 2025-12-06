/**
 * Crisis Compass - Data Loading Module
 * 
 * Supports both:
 * 1. Static resources.json (development/fallback)
 * 2. Live API endpoint (production)
 * 
 * Gracefully degrades if APIs are unavailable.
 */

let resourcesCache = null;
let lastSyncTime = null;
const DATA_SOURCES = {
  STATIC: 'static',
  API: 'api',
  HYBRID: 'hybrid'
};

/**
 * Load resources from configured source
 * Priority: Live API > Static JSON > Empty array
 */
async function loadResources() {
  if (resourcesCache && lastSyncTime) {
    return resourcesCache;
  }

  try {
    // Determine data source based on environment
    const dataSource = determineDataSource();
    console.log(`📡 Loading resources from: ${dataSource}`);

    let resources = [];

    if (dataSource === DATA_SOURCES.API || dataSource === DATA_SOURCES.HYBRID) {
      resources = await loadFromAPI();
      if (resources.length > 0) {
        resourcesCache = resources;
        lastSyncTime = new Date();
        console.log(`✅ Loaded ${resources.length} resources from live API`);
        return resourcesCache;
      }
      console.log('⚠️  API unavailable, falling back to static data');
    }

    if (dataSource === DATA_SOURCES.STATIC || dataSource === DATA_SOURCES.HYBRID) {
      resources = await loadFromJSON();
      resourcesCache = resources;
      lastSyncTime = new Date();
      console.log(`✅ Loaded ${resources.length} resources from static JSON`);
      return resourcesCache;
    }

    return [];
  } catch (error) {
    console.error('❌ Failed to load resources:', error);
    return [];
  }
}

/**
 * Determine which data source to use
 */
function determineDataSource() {
  // Check for API endpoint in environment or config
  if (
    typeof window !== 'undefined' &&
    window.CRISIS_COMPASS_CONFIG?.apiEndpoint
  ) {
    return DATA_SOURCES.HYBRID; // Try API first, fall back to JSON
  }
  return DATA_SOURCES.STATIC; // Use static JSON only
}

/**
 * Load resources from live API endpoint
 */
async function loadFromAPI() {
  try {
    const apiEndpoint =
      (typeof window !== 'undefined' &&
        window.CRISIS_COMPASS_CONFIG?.apiEndpoint) ||
      '/api/resources';

    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const resources = Array.isArray(data) ? data : data.resources || [];
    return resources.filter(validateResource);
  } catch (error) {
    console.warn('⚠️  API load failed:', error.message);
    return [];
  }
}

/**
 * Load resources from static JSON file
 */
async function loadFromJSON() {
  try {
    const response = await fetch('resources.json');
    if (!response.ok) {
      throw new Error(`Failed to load resources.json`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('⚠️  JSON load failed:', error.message);
    return [];
  }
}

/**
 * Validate resource has required fields
 */
function validateResource(resource) {
  return (
    resource.id &&
    resource.name &&
    resource.type &&
    (resource.lat !== undefined || resource.address)
  );
}

/**
 * Display last sync time in UI (optional)
 */
function displaySyncInfo() {
  if (!lastSyncTime) return;

  const syncElement = document.getElementById('last-sync-info');
  if (syncElement) {
    const timeAgo = getTimeAgo(lastSyncTime);
    syncElement.textContent = `📊 Data updated ${timeAgo}`;
  }
}

/**
 * Format time difference as human-readable string
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Force refresh data from API (for admin/scheduler)
 */
async function refreshResourcesFromAPI() {
  resourcesCache = null;
  lastSyncTime = null;
  const resources = await loadResources();
  displaySyncInfo();
  return resources;
}

/**
 * Export for testing
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadResources,
    refreshResourcesFromAPI,
    validateResource,
    determineDataSource,
    getTimeAgo
  };
}
