# Real-Time API Integration Guide — Crisis Compass

## Overview
This guide covers integrating **real-time data** from national APIs for homelessness, housing, substance abuse, and mental health services. The system fetches data periodically, normalizes it to a canonical schema, and serves it via a REST API.

---

## National Data Sources

### 1. **SAMHSA National Helpline + Treatment Locator**
- **Endpoint:** https://findtreatment.gov/api/
- **What it provides:** Substance abuse treatment facilities, mental health services
- **Auth:** API Key (free, register at findtreatment.gov)
- **Rate limit:** 1000 req/day
- **Update frequency:** Daily
- **Schema:** Facilities with name, address, phone, services, coordinates

### 2. **HUD Exchange - CoC (Continuum of Care) Inventory**
- **Endpoint:** https://data.hud.gov/api/v1/
- **What it provides:** Shelters, housing assistance, homeless services by CoC
- **Auth:** HUD API Token (free, register at data.hud.gov)
- **Rate limit:** 1000 req/hour
- **Update frequency:** Monthly (CoC submits annually)
- **Schema:** Programs, beds, services, organization info

### 3. **211 Services (United Way Centralized Data)**
- **Endpoint:** https://api.211.org/ (requires partnership)
- **What it provides:** Comprehensive local services directory
- **Auth:** API Key + custom integration
- **Rate limit:** Varies
- **Update frequency:** Real-time (varies by provider)
- **Schema:** Organizations, services, locations, hours

### 4. **USDA National Hunger Hotline + Food Finder**
- **Endpoint:** https://data.nal.usda.gov/dataset/fns-food-programs-api
- **What it provides:** Food banks, SNAP, meal services
- **Auth:** API Key
- **Rate limit:** Reasonable
- **Update frequency:** Daily

### 5. **NAMI (National Alliance on Mental Illness) Support Groups**
- **Endpoint:** https://www.nami.org/api/ (limited)
- **What it provides:** Support groups, educational programs
- **Auth:** Limited/None
- **Update frequency:** Weekly

### 6. **Domestic Violence Hotline Database**
- **Endpoint:** National Domestic Violence Hotline (partner integration)
- **What it provides:** DV shelters, legal aid, counseling
- **Auth:** Partnership required
- **Update frequency:** Monthly

---

## Canonical Data Schema (OpenReferral-compatible)

```json
{
  "id": "unique-identifier",
  "name": "Organization Name",
  "type": "shelter|housing|substance|mental-health|legal|food",
  "services": ["detox", "counseling", "meals", "legal"],
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "county": "Sangamon",
  "lat": 39.7817,
  "lon": -89.6501,
  "phone": "+1-555-111-2222",
  "website": "https://example.org",
  "hours": "24/7 or M-F 9am-5pm",
  "intake": "Walk-ins welcome, Call ahead, By appointment",
  "eligibility": "No ID required, Proof of income, Sobriety required",
  "cost": "Free, Sliding scale, Paid",
  "capacity": "High, Medium, Call first",
  "clientTypes": ["families", "women", "men", "youth", "veterans", "lgbtq"],
  "accessibility": {
    "petFriendly": true,
    "wheelchair": true,
    "walkIns": true
  },
  "source": "samhsa|hud|211|usda|nami",
  "sourceId": "original-source-id",
  "sourceUpdateDate": "2025-12-06T10:30:00Z",
  "verifiedDate": "2025-12-01T00:00:00Z",
  "lastFetched": "2025-12-06T10:30:00Z"
}
```

---

## ETL Architecture

### Data Flow
```
National APIs
    ↓
Fetch (Python/Node)
    ↓
Normalize (Map to canonical schema)
    ↓
Deduplicate (Merge by address/name/phone)
    ↓
Geocode (Fill missing lat/lon)
    ↓
Store (PostgreSQL + PostGIS)
    ↓
Index (Elasticsearch/OpenSearch)
    ↓
REST API
    ↓
Frontend (Crisis Compass)
```

---

## Phase 1: Quick Start (GitHub Actions + Node.js)

### Step 1: Create ETL Backend

Create `/backend/etl.js`:

```javascript
// ETL script to fetch and normalize data from national APIs

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SAMHSA_API_KEY = process.env.SAMHSA_API_KEY;
const HUD_API_KEY = process.env.HUD_API_KEY;

// Normalize SAMHSA data
async function fetchSAMHSA() {
  try {
    const response = await axios.get(
      'https://findtreatment.gov/api/facilities',
      {
        headers: { 'X-API-Key': SAMHSA_API_KEY },
        params: { pageSize: 1000 }
      }
    );
    
    return response.data.map(facility => ({
      id: `samhsa-${facility.id}`,
      name: facility.name,
      type: facility.type === 'residential' ? 'substance' : 'mental-health',
      services: facility.services || [],
      address: facility.address1,
      city: facility.city,
      state: facility.state,
      zip: facility.zip,
      lat: facility.latitude,
      lon: facility.longitude,
      phone: facility.phone,
      website: facility.website,
      hours: 'Call for hours',
      cost: 'Sliding scale',
      source: 'samhsa',
      sourceId: facility.id,
      sourceUpdateDate: new Date().toISOString(),
      lastFetched: new Date().toISOString()
    }));
  } catch (error) {
    console.error('SAMHSA fetch failed:', error.message);
    return [];
  }
}

// Normalize HUD data
async function fetchHUD() {
  try {
    const response = await axios.get(
      'https://data.hud.gov/api/v1/programs',
      {
        headers: { 'X-HUD-API-Key': HUD_API_KEY }
      }
    );
    
    return response.data.map(program => ({
      id: `hud-${program.id}`,
      name: program.name,
      type: program.programType === 'ES' ? 'shelter' : 'housing',
      services: program.services || [],
      address: program.address,
      city: program.city,
      state: program.state,
      zip: program.zip,
      lat: program.latitude,
      lon: program.longitude,
      phone: program.phone,
      website: program.website,
      hours: 'Call for hours',
      capacity: 'Call first',
      source: 'hud',
      sourceId: program.id,
      sourceUpdateDate: new Date().toISOString(),
      lastFetched: new Date().toISOString()
    }));
  } catch (error) {
    console.error('HUD fetch failed:', error.message);
    return [];
  }
}

// Combine and deduplicate
async function consolidate() {
  const samhsa = await fetchSAMHSA();
  const hud = await fetchHUD();
  
  const all = [...samhsa, ...hud];
  
  // Simple deduplication by name + city
  const seen = new Set();
  const deduplicated = all.filter(item => {
    const key = `${item.name}-${item.city}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  // Save to JSON (temporary; later move to database)
  fs.writeFileSync(
    path.join(__dirname, '../resources.json'),
    JSON.stringify(deduplicated, null, 2)
  );
  
  console.log(`Fetched and consolidated ${deduplicated.length} resources`);
}

consolidate().catch(console.error);
```

### Step 2: GitHub Actions Scheduler

Create `.github/workflows/sync-data.yml`:

```yaml
name: Sync Real-Time Data

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install axios
      
      - name: Run ETL
        env:
          SAMHSA_API_KEY: ${{ secrets.SAMHSA_API_KEY }}
          HUD_API_KEY: ${{ secrets.HUD_API_KEY }}
        run: node backend/etl.js
      
      - name: Commit and push updated data
        run: |
          git config --local user.email "bot@crisiscompass.org"
          git config --local user.name "Crisis Compass Bot"
          git add resources.json
          git commit -m "Auto: Update data from national APIs" || echo "No changes"
          git push
```

### Step 3: Update Frontend to Use Live Data

Modify `scripts.js`:

```javascript
async function loadResources(){
  if(resourcesCache) return resourcesCache;
  try{
    // Fetch from live API or GitHub raw data
    const url = process.env.NODE_ENV === 'production'
      ? 'https://api.crisiscompass.org/resources'  // Your backend API
      : 'https://raw.githubusercontent.com/Aakash-Srinivasan02/Crisis_Compass/main/resources.json';
    
    const res = await fetch(url);
    resourcesCache = await res.json();
    
    // Add last-synced timestamp to UI
    const syncTime = new Date().toLocaleString();
    console.log(`Data last synced: ${syncTime}`);
    
    return resourcesCache;
  }catch(e){
    console.error('Failed to load resources', e);
    return [];
  }
}
```

---

## Phase 2: Production Backend (Node.js + PostgreSQL)

### Deploy on Heroku, Railway, or AWS:

1. **Database:** PostgreSQL with PostGIS for geo queries
2. **Cache:** Redis for fast lookups
3. **API:** Express.js REST endpoints
4. **Orchestration:** Kubernetes or Docker Compose

```javascript
// backend/api.js (Express)
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const app = express();

// GET /api/resources?lat=X&lon=Y&radius=50&type=shelter
app.get('/api/resources', async (req, res) => {
  const { lat, lon, radius = 50, type } = req.query;
  
  let query = 'SELECT * FROM resources WHERE 1=1';
  const params = [];
  
  if (lat && lon) {
    query += ` AND ST_DWithin(
      location, 
      ST_SetSRID(ST_MakePoint($${params.length + 1}, $${params.length + 2}), 4326), 
      $${params.length + 3}
    ) ORDER BY ST_Distance(location, ST_SetSRID(ST_MakePoint($${params.length + 1}, $${params.length + 2}), 4326))`;
    params.push(lon, lat, radius * 1609.34); // Convert miles to meters
  }
  
  if (type) {
    query += ` AND type = $${params.length + 1}`;
    params.push(type);
  }
  
  const result = await pool.query(query, params);
  res.json(result.rows);
});

app.listen(process.env.PORT || 3000);
```

---

## Phase 3: Advanced Features

### Real-Time Updates (WebSocket)
```javascript
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.on('search', async (query) => {
    const results = await pool.query('SELECT * FROM resources WHERE ...');
    socket.emit('results', results.rows);
  });
});
```

### Data Quality Monitoring
- Track API success rates, response times
- Alert on stale data (> 30 days old)
- Monitor deduplication accuracy

### User Feedback Loop
- Collect reports via anonymous form
- Flag inaccurate listings
- Auto-downrank unverified resources

---

## Getting Started: Next Steps

1. **Register for API keys:**
   - SAMHSA: https://findtreatment.gov/api
   - HUD: https://data.hud.gov/developers
   - 211: Contact your local211 provider

2. **Set environment variables:**
   ```bash
   export SAMHSA_API_KEY=your_key
   export HUD_API_KEY=your_key
   ```

3. **Run ETL locally:**
   ```bash
   npm install axios
   node backend/etl.js
   ```

4. **Deploy:**
   - GitHub Actions: Automatic daily sync
   - Backend: Deploy to Heroku, Railway, or AWS
   - Frontend: Points to live API

---

## Cost Estimates

| Component | Cost |
|-----------|------|
| SAMHSA API | Free |
| HUD API | Free |
| PostgreSQL (AWS RDS) | $15–50/month |
| Redis | $15–30/month |
| Express API (Heroku) | Free–$7/month |
| Total | **$30–80/month** |

---

## Support & Resources

- **OpenReferral Standard:** https://openreferral.org
- **SAMHSA Data:** https://findtreatment.gov
- **HUD Exchange:** https://www.hudexchange.info
- **211:** https://www.211.org

---

Would you like me to:
1. Set up GitHub Actions to start syncing data daily?
2. Build a Node.js backend API to serve live data?
3. Add database schema for PostgreSQL?
4. Create admin dashboard to monitor data quality?
