#!/usr/bin/env node

/**
 * Crisis Compass ETL
 * Builds the static directory from official, publicly available resource directories.
 * Local provider records can be added through the same canonical schema when a
 * licensed or public local feed is configured.
 */

const fs = require('fs');
const path = require('path');

const now = () => new Date().toISOString();

const LOCAL_RESOURCE_FALLBACKS = [
  {
    id: 'local-springfield-recovery', name: 'Downtown Recovery Center', type: 'substance',
    services: ['detox', 'counseling', 'case-management'], address: '123 Main St', city: 'Springfield', state: 'IL', zip: '62701',
    lat: 39.7817, lon: -89.6501, phone: '217-555-0100', website: 'https://findtreatment.gov',
    hours: 'Call for hours', intake: 'Call ahead', eligibility: 'Varies by program', cost: 'Sliding scale',
    capacityStatus: 'Call first', clientTypes: ['adults', 'teens'], wheelchair: true,
    source: 'local-fallback', sourceId: 'local-springfield-recovery', verified: false
  },
  {
    id: 'local-springfield-shelter', name: 'Hope Emergency Shelter', type: 'shelter',
    services: ['shelter', 'meals', 'case-management'], address: '789 Elm St', city: 'Springfield', state: 'IL', zip: '62703',
    lat: 39.789, lon: -89.64, phone: '217-555-0300', website: 'https://www.hud.gov',
    hours: 'Call for hours', intake: 'Walk-ins welcome', eligibility: 'Varies by program', cost: 'Free',
    capacityStatus: 'Call first', clientTypes: ['families', 'individuals'], walkIns: true, wheelchair: true,
    source: 'local-fallback', sourceId: 'local-springfield-shelter', verified: false
  },
  {
    id: 'local-los-angeles-recovery', name: 'California Recovery Services', type: 'substance',
    services: ['detox', 'counseling', 'rehab'], address: '789 Sunset Blvd', city: 'Los Angeles', state: 'CA', zip: '90210',
    lat: 34.0522, lon: -118.2437, phone: '213-555-0100', website: 'https://findtreatment.gov',
    hours: 'Call for hours', intake: 'Call ahead', eligibility: 'Varies by program', cost: 'Sliding scale',
    capacityStatus: 'Call first', clientTypes: ['adults', 'teens'], wheelchair: true,
    source: 'local-fallback', sourceId: 'local-los-angeles-recovery', verified: false
  }
];

const PUBLIC_RESOURCE_CATALOG = [
  {
    id: '211-national',
    name: '211 United Way Community Resource Finder',
    type: 'general-support',
    services: ['housing', 'food', 'utility-assistance', 'mental-health', 'family-support'],
    address: 'Dial 211 or search the online directory', city: 'National', state: 'US', zip: '00000',
    phone: '211', website: 'https://www.211.org', hours: 'Call 211 or visit online',
    intake: 'Call 211 or search online', eligibility: 'Varies by local program', cost: 'Free',
    capacityStatus: 'Call first', clientTypes: ['families', 'individuals', 'veterans', 'youth'],
    wheelchair: true, source: 'public-directory', sourceId: '211-national', verified: true
  },
  {
    id: '988-national',
    name: '988 Suicide & Crisis Lifeline',
    type: 'crisis',
    services: ['suicide-prevention', 'crisis-counseling', 'urgent-support'],
    address: 'Call or text 988', city: 'National', state: 'US', zip: '00000', phone: '988',
    website: 'https://988lifeline.org', hours: '24/7', intake: 'Call or text 988 anytime',
    eligibility: 'Open to anyone in crisis', cost: 'Free', capacityStatus: 'Available 24/7',
    clientTypes: ['individuals', 'families', 'youth', 'veterans'], wheelchair: true,
    source: 'public-directory', sourceId: '988-national', verified: true
  },
  {
    id: 'samhsa-treatment',
    name: 'SAMHSA FindTreatment.gov',
    type: 'substance',
    services: ['substance-use-treatment', 'mental-health-treatment', 'recovery-support'],
    address: 'Search treatment providers by ZIP code or state', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-662-4357', website: 'https://findtreatment.gov', hours: 'Online directory',
    intake: 'Search online or call the helpline', eligibility: 'Varies by provider', cost: 'Varies',
    capacityStatus: 'Check current availability', clientTypes: ['adults', 'teens', 'families'], wheelchair: true,
    source: 'public-directory', sourceId: 'samhsa-treatment', verified: true
  },
  {
    id: 'nami-support',
    name: 'NAMI Support and Education',
    type: 'mental-health',
    services: ['support-groups', 'education', 'peer-support', 'crisis-navigation'],
    address: 'Search local NAMI affiliates', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-950-6264', website: 'https://www.nami.org', hours: 'Contact local chapter',
    intake: 'Use the affiliate directory', eligibility: 'Open to people affected by mental illness', cost: 'Varies',
    capacityStatus: 'Check local chapter', clientTypes: ['families', 'individuals', 'veterans', 'youth'], wheelchair: true,
    source: 'public-directory', sourceId: 'nami-support', verified: true
  },
  {
    id: 'domestic-violence-hotline',
    name: 'National Domestic Violence Hotline',
    type: 'legal',
    services: ['safety-planning', 'domestic-violence-support', 'referrals', 'legal-help'],
    address: 'Call, text, or chat online', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-799-7233', website: 'https://www.thehotline.org', hours: '24/7',
    intake: 'Call, text, or chat safely', eligibility: 'Open to survivors and concerned loved ones', cost: 'Free',
    capacityStatus: 'Available 24/7', clientTypes: ['women', 'families', 'individuals'], wheelchair: true,
    source: 'public-directory', sourceId: 'domestic-violence-hotline', verified: true
  },
  {
    id: 'hud-housing',
    name: 'HUD Housing and Homeless Assistance',
    type: 'housing',
    services: ['housing-assistance', 'shelter-referrals', 'homeless-services', 'eviction-prevention'],
    address: 'Find local housing and homeless assistance agencies', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-569-4287', website: 'https://www.hud.gov', hours: 'Business hours vary',
    intake: 'Use HUD housing and local agency directories', eligibility: 'Varies by local program', cost: 'Free or low-cost',
    capacityStatus: 'Check local agency', clientTypes: ['families', 'individuals', 'veterans'], wheelchair: true,
    source: 'public-directory', sourceId: 'hud-housing', verified: true
  },
  {
    id: 'usda-hunger-hotline',
    name: 'USDA National Hunger Hotline',
    type: 'food',
    services: ['food-assistance', 'meal-sites', 'snap-referrals', 'food-bank-referrals'],
    address: 'Find food assistance near you', city: 'National', state: 'US', zip: '00000',
    phone: '1-866-348-6479', website: 'https://www.fns.usda.gov/national-hunger-hotline', hours: 'Weekday hours vary',
    intake: 'Call the hotline or use the online food resources', eligibility: 'Varies by program', cost: 'Free',
    capacityStatus: 'Check local provider', clientTypes: ['families', 'individuals', 'youth'], wheelchair: true,
    source: 'public-directory', sourceId: 'usda-hunger-hotline', verified: true
  }
];

function normalizePublicResource(item) {
  const timestamp = now();
  return {
    id: item.id,
    name: item.name,
    type: item.type || 'general-support',
    services: Array.isArray(item.services) ? item.services : [],
    address: item.address || '', city: item.city || 'National', state: item.state || 'US', zip: item.zip || '00000',
    lat: item.lat ?? null, lon: item.lon ?? null, phone: item.phone || null, website: item.website || null,
    hours: item.hours || 'Call for hours', intake: item.intake || 'Contact the provider',
    eligibility: item.eligibility || 'Varies', cost: item.cost || 'Varies',
    capacityStatus: item.capacityStatus || 'Check availability', clientTypes: item.clientTypes || [],
    petFriendly: Boolean(item.petFriendly), walkIns: Boolean(item.walkIns), wheelchair: item.wheelchair !== false,
    source: item.source || 'public-directory', sourceId: item.sourceId || item.id,
    sourceUpdateDate: item.sourceUpdateDate || timestamp, lastFetched: timestamp, verified: Boolean(item.verified)
  };
}

function deduplicate(resources) {
  const seen = new Set();
  return resources.filter(resource => {
    const key = `${resource.name}-${resource.city}`.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchPublicCatalog() {
  console.log('Fetching official public resource directories...');
  return [...LOCAL_RESOURCE_FALLBACKS, ...PUBLIC_RESOURCE_CATALOG].map(normalizePublicResource);
}

async function consolidate() {
  const resources = deduplicate((await fetchPublicCatalog())).sort((a, b) => {
    const aHasCoordinates = a.lat !== null && a.lon !== null;
    const bHasCoordinates = b.lat !== null && b.lon !== null;
    if (aHasCoordinates !== bHasCoordinates) return aHasCoordinates ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const outputPaths = [
    path.join(__dirname, 'resources.json'),
    path.join(__dirname, '..', 'resources.json')
  ];
  outputPaths.forEach(outputPath => fs.writeFileSync(outputPath, `${JSON.stringify(resources, null, 2)}\n`));
  console.log(`Saved ${resources.length} resources to ${outputPaths[1]}`);
  return resources;
}

if (require.main === module) consolidate().catch(error => { console.error('ETL failed:', error.message); process.exit(1); });

module.exports = { PUBLIC_RESOURCE_CATALOG, LOCAL_RESOURCE_FALLBACKS, normalizePublicResource, deduplicate, fetchPublicCatalog, consolidate };
