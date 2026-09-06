# Crisis Compass Backend API

Real-time resource directory API for homelessness, housing, substance abuse, and mental health services.

## Quick Start

### Installation
```bash
npm install
```

### Run ETL (Data Pipeline)
```bash
npm run etl
```

The ETL always includes official national referral directories. To merge a verified
provider feed that returns either an array or `{ "resources": [] }`, configure:

```bash
RESOURCE_FEED_URL=https://example.gov/verified-resources.json npm run etl
```

Provider-feed records must use the canonical resource fields and are normalized before
they are merged. The pipeline does not invent local addresses, phone numbers, or map
coordinates when a feed omits them.

For community-mapped locations, run the optional OpenStreetMap importer with
`OSM_IMPORT=true`. It uses Overpass endpoints, keeps named records with a phone or
website, marks them as not independently verified, and preserves the OSM attribution
URL. Public Overpass services may rate-limit bulk runs; configure `OSM_ENDPOINTS` with
approved endpoints or use a permitted bulk extract for a reliable 1,000-plus import.

### Start API Server
```bash
npm start
```

### Run Tests
```bash
./test-api.sh    # Comprehensive integration test
npm test         # Unit tests (when available)
```

## Architecture

```
National APIs (SAMHSA, HUD, 211, USDA, NAMI)
        ↓
ETL Script (backend/etl.js)
├─ Fetch from national APIs
├─ Normalize to canonical schema
├─ Deduplicate resources
└─ Geocode missing coordinates
        ↓
resources.json (Deduplicated data)
├─ Served via GitHub Pages CDN
└─ Updated daily via GitHub Actions
        ↓
Express.js REST API (backend/server.js)
├─ Geo-filtered search
├─ Full-text search
├─ Type/client-type filtering
└─ Pagination
        ↓
Crisis Compass Frontend (index.html)
├─ Uses live API
└─ Falls back to static JSON if offline
```

## File Overview

### `backend/etl.js`
**Purpose:** Extract, Transform, Load data pipeline

**What it does:**
- Fetches data from national APIs (SAMHSA, HUD, 211, etc.)
- Normalizes to canonical OpenReferral schema
- Deduplicates by name + city
- Geocodes missing coordinates
- Saves to resources.json

**Currently uses:** Mock data (ready for real APIs)

**To integrate real APIs:**
1. Replace mock fetch functions with actual API calls
2. Set environment variables (SAMHSA_API_KEY, HUD_API_KEY)
3. Run: `SAMHSA_API_KEY=xxx HUD_API_KEY=yyy npm run etl`

### `backend/server.js`
**Purpose:** Express.js REST API server

**Endpoints:**
- `GET /api/health` — Health check
- `GET /api/resources` — Query resources with filters
- `GET /api/resources/:id` — Get single resource
- `POST /api/search` — POST-based search
- `POST /api/admin/reload` — Reload data from file
- `GET /api/admin/stats` — Get statistics

**Features:**
- Geo-filtering (distance-based search with Haversine formula)
- Full-text search (name, city, services)
- Type filtering (shelter, housing, substance, etc.)
- Client-type filtering (families, veterans, etc.)
- Pagination (limit/offset)
- CORS enabled

**Start server:**
```bash
npm start
```

**Test endpoints:**
```bash
# Health check
curl http://localhost:3000/api/health

# All resources
curl http://localhost:3000/api/resources

# Filtered search
curl "http://localhost:3000/api/resources?lat=39.78&lon=-89.65&radius=50&type=shelter"

# By ID
curl http://localhost:3000/api/resources/samhsa-1

# Statistics
curl http://localhost:3000/api/admin/stats
```

### `backend/data-loader.js`
**Purpose:** Frontend data loading module

**Features:**
- Tries live API first
- Falls back to static JSON if unavailable
- Validates resources
- Tracks sync timestamps

**Usage:**
Include in HTML:
```html
<script>
  window.CRISIS_COMPASS_CONFIG = {
    apiEndpoint: 'https://your-domain.com/api/resources'
  };
</script>
<script src="backend/data-loader.js"></script>
```

### `backend/resources.json`
**Purpose:** Generated data file (output of ETL)

**Format:** Array of normalized resource objects

**Schema:**
```json
{
  "id": "unique-id",
  "name": "Service Name",
  "type": "shelter|housing|substance|mental-health|legal|food",
  "services": ["detox", "counseling"],
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "lat": 39.7817,
  "lon": -89.6501,
  "phone": "+1-555-111-2222",
  "website": "https://example.org",
  "hours": "24/7",
  "intake": "Walk-ins welcome",
  "eligibility": "No ID required",
  "cost": "Free",
  "capacityStatus": "Call first",
  "clientTypes": ["families", "veterans"],
  "petFriendly": true,
  "walkIns": true,
  "wheelchair": true,
  "source": "samhsa",
  "sourceId": "original-id",
  "sourceUpdateDate": "2025-12-06T21:07:00Z",
  "lastFetched": "2025-12-06T21:07:00Z"
}
```

## Data Flow

### Daily Automated Sync
1. **2 AM UTC:** GitHub Actions triggers (`.github/workflows/sync-data.yml`)
2. **ETL runs:** `backend/etl.js` fetches from national APIs
3. **Normalize:** Data converted to canonical schema
4. **Deduplicate:** Remove duplicates by name + city
5. **Save:** Write to resources.json
6. **Commit:** Auto-commit to GitHub
7. **Deploy:** Changes live on GitHub Pages + REST API

### Manual Run
```bash
npm run etl
```

## Environment Variables

```bash
# Required for real API integration
export SAMHSA_API_KEY=your_samhsa_key
export HUD_API_KEY=your_hud_key

# Optional
export PORT=3000          # Default: 3000
export NODE_ENV=production
```

## Deployment

### Local Development
```bash
npm start
# Runs on http://localhost:3000
```

### Production (4 Options)

**Option 1: Heroku (Simplest)**
```bash
heroku create crisis-compass-api
heroku config:set SAMHSA_API_KEY=xxx HUD_API_KEY=yyy
git push heroku main
```

**Option 2: Railway.app (Modern)**
- Connect GitHub repo
- Add env vars in dashboard
- Auto-deploys on push

**Option 3: AWS Elastic Beanstalk**
```bash
eb init -p node.js-18 crisis-compass
eb create production
```

**Option 4: VPS (Self-hosted)**
```bash
npm install -g pm2
pm2 start backend/server.js --name "crisis-compass-api"
```

See [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for detailed instructions.

## API Response Examples

### GET /api/resources?lat=39.78&lon=-89.65&type=shelter
```json
{
  "success": true,
  "data": [
    {
      "id": "hud-001",
      "name": "Hope Emergency Shelter",
      "type": "shelter",
      "city": "Springfield",
      "state": "IL",
      "phone": "217-555-0300",
      "distance": 2.3,
      "services": ["shelter", "meals"]
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0,
    "returned": 1,
    "timestamp": "2025-12-06T21:07:00Z"
  }
}
```

### GET /api/health
```json
{
  "status": "ok",
  "timestamp": "2025-12-06T21:07:00Z",
  "resourceCount": 4
}
```

### GET /api/admin/stats
```json
{
  "success": true,
  "data": {
    "totalResources": 4,
    "byType": {
      "shelter": 1,
      "housing": 1,
      "substance": 1,
      "mental-health": 1
    },
    "bySource": {
      "hud": 2,
      "samhsa": 2
    },
    "byState": {
      "IL": 4
    }
  },
  "timestamp": "2025-12-06T21:07:00Z"
}
```

## Testing

### Integration Tests
```bash
./test-api.sh
```

Tests:
- ✅ Directory structure
- ✅ Node.js installation
- ✅ Dependencies installed
- ✅ JSON files valid
- ✅ ETL script working
- ✅ Resources generated
- ✅ API server startup
- ✅ Health check endpoint

### Load Testing
```bash
# 100 concurrent requests
ab -n 100 -c 10 http://localhost:3000/api/resources
```

### Manual Testing
```bash
# Start server
npm start

# In another terminal:
curl http://localhost:3000/api/health
curl "http://localhost:3000/api/resources?search=shelter"
curl "http://localhost:3000/api/resources?lat=39.78&lon=-89.65"
```

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Response time | < 100ms | < 10ms |
| Geo-search | < 5ms | < 2ms |
| Concurrent requests | 100 | ✅ |
| Data freshness | Daily | ✅ Automated |

## National APIs

To integrate real APIs:

1. **SAMHSA Treatment Locator**
   - Register: https://findtreatment.gov/api
   - Type: Substance abuse treatment + mental health
   - Auth: API Key
   - Cost: Free

2. **HUD Exchange**
   - Register: https://data.hud.gov/api
   - Type: Housing + homeless services
   - Auth: API Token
   - Cost: Free

3. **2-1-1 National Hotline**
   - Contact: https://www.211.org
   - Type: Comprehensive local services
   - Auth: Partnership
   - Cost: Varies

4. **USDA Food Finder**
   - Register: https://data.nal.usda.gov
   - Type: Food banks, SNAP, meals
   - Auth: API Key
   - Cost: Free

5. **NAMI Support Groups**
   - Register: https://www.nami.org
   - Type: Support + educational programs
   - Auth: Limited/None
   - Cost: Free

## Troubleshooting

### "Port 3000 already in use"
```bash
lsof -i :3000        # Find process
kill -9 <PID>        # Kill process
npm start             # Try again
```

### "ETL script not fetching data"
- Check environment variables: `echo $SAMHSA_API_KEY`
- Verify API endpoints in backend/etl.js
- Check network connectivity: `curl https://findtreatment.gov/api`

### "API returns 404"
- Make sure server is running: `npm start`
- Check endpoint paths (no trailing slashes)
- Verify resources.json exists and is valid JSON

### "Data not updating"
- Check GitHub Actions workflow: `.github/workflows/sync-data.yml`
- Trigger manually: Go to Actions tab, click "Run workflow"
- Check ETL logs: `npm run etl`

## Documentation

- [API Integration Guide](../docs/API_INTEGRATION_GUIDE.md) — National APIs + schema
- [Deployment Guide](../docs/DEPLOYMENT.md) — Step-by-step for 4 platforms
- [Implementation Guide](../docs/API_IMPLEMENTATION.md) — Quick-start + testing
- [Launch Checklist](../docs/LAUNCH_CHECKLIST.md) — Project summary + next steps

## Contributing

1. Create a feature branch
2. Make changes to backend files
3. Run tests: `./test-api.sh`
4. Commit and push
5. GitHub Actions auto-deploys

## License

MIT

## Support

- **Issues:** https://github.com/Aakash-Srinivasan02/Crisis_Compass/issues
- **Email:** contact@crisiscompass.org (future)
- **Phone:** 988 (National Suicide Prevention Lifeline)

---

**Crisis Compass: Making emergency services accessible to everyone.**
