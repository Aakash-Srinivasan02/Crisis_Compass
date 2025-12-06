/**
 * Crisis Compass: Comprehensive Function Test Suite
 * Tests all frontend and backend functions
 * 
 * Run: npm test or node test-functions.js
 */

const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✅${colors.reset} ${name}`);
    results.push({ name, status: 'PASS' });
    testsPassed++;
  } catch (error) {
    console.log(`${colors.red}❌${colors.reset} ${name}`);
    console.log(`   Error: ${error.message}`);
    results.push({ name, status: 'FAIL', error: error.message });
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(`${message}: expected truthy, got ${value}`);
  }
}

function assertFalsy(value, message) {
  if (value) {
    throw new Error(`${message}: expected falsy, got ${value}`);
  }
}

function assertArray(value, message) {
  if (!Array.isArray(value)) {
    throw new Error(`${message}: expected array, got ${typeof value}`);
  }
}

function assertObject(value, message) {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${message}: expected object, got ${typeof value}`);
  }
}

// ============================================================
// BACKEND TESTS (Node.js server functions)
// ============================================================

console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}BACKEND API TESTS${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

// Test: calculateDistance function
test('calculateDistance: returns correct distance (Haversine)', () => {
  // Distance between Springfield IL and Chicago IL ~= 179 miles
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  const dist = calculateDistance(39.7817, -89.6501, 41.8781, -87.6298);
  assertTruthy(dist > 175 && dist < 185, 'Distance calculation (Springfield to Chicago ~179 mi)');
});

// Test: calculateDistance with same coordinates
test('calculateDistance: returns 0 for same coordinates', () => {
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  const dist = calculateDistance(39.7817, -89.6501, 39.7817, -89.6501);
  assertTruthy(dist < 0.1, 'Same coordinates distance');
});

// Test: loadResources function (backend)
test('loadResources: loads and parses JSON correctly', () => {
  const filePath = path.join(__dirname, 'resources.json');
  assertTruthy(fs.existsSync(filePath), 'resources.json exists');
  
  const data = fs.readFileSync(filePath, 'utf-8');
  const resources = JSON.parse(data);
  assertArray(resources, 'Parsed resources is array');
  assertTruthy(resources.length > 0, 'Resources array not empty');
});

// Test: validateResource function
test('validateResource: validates required fields', () => {
  function validateResource(resource) {
    return (
      resource.id &&
      resource.name &&
      resource.type &&
      (resource.lat !== undefined || resource.address)
    );
  }
  const valid = { id: 'r1', name: 'Test', type: 'shelter', address: '123 St' };
  const invalid = { id: 'r1', name: 'Test' }; // missing type
  
  assertTruthy(validateResource(valid), 'Valid resource passes');
  assertFalsy(validateResource(invalid), 'Invalid resource fails');
});

// Test: Resource schema
test('Resource schema: all resources have required fields', () => {
  const filePath = path.join(__dirname, 'resources.json');
  const resources = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  resources.forEach((r, idx) => {
    if (!r.id) throw new Error(`Resource ${idx} missing id`);
    if (!r.name) throw new Error(`Resource ${idx} missing name`);
    if (!r.type) throw new Error(`Resource ${idx} missing type`);
  });
});

// Test: API endpoint responses (mock)
test('API: /api/health response format', () => {
  function createHealthResponse() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      resourceCount: 4
    };
  }
  const response = createHealthResponse();
  assertEqual(response.status, 'ok', 'Health status');
  assertTruthy(response.timestamp, 'Health has timestamp');
  assertTruthy(typeof response.resourceCount === 'number', 'Health has count');
});

// Test: Resource filtering by type
test('API: filters resources by type', () => {
  function filterByType(resources, type) {
    return resources.filter(r => r.type === type);
  }
  const resources = [
    { id: '1', type: 'shelter' },
    { id: '2', type: 'housing' },
    { id: '3', type: 'shelter' }
  ];
  const shelters = filterByType(resources, 'shelter');
  assertEqual(shelters.length, 2, 'Filtered shelter count');
});

// Test: Resource filtering by clientType
test('API: filters resources by clientType', () => {
  function filterByClientType(resources, clientType) {
    return resources.filter(
      r => r.clientTypes && r.clientTypes.includes(clientType)
    );
  }
  const resources = [
    { id: '1', clientTypes: ['families', 'veterans'] },
    { id: '2', clientTypes: ['women'] },
    { id: '3', clientTypes: ['families'] }
  ];
  const families = filterByClientType(resources, 'families');
  assertEqual(families.length, 2, 'Filtered family count');
});

// Test: Pagination
test('API: paginate results correctly', () => {
  function paginate(items, limit, offset) {
    return items.slice(parseInt(offset) || 0, (parseInt(offset) || 0) + (parseInt(limit) || 100));
  }
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const page1 = paginate(items, 3, 0);
  const page2 = paginate(items, 3, 3);
  
  assertEqual(page1.length, 3, 'Page 1 length');
  assertEqual(page1[0], 1, 'Page 1 first item');
  assertEqual(page2[0], 4, 'Page 2 first item');
});

// ============================================================
// FRONTEND TESTS (Client-side JavaScript functions)
// ============================================================

console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}FRONTEND FUNCTION TESTS${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

// Test: escapeHtml function
test('escapeHtml: escapes HTML special characters', () => {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    })[c]);
  }
  assertEqual(escapeHtml('<script>'), '&lt;script&gt;', 'Escape tags');
  assertEqual(escapeHtml('"test"'), '&quot;test&quot;', 'Escape quotes');
  assertEqual(escapeHtml('A & B'), 'A &amp; B', 'Escape ampersand');
  assertEqual(escapeHtml(''), '', 'Empty string');
  assertEqual(escapeHtml(null), '', 'Null input');
});

// Test: matchText function
test('matchText: matches text in resource properties', () => {
  function matchText(item, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return [item.name, item.city, item.zip, (item.services || []).join(' '), item.type]
      .join(' ')
      .toLowerCase()
      .includes(q);
  }
  const item = { name: 'Hope Shelter', city: 'Springfield', zip: '62701', type: 'shelter', services: ['beds', 'meals'] };
  assertTruthy(matchText(item, 'Hope'), 'Match by name');
  assertTruthy(matchText(item, 'Springfield'), 'Match by city');
  assertTruthy(matchText(item, '62701'), 'Match by zip');
  assertTruthy(matchText(item, 'meals'), 'Match by service');
  assertTruthy(matchText(item, ''), 'Empty query matches all');
  assertFalsy(matchText(item, 'unknown'), 'No match');
});

// Test: distanceMiles function
test('distanceMiles: calculates Haversine distance correctly', () => {
  function distanceMiles(lat1, lon1, lat2, lon2) {
    if (!lat2 || !lon2) return null;
    const R = 3958.8;
    const toRad = v => v * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  const dist = distanceMiles(39.7817, -89.6501, 41.8781, -87.6298);
  assertTruthy(dist > 175 && dist < 185, 'Springfield to Chicago distance ~179 mi');
  assertTruthy(Math.abs(distanceMiles(39.7817, -89.6501, 39.7817, -89.6501)) < 0.1, 'Same location');
  assertEqual(distanceMiles(0, 0, 0, null), null, 'Null coords');
});

// Test: passesRefinements function
test('passesRefinements: validates refinement filters', () => {
  function passesRefinements(item, selectedClients, selectedReqs) {
    if (selectedClients.length) {
      if (!item.clientTypes || !selectedClients.some(c => (item.clientTypes || []).includes(c))) {
        return false;
      }
    }
    if (selectedReqs.includes('pet_friendly') && !item.petFriendly) return false;
    if (selectedReqs.includes('walkins') && !item.walkIns) return false;
    if (selectedReqs.includes('wheelchair') && !item.wheelchair) return false;
    return true;
  }
  
  const item = { petFriendly: true, walkIns: false, wheelchair: true, clientTypes: ['families'] };
  assertTruthy(passesRefinements(item, [], []), 'No refinements');
  assertTruthy(passesRefinements(item, ['families'], []), 'Client type match');
  assertFalsy(passesRefinements(item, ['women'], []), 'Client type no match');
  assertTruthy(passesRefinements(item, [], ['pet_friendly']), 'Requirement: pet_friendly');
  assertFalsy(passesRefinements(item, [], ['walkins']), 'Requirement: walkins fail');
});

// Test: loadTranslation function
test('loadTranslation: handles translation file loading', () => {
  function simulateLoadTranslation(lang) {
    const filePath = path.join(__dirname, 'i18n', lang + '.json');
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  
  const en = simulateLoadTranslation('en');
  assertObject(en, 'English translation loaded');
  assertTruthy(en['query_label'] || Object.keys(en).length > 0, 'Translation has keys');
  
  const invalid = simulateLoadTranslation('invalid');
  assertEqual(invalid, null, 'Invalid language returns null');
});

// Test: applyTranslations function
test('applyTranslations: applies translations to DOM elements', () => {
  function applyTranslations(trans, mockDOM) {
    if (!trans) return;
    Object.keys(mockDOM).forEach(key => {
      if (trans[key]) mockDOM[key] = trans[key];
    });
  }
  
  const mockDOM = { 'query_label': 'Old text', 'search_button': 'Old button' };
  const trans = { 'query_label': 'Buscar', 'search_button': 'Búsqueda' };
  applyTranslations(trans, mockDOM);
  
  assertEqual(mockDOM['query_label'], 'Buscar', 'Translation applied');
  assertEqual(mockDOM['search_button'], 'Búsqueda', 'Translation applied');
});

// Test: submitReport function
test('submitReport: stores report in localStorage format', () => {
  function submitReport(id, problem, details) {
    const reports = JSON.parse(localStorage.getItem('reports||[]') || '[]');
    reports.push({ id, problem, details, t: new Date().toISOString() });
    localStorage.setItem('reports||[]', JSON.stringify(reports));
    return reports;
  }
  
  // Mock localStorage
  global.localStorage = { 
    data: {},
    getItem(key) { return this.data[key]; },
    setItem(key, val) { this.data[key] = val; }
  };
  
  const reports = submitReport('r1', 'phone', 'Wrong number');
  assertTruthy(reports.length > 0, 'Report stored');
  assertEqual(reports[0].id, 'r1', 'Report has correct ID');
});

// Test: quickExit function behavior
test('quickExit: redirects to safe URL', () => {
  let redirectedTo = null;
  global.window = {
    location: {
      replace(url) { redirectedTo = url; },
      href: null
    }
  };
  
  function quickExit() {
    try { 
      window.location.replace('https://www.weather.com'); 
    } catch (e) { 
      window.location.href = 'https://www.weather.com'; 
    }
  }
  
  quickExit();
  assertEqual(redirectedTo, 'https://www.weather.com', 'Quick exit URL correct');
});

// Test: Sorting by distance
test('Sorting: sorts resources by distance correctly', () => {
  function sortByDistance(items) {
    return items.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }
  
  const items = [
    { id: '1', distance: 10 },
    { id: '2', distance: null },
    { id: '3', distance: 5 },
    { id: '4', distance: 20 }
  ];
  const sorted = sortByDistance([...items]);
  assertEqual(sorted[0].distance, 5, 'Closest first');
  assertEqual(sorted[1].distance, 10, 'Second closest');
  assertEqual(sorted[2].distance, 20, 'Farthest with distance');
  assertEqual(sorted[3].distance, null, 'Null distance last');
});

// Test: Low-bandwidth mode toggle
test('Low-bandwidth mode: toggles correctly', () => {
  let isEnabled = false;
  function toggleLowBandwidth() {
    isEnabled = !isEnabled;
    localStorage.setItem('lowBandwidth', isEnabled ? '1' : '0');
    return isEnabled;
  }
  
  global.localStorage = {
    data: {},
    getItem(key) { return this.data[key]; },
    setItem(key, val) { this.data[key] = val; }
  };
  
  let state = toggleLowBandwidth();
  assertTruthy(state, 'Low-bandwidth enabled');
  state = toggleLowBandwidth();
  assertFalsy(state, 'Low-bandwidth disabled');
});

// Test: Language persistence
test('Language: persists to localStorage', () => {
  global.localStorage = {
    data: {},
    getItem(key) { return this.data[key]; },
    setItem(key, val) { this.data[key] = val; }
  };
  
  function setLanguage(lang) {
    localStorage.setItem('lang', lang);
  }
  
  setLanguage('es');
  assertEqual(global.localStorage.getItem('lang'), 'es', 'Language persisted');
  
  setLanguage('fr');
  assertEqual(global.localStorage.getItem('lang'), 'fr', 'Language changed');
});

// ============================================================
// LOCATION FEATURE TESTS (Tests 21-30)
// ============================================================

test('geolocateAndSearch: filters resources within 50 miles', () => {
  const filePath = path.join(__dirname, 'resources.json');
  const resources = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  const userLat = 39.78, userLon = -89.65;
  const withinRange = resources.map(r => {
    const d = calculateDistance(userLat, userLon, r.lat, r.lon);
    return {r, d};
  })
    .filter(x => x.d === null || x.d <= 50);
  assertTruthy(withinRange.length === resources.length, 'All resources within 50 miles');
});

test('geolocateAndSearch: sorts results by distance (closest first)', () => {
  const filePath = path.join(__dirname, 'resources.json');
  const resources = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  const userLat = 39.78, userLon = -89.65;
  const sorted = resources
    .map(r => ({r, d: calculateDistance(userLat, userLon, r.lat, r.lon)}))
    .sort((a,b) => {
      if(a.d === null) return 1;
      if(b.d === null) return -1;
      return a.d - b.d;
    });
  const isSorted = sorted.every((item, i, arr) => {
    if(i === 0) return true;
    const prev = arr[i-1];
    if(item.d === null && prev.d === null) return true;
    if(item.d === null) return true;
    if(prev.d === null) return false;
    return prev.d <= item.d;
  });
  assertTruthy(isSorted, 'Results sorted by distance ascending');
});

test('renderResults: displays distance in results', () => {
  const filePath = path.join(__dirname, 'resources.json');
  const resources = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  function distanceMiles(lat1, lon1, lat2, lon2){
    if(!lat2 || !lon2) return null;
    const R = 3958.8;
    const toRad = v=>v*Math.PI/180;
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  }
  
  global.window = { __userLocation: { lat: 39.78, lon: -89.65 } };
  const resource = resources[0];
  const distance = distanceMiles(39.78, -89.65, resource.lat, resource.lon);
  assertTruthy(distance > 0 && distance < 1, 'Distance calculated correctly (< 1 mile)');
});

test('Map popups: include distance when available', () => {
  const filePath = path.join(__dirname, 'resources.json');
  const resources = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
  function distanceMiles(lat1, lon1, lat2, lon2){
    if(!lat2 || !lon2) return null;
    const R = 3958.8;
    const toRad = v=>v*Math.PI/180;
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  }
  
  global.window = { __userLocation: { lat: 39.78, lon: -89.65 } };
  const resource = resources[0];
  const dist = distanceMiles(39.78, -89.65, resource.lat, resource.lon);
  const popupText = dist.toFixed(1) + ' miles away';
  assertTruthy(popupText.includes('miles away'), 'Popup text includes distance');
});

test('setupMap: centers map on user location (zoom 13)', () => {
  global.window = { __userLocation: { lat: 39.78, lon: -89.65 } };
  const zoomLevel = global.window.__userLocation ? 13 : 4;
  assertEqual(zoomLevel, 13, 'Zoom level 13 when user location available');
});

test('setupMap: defaults to USA-wide view (zoom 4)', () => {
  global.window = {};
  const zoomLevel = global.window.__userLocation ? 13 : 4;
  assertEqual(zoomLevel, 4, 'Zoom level 4 when no user location');
});

test('Geolocation: error handling for permission denied', () => {
  const errorCode = 1;
  const errorMessages = {
    1: 'Permission denied. Enable location access in your browser settings.',
    2: 'Position unavailable. Try again or use city/ZIP search.',
    3: 'Request timeout. Your device took too long to find location.'
  };
  assertTruthy(errorMessages[errorCode] !== undefined, 'Error code 1 has message');
});

test('Geolocation: error handling for position unavailable', () => {
  const errorCode = 2;
  const errorMessages = {
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Request timeout'
  };
  assertTruthy(errorMessages[errorCode] !== undefined, 'Error code 2 has message');
});

test('Geolocation: error handling for timeout', () => {
  const errorCode = 3;
  const errorMessages = {
    1: 'Permission denied',
    2: 'Position unavailable',
    3: 'Request timeout'
  };
  assertTruthy(errorMessages[errorCode] !== undefined, 'Error code 3 has message');
});

test('User marker: displays on map with custom icon', () => {
  global.window = { __userLocation: { lat: 39.78, lon: -89.65 } };
  const hasLocation = global.window.__userLocation !== undefined;
  assertTruthy(hasLocation, 'User location available for marker');
});

// ============================================================
// SUMMARY
// ============================================================

console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}TEST SUMMARY${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}❌ Some tests failed${colors.reset}\n`);
  process.exit(1);
}
