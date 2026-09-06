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
  },
  {
    id: 'veterans-crisis-line',
    name: 'Veterans Crisis Line',
    type: 'veterans',
    services: ['veteran-support', 'crisis-counseling', 'suicide-prevention', 'family-support'],
    address: 'Call 988, then press 1, or text 838255', city: 'National', state: 'US', zip: '00000',
    phone: '988', website: 'https://www.veteranscrisisline.net', hours: '24/7',
    intake: 'Call 988 and press 1, text 838255, or chat online', eligibility: 'Veterans, service members, and their loved ones', cost: 'Free',
    capacityStatus: 'Available 24/7', clientTypes: ['veterans', 'families'], wheelchair: true,
    source: 'public-directory', sourceId: 'veterans-crisis-line', verified: true
  },
  {
    id: 'va-homeless-programs',
    name: 'VA Homeless Programs',
    type: 'housing',
    services: ['veteran-housing', 'homeless-services', 'healthcare-referrals', 'employment-support'],
    address: 'Find VA homeless program support', city: 'National', state: 'US', zip: '00000',
    phone: '1-877-424-3838', website: 'https://www.va.gov/homeless', hours: 'Call for current hours',
    intake: 'Call the National Call Center for Homeless Veterans', eligibility: 'Veterans and their families', cost: 'Free',
    capacityStatus: 'Check local program', clientTypes: ['veterans', 'families'], wheelchair: true,
    source: 'public-directory', sourceId: 'va-homeless-programs', verified: true
  },
  {
    id: 'careeronestop',
    name: 'CareerOneStop Employment and Training',
    type: 'employment',
    services: ['job-search', 'career-training', 'workforce-referrals', 'unemployment-help'],
    address: 'Find a local American Job Center', city: 'National', state: 'US', zip: '00000',
    phone: '1-877-872-5627', website: 'https://www.careeronestop.org', hours: 'Online directory',
    intake: 'Search for a local American Job Center', eligibility: 'Varies by workforce program', cost: 'Free',
    capacityStatus: 'Check local center', clientTypes: ['adults', 'youth', 'veterans'], wheelchair: true,
    source: 'public-directory', sourceId: 'careeronestop', verified: true
  },
  {
    id: 'childcare-gov',
    name: 'ChildCare.gov Assistance Finder',
    type: 'childcare',
    services: ['childcare-assistance', 'childcare-referrals', 'family-support'],
    address: 'Find child care assistance by state', city: 'National', state: 'US', zip: '00000',
    phone: '211', website: 'https://childcare.gov', hours: 'Online directory',
    intake: 'Choose your state to find local assistance', eligibility: 'Varies by state program', cost: 'Varies',
    capacityStatus: 'Check local program', clientTypes: ['families', 'youth'], wheelchair: true,
    source: 'public-directory', sourceId: 'childcare-gov', verified: true
  },
  {
    id: 'usa-disability-services',
    name: 'USA.gov Disability Services',
    type: 'disability',
    services: ['disability-benefits', 'accessible-services', 'healthcare-referrals', 'caregiver-support'],
    address: 'Find disability benefits and services', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-333-4636', website: 'https://www.usa.gov/disability-services', hours: 'Online directory',
    intake: 'Search federal and state disability services', eligibility: 'Varies by program', cost: 'Free',
    capacityStatus: 'Check program requirements', clientTypes: ['individuals', 'families', 'veterans'], wheelchair: true,
    source: 'public-directory', sourceId: 'usa-disability-services', verified: true
  },
  {
    id: 'national-runaway-safeline',
    name: 'National Runaway Safeline',
    type: 'youth',
    services: ['youth-crisis-support', 'family-mediation', 'shelter-referrals', 'transportation-support'],
    address: 'Call, text, or chat online', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-786-2929', website: 'https://www.1800runaway.org', hours: '24/7',
    intake: 'Call, text, or chat with a trained staff member', eligibility: 'Young people and concerned adults', cost: 'Free',
    capacityStatus: 'Available 24/7', clientTypes: ['youth', 'families'], wheelchair: true,
    source: 'public-directory', sourceId: 'national-runaway-safeline', verified: true
  },
  {
    id: 'disaster-distress-helpline',
    name: 'SAMHSA Disaster Distress Helpline',
    type: 'crisis',
    services: ['disaster-support', 'crisis-counseling', 'emotional-support'],
    address: 'Call or text 1-800-985-5990', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-985-5990', website: 'https://www.samhsa.gov/find-help/disaster-distress-helpline', hours: '24/7',
    intake: 'Call or text the helpline', eligibility: 'People affected by disasters and emergencies', cost: 'Free',
    capacityStatus: 'Available 24/7', clientTypes: ['individuals', 'families', 'youth'], wheelchair: true,
    source: 'public-directory', sourceId: 'disaster-distress-helpline', verified: true
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
  return PUBLIC_RESOURCE_CATALOG.map(normalizePublicResource);
}

async function fetchConfiguredFeed() {
  if (!process.env.RESOURCE_FEED_URL) return [];
  console.log(`Fetching configured provider feed: ${process.env.RESOURCE_FEED_URL}`);
  const response = await fetch(process.env.RESOURCE_FEED_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`RESOURCE_FEED_URL returned ${response.status}`);
  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : payload.resources;
  if (!Array.isArray(records)) throw new Error('RESOURCE_FEED_URL must return an array or { resources: [] }');
  return records.map(normalizePublicResource);
}

async function consolidate() {
  const resources = deduplicate([
    ...(await fetchPublicCatalog()),
    ...(await fetchConfiguredFeed())
  ]).sort((a, b) => {
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

module.exports = { PUBLIC_RESOURCE_CATALOG, normalizePublicResource, deduplicate, fetchPublicCatalog, fetchConfiguredFeed, consolidate };
