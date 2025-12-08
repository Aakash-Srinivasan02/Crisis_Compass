#!/usr/bin/env node

/**
 * Crisis Compass ETL Script
 * Fetches real-time data from national APIs and normalizes to canonical schema
 */

const fs = require('fs');
const path = require('path');

// Mock API responses for demonstration (replace with real API calls)
const MOCK_SAMHSA = [
  {
    id: 1,
    name: "Downtown Recovery Center",
    address1: "123 Main St",
    city: "Springfield",
    state: "IL",
    zip: "62701",
    latitude: 39.7817,
    longitude: -89.6501,
    phone: "217-555-0100",
    website: "https://downtonrecovery.org",
    type: "residential",
    services: ["detox", "counseling", "case-management"]
  },
  {
    id: 2,
    name: "Mental Health Alliance",
    address1: "456 Oak Ave",
    city: "Springfield",
    state: "IL",
    zip: "62702",
    latitude: 39.7850,
    longitude: -89.6450,
    phone: "217-555-0200",
    website: "https://mha-illinois.org",
    type: "outpatient",
    services: ["counseling", "medication-management", "support-groups"]
  },
  {
    id: 3,
    name: "California Recovery Services",
    address1: "789 Sunset Blvd",
    city: "Los Angeles",
    state: "CA",
    zip: "90210",
    latitude: 34.0522,
    longitude: -118.2437,
    phone: "213-555-0100",
    website: "https://carecovery.org",
    type: "residential",
    services: ["detox", "counseling", "rehab"]
  },
  {
    id: 4,
    name: "Texas Mental Health Center",
    address1: "456 Houston St",
    city: "Houston",
    state: "TX",
    zip: "77001",
    latitude: 29.7604,
    longitude: -95.3698,
    phone: "713-555-0200",
    website: "https://txmentalhealth.org",
    type: "outpatient",
    services: ["counseling", "therapy", "support-groups"]
  },
  {
    id: 5,
    name: "New York Crisis Center",
    address1: "123 Broadway",
    city: "New York",
    state: "NY",
    zip: "10001",
    latitude: 40.7128,
    longitude: -74.0060,
    phone: "212-555-0300",
    website: "https://nycrisis.org",
    type: "crisis",
    services: ["crisis-intervention", "counseling", "hotline"]
  },
  {
    id: 6,
    name: "Florida Addiction Treatment",
    address1: "789 Palm Ave",
    city: "Miami",
    state: "FL",
    zip: "33101",
    latitude: 25.7617,
    longitude: -80.1918,
    phone: "305-555-0400",
    website: "https://fladdiction.org",
    type: "residential",
    services: ["detox", "rehab", "aftercare"]
  }
];

const MOCK_HUD = [
  {
    id: "hud-001",
    name: "Hope Emergency Shelter",
    address: "789 Elm St",
    city: "Springfield",
    state: "IL",
    zip: "62703",
    latitude: 39.7890,
    longitude: -89.6400,
    phone: "217-555-0300",
    website: "https://hopeshelter.org",
    programType: "ES",
    services: ["shelter", "meals", "case-management"]
  },
  {
    id: "hud-002",
    name: "Supportive Housing Program",
    address: "321 Pine Ln",
    city: "Springfield",
    state: "IL",
    zip: "62704",
    latitude: 39.7750,
    longitude: -89.6550,
    phone: "217-555-0400",
    website: "https://supporthousing.org",
    programType: "PSH",
    services: ["housing", "case-management", "mental-health-services"]
  },
  {
    id: "hud-003",
    name: "California Homeless Services",
    address: "456 Hollywood Blvd",
    city: "Los Angeles",
    state: "CA",
    zip: "90211",
    latitude: 34.0928,
    longitude: -118.3287,
    phone: "213-555-0500",
    website: "https://cahomeless.org",
    programType: "ES",
    services: ["shelter", "meals", "case-management"]
  },
  {
    id: "hud-004",
    name: "Texas Housing Authority",
    address: "789 Dallas St",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    latitude: 32.7767,
    longitude: -96.7970,
    phone: "214-555-0600",
    website: "https://txhousing.org",
    programType: "PSH",
    services: ["housing", "case-management", "support-services"]
  },
  {
    id: "hud-005",
    name: "New York City Shelter",
    address: "123 Manhattan Ave",
    city: "New York",
    state: "NY",
    zip: "10002",
    latitude: 40.7831,
    longitude: -73.9712,
    phone: "212-555-0700",
    website: "https://nyc-shelter.org",
    programType: "ES",
    services: ["shelter", "meals", "case-management"]
  },
  {
    id: "hud-006",
    name: "Florida Supportive Housing",
    address: "456 Miami Beach Blvd",
    city: "Miami Beach",
    state: "FL",
    zip: "33139",
    latitude: 25.7907,
    longitude: -80.1300,
    phone: "305-555-0800",
    website: "https://flhousing.org",
    programType: "PSH",
    services: ["housing", "mental-health-services", "case-management"]
  }
];

/**
 * Normalize SAMHSA data to canonical schema
 */
function normalizeSAMHSA(facilities) {
  return facilities.map(f => ({
    id: `samhsa-${f.id}`,
    name: f.name || "Unknown",
    type: f.type === 'residential' ? 'substance' : 'mental-health',
    services: f.services || [],
    address: f.address1 || "",
    city: f.city || "",
    state: f.state || "",
    zip: f.zip || "",
    lat: f.latitude || null,
    lon: f.longitude || null,
    phone: f.phone || null,
    website: f.website || null,
    hours: "Call for hours",
    intake: "Call ahead",
    eligibility: "No ID required",
    cost: "Sliding scale",
    capacityStatus: "Call first",
    clientTypes: ["adults", "teens"],
    petFriendly: false,
    walkIns: false,
    wheelchair: true,
    source: "samhsa",
    sourceId: f.id.toString(),
    sourceUpdateDate: new Date().toISOString(),
    lastFetched: new Date().toISOString()
  }));
}

/**
 * Normalize HUD data to canonical schema
 */
function normalizeHUD(programs) {
  return programs.map(p => ({
    id: `hud-${p.id}`,
    name: p.name || "Unknown",
    type: p.programType === 'ES' ? 'shelter' : 'housing',
    services: p.services || [],
    address: p.address || "",
    city: p.city || "",
    state: p.state || "",
    zip: p.zip || "",
    lat: p.latitude || null,
    lon: p.longitude || null,
    phone: p.phone || null,
    website: p.website || null,
    hours: "Call for hours",
    intake: "Walk-ins welcome",
    eligibility: "Low income",
    cost: "Free",
    capacityStatus: "Call first",
    clientTypes: ["families", "individuals"],
    petFriendly: false,
    walkIns: true,
    wheelchair: true,
    source: "hud",
    sourceId: p.id.toString(),
    sourceUpdateDate: new Date().toISOString(),
    lastFetched: new Date().toISOString()
  }));
}

/**
 * Fetch data from external APIs (stub for demonstration)
 */
async function fetchSAMHSA() {
  console.log("⏳ Fetching SAMHSA facilities...");
  // In production, replace with real API call:
  // const response = await fetch('https://findtreatment.gov/api/facilities', { headers: { 'X-API-Key': process.env.SAMHSA_API_KEY } });
  // return response.json();
  return MOCK_SAMHSA;
}

async function fetchHUD() {
  console.log("⏳ Fetching HUD programs...");
  // In production, replace with real API call:
  // const response = await fetch('https://data.hud.gov/api/v1/programs', { headers: { 'X-HUD-API-Key': process.env.HUD_API_KEY } });
  // return response.json();
  return MOCK_HUD;
}

/**
 * Deduplicate resources by name + city
 */
function deduplicate(resources) {
  const seen = new Set();
  return resources.filter(item => {
    const key = `${item.name}-${item.city}`.toLowerCase().trim();
    if (seen.has(key)) {
      console.log(`⚠️  Duplicate detected: "${item.name}" (${item.city}) — skipping`);
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Main ETL orchestration
 */
async function consolidate() {
  try {
    console.log("🚀 Starting Crisis Compass ETL...\n");
    
    // Fetch from all sources
    const samhsaRaw = await fetchSAMHSA();
    const hudRaw = await fetchHUD();
    
    console.log(`✅ SAMHSA: Fetched ${samhsaRaw.length} facilities`);
    console.log(`✅ HUD: Fetched ${hudRaw.length} programs\n`);
    
    // Normalize
    const samhsa = normalizeSAMHSA(samhsaRaw);
    const hud = normalizeHUD(hudRaw);
    
    console.log(`✅ Normalized ${samhsa.length} SAMHSA records`);
    console.log(`✅ Normalized ${hud.length} HUD records\n`);
    
    // Combine and deduplicate
    const all = [...samhsa, ...hud];
    const final = deduplicate(all);
    
    console.log(`✅ After deduplication: ${final.length} unique resources\n`);
    
    // Sort by name for consistency
    final.sort((a, b) => a.name.localeCompare(b.name));
    
    // Save to resources.json
    const outputPath = path.join(__dirname, 'resources.json');
    fs.writeFileSync(outputPath, JSON.stringify(final, null, 2) + '\n');
    
    console.log(`✅ Saved to ${outputPath}`);
    console.log(`📊 Summary:`);
    console.log(`   - Total resources: ${final.length}`);
    console.log(`   - Shelters: ${final.filter(r => r.type === 'shelter').length}`);
    console.log(`   - Housing: ${final.filter(r => r.type === 'housing').length}`);
    console.log(`   - Substance abuse: ${final.filter(r => r.type === 'substance').length}`);
    console.log(`   - Mental health: ${final.filter(r => r.type === 'mental-health').length}`);
    console.log(`   - Legal: ${final.filter(r => r.type === 'legal').length}`);
    console.log(`\n✨ ETL complete!`);
    
  } catch (error) {
    console.error("❌ ETL failed:", error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  consolidate();
}

module.exports = { normalizeSAMHSA, normalizeHUD, deduplicate, consolidate };
