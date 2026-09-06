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
const OSM_ENDPOINTS = (process.env.OSM_ENDPOINTS || process.env.OSM_ENDPOINT || 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter').split(',').map(value => value.trim()).filter(Boolean);
const OSM_BBOXES = [];
for (const south of [24, 30, 36, 42]) {
  for (const west of [-125, -118, -110, -102, -94, -86, -78]) {
    OSM_BBOXES.push(`${south},${west},${south + 6},${west + 7}`);
  }
}
OSM_BBOXES.push('18,-161,23,-154', '51,-180,72,-130');
const DEFAULT_SAMHSA_CSV_PATHS = [
  path.join(__dirname, '..', 'FindTreament_Facility_listing_2026_09_06_155248.csv'),
  path.join(__dirname, '..', 'FindTreament_Facility_listing_2026_09_06_160925.csv'),
  path.join(__dirname, '..', 'FindTreament_Facility_listing_2026_09_06_161810.csv')
];
const SAMHSA_CSV_PATHS = (process.env.SAMHSA_CSV_PATHS || process.env.SAMHSA_CSV_PATH || DEFAULT_SAMHSA_CSV_PATHS.join(','))
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

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
    address: 'Call 1-800-273-8255 and press 1, or text 838255', city: 'National', state: 'US', zip: '00000',
    phone: '1-800-273-8255', website: 'https://www.veteranscrisisline.net', hours: '24/7',
    intake: 'Call 1-800-273-8255 and press 1, text 838255, or use the online chat', eligibility: 'Veterans, service members, and their loved ones', cost: 'Free',
    capacityStatus: 'Available 24/7', clientTypes: ['veterans', 'families'], wheelchair: true,
    source: 'public-directory', sourceId: 'veterans-crisis-line', verified: true
  },
  {
    id: 'crisis-text-line',
    name: 'Crisis Text Line',
    type: 'crisis',
    services: ['crisis-counseling', 'text-support', 'emotional-support'],
    address: "Text 'HOME' to 741741", city: 'National', state: 'US', zip: '00000',
    phone: '741741', contactMode: 'sms', website: 'https://www.crisistextline.org', hours: '24/7',
    intake: "Text HOME to 741741 to connect with a trained crisis counselor", eligibility: 'Anyone in crisis or supporting someone in crisis', cost: 'Free',
    capacityStatus: 'Available 24/7', clientTypes: ['individuals', 'families', 'youth'], wheelchair: true,
    source: 'public-directory', sourceId: 'crisis-text-line', verified: true
  },
  {
    id: 'trevor-lifeline',
    name: 'The Trevor Lifeline',
    type: 'crisis',
    services: ['lgbtq-support', 'youth-crisis-support', 'suicide-prevention', 'crisis-counseling'],
    address: 'Call 1-866-488-7386', city: 'National', state: 'US', zip: '00000',
    phone: '1-866-488-7386', website: 'https://www.thetrevorproject.org/get-help-now/', hours: '24/7',
    intake: 'Call the Trevor Lifeline or use online chat/text support', eligibility: 'LGBTQ young people', cost: 'Free',
    capacityStatus: 'Available 24/7', clientTypes: ['youth', 'individuals'], wheelchair: true,
    source: 'public-directory', sourceId: 'trevor-lifeline', verified: true
  },
  {
    id: 'trans-lifeline',
    name: 'Trans Lifeline',
    type: 'crisis',
    services: ['trans-support', 'peer-support', 'crisis-counseling'],
    address: 'Call 1-877-565-8860', city: 'National', state: 'US', zip: '00000',
    phone: '1-877-565-8860', website: 'https://translifeline.org', hours: 'Check current hotline hours',
    intake: 'Call the peer-support hotline', eligibility: 'Trans and gender-diverse people', cost: 'Free',
    capacityStatus: 'Check current hours', clientTypes: ['individuals', 'youth'], wheelchair: true,
    source: 'public-directory', sourceId: 'trans-lifeline', verified: true
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value.trim());
    if (row.some(Boolean)) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows.shift();
  return rows.map(columns => headers.reduce((record, header, index) => {
    record[header] = columns[index] || '';
    return record;
  }, {}));
}

function csvFlag(row, key) {
  return row[key] === '1' || row[key] === 'Y' || row[key] === 'true';
}

function normalizeCsvFacility(row, index) {
  const name = [row.name1, row.name2].filter(Boolean).join(' - ').trim();
  const address = [row.street1, row.street2].filter(Boolean).join(', ');
  if (!name || (!row.phone && !row.website && !address)) return null;
  const type = row.type_facility === 'MH' ? 'mental-health' : row.type_facility === 'SU' ? 'substance' : 'general-support';
  const services = [];
  if (csvFlag(row, 'dt')) services.push('detox');
  if (csvFlag(row, 'mm')) services.push('medication-management');
  if (csvFlag(row, 'op')) services.push('outpatient');
  if (csvFlag(row, 'res')) services.push('residential');
  if (csvFlag(row, 'tele')) services.push('telehealth');
  if (csvFlag(row, 'sa') || type === 'substance') services.push('substance-use-treatment');
  if (type === 'mental-health') services.push('mental-health-treatment');
  const clientTypes = [];
  if (csvFlag(row, 'adol')) clientTypes.push('youth');
  if (csvFlag(row, 'fem')) clientTypes.push('women');
  if (csvFlag(row, 'male')) clientTypes.push('men');
  if (csvFlag(row, 'vet')) clientTypes.push('veterans');
  if (!clientTypes.length) clientTypes.push('adults');
  return normalizePublicResource({
    id: `samhsa-${String(row.state || 'US').toLowerCase()}-${index + 1}`,
    name,
    type,
    services: [...new Set(services.length ? services : ['referrals'])],
    address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    lat: Number(row.latitude) || null,
    lon: Number(row.longitude) || null,
    phone: row.phone || null,
    website: row.website || null,
    hours: 'Contact provider for hours',
    intake: 'Call ahead to confirm services and availability',
    eligibility: 'Varies by provider',
    cost: 'Varies by provider',
    capacityStatus: 'Call first',
    clientTypes,
    wheelchair: true,
    source: 'samhsa-csv',
    sourceId: row.frid || `samhsa-${String(row.state || 'US').toLowerCase()}-${index + 1}`,
    sourceUrl: 'https://findtreatment.gov',
    verified: true
  });
}

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
    contactMode: item.contactMode || 'phone',
    sourceUrl: item.sourceUrl || null,
    sourceUpdateDate: item.sourceUpdateDate || timestamp, lastFetched: timestamp, verified: Boolean(item.verified)
  };
}

function deduplicate(resources) {
  const seen = new Set();
  return resources.filter(resource => {
    const sourceKey = resource.sourceId ? `${resource.source || 'unknown'}-${resource.sourceId}` : '';
    const locationKey = `${resource.name}-${resource.address}-${resource.city}-${resource.zip}`.toLowerCase().trim();
    const key = sourceKey || locationKey;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchPublicCatalog() {
  console.log('Fetching official public resource directories...');
  return PUBLIC_RESOURCE_CATALOG.map(normalizePublicResource);
}

async function fetchCsvFacilities() {
  return SAMHSA_CSV_PATHS.flatMap(csvPath => {
    if (!fs.existsSync(csvPath)) return [];
    console.log(`Importing SAMHSA facility CSV: ${csvPath}`);
    const records = parseCsv(fs.readFileSync(csvPath, 'utf8'));
    return records.map(normalizeCsvFacility).filter(Boolean);
  });
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

function normalizeOsmResource(element) {
  const tags = element.tags || {};
  const name = tags.name || tags['official_name'];
  const lat = element.lat ?? element.center?.lat ?? null;
  const lon = element.lon ?? element.center?.lon ?? null;
  const hasAddress = tags['addr:street'] && (tags['addr:housenumber'] || tags['addr:place']);
  const hasContact = tags.phone || tags['contact:phone'] || tags.website || tags['contact:website'] || hasAddress;
  if (!name || !lat || !lon || !hasContact) return null;
  if (tags.amenity === 'shelter' && /picnic|gazebo/i.test(tags.shelter_type || '')) return null;

  const amenity = tags.amenity;
  const type = amenity === 'shelter' ? 'shelter' : amenity === 'food_bank' ? 'food' : 'general-support';
  const address = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || tags['addr:place'] || '';
  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || '';
  const state = tags['addr:state'] || '';
  const zip = tags['addr:postcode'] || '';
  const website = tags.website || tags['contact:website'] || null;
  const phone = tags.phone || tags['contact:phone'] || null;
  const sourceId = `osm-${element.type}-${element.id}`;
  return normalizePublicResource({
    id: sourceId,
    name,
    type,
    services: type === 'shelter' ? ['shelter', 'housing-referrals'] : type === 'food' ? ['food-assistance', 'food-bank-referrals'] : ['community-support', 'referrals'],
    address, city, state, zip, lat, lon, phone, website,
    hours: tags.opening_hours || 'Contact provider for hours',
    intake: 'Contact provider to confirm services and availability',
    eligibility: 'Varies by provider', cost: 'Varies', capacityStatus: 'Call first',
    clientTypes: ['individuals', 'families'], wheelchair: tags['wheelchair'] !== 'no',
    source: 'openstreetmap', sourceId, sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`, verified: false
  });
}

async function fetchOpenStreetMapResources() {
  if (process.env.OSM_IMPORT !== 'true') return [];
  const resources = [];
  const queryFor = bbox => `[out:json][timeout:90];(nwr["name"]["phone"]["amenity"~"shelter|social_centre|food_bank|clinic|community_centre"](${bbox});nwr["name"]["website"]["amenity"~"shelter|social_centre|food_bank|clinic|community_centre"](${bbox}););out center tags;`;
  for (const bbox of OSM_BBOXES) {
    console.log(`Fetching mapped community resources for ${bbox}...`);
    let imported = false;
    for (const endpoint of OSM_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'CrisisCompass/1.0 (resource directory)' },
          body: new URLSearchParams({ data: queryFor(bbox) })
        });
        if (!response.ok) throw new Error(`${response.status}`);
        const payload = await response.json();
        resources.push(...(payload.elements || []).map(normalizeOsmResource).filter(Boolean));
        imported = true;
        break;
      } catch (error) {
        console.warn(`OpenStreetMap endpoint unavailable for ${bbox}: ${endpoint} (${error.message})`);
      }
    }
    if (!imported) console.warn(`Skipping ${bbox}; official directory resources will still be generated.`);
  }
  return resources;
}

async function consolidate() {
  const resources = deduplicate([
    ...(await fetchPublicCatalog()),
    ...(await fetchCsvFacilities()),
    ...(await fetchConfiguredFeed()),
    ...(await fetchOpenStreetMapResources())
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

module.exports = { PUBLIC_RESOURCE_CATALOG, parseCsv, normalizeCsvFacility, normalizePublicResource, normalizeOsmResource, deduplicate, fetchPublicCatalog, fetchCsvFacilities, fetchConfiguredFeed, fetchOpenStreetMapResources, consolidate };
