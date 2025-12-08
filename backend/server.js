/**
 * Crisis Compass API Server
 * 
 * Simple REST API serving normalized resource data
 * Can be deployed to Heroku, Railway, AWS, or self-hosted
 * 
 * Endpoints:
 * - GET /api/resources — All resources (with optional filters)
 * - GET /api/resources/:id — Single resource
 * - GET /api/health — Health check
 * 
 * Usage:
 *   npm install express cors
 *   node backend/server.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Load resources
let resources = [];

function loadResources() {
  try {
    const filePath = path.join(__dirname, '../resources.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    resources = JSON.parse(data);
    console.log(`✅ Loaded ${resources.length} resources`);
  } catch (error) {
    console.error('❌ Failed to load resources:', error.message);
    resources = [];
  }
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
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

// Routes
/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    resourceCount: resources.length
  });
});

/**
 * Get all resources with optional filters
 * Query params:
 *   - lat, lon: User coordinates (returns sorted by distance)
 *   - radius: Search radius in miles (default: 50)
 *   - type: Filter by type (shelter, housing, substance, mental-health, legal, food)
 *   - clientType: Filter by client type (families, women, men, youth, veterans, lgbtq)
 *   - search: Full-text search (name, city, services)
 *   - limit: Max results (default: 100)
 *   - offset: Pagination offset (default: 0)
 */
app.get('/api/resources', (req, res) => {
  try {
    const {
      lat,
      lon,
      radius = 50,
      type,
      clientType,
      search,
      limit = 100,
      offset = 0
    } = req.query;

    // Start with all resources
    let filtered = [...resources];

    // Type filter
    if (type) {
      filtered = filtered.filter(r => r.type === type);
    }

    // Client type filter
    if (clientType) {
      filtered = filtered.filter(
        r =>
          r.clientTypes &&
          r.clientTypes.includes(clientType)
      );
    }

    // Text search (name, city, services)
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.name.toLowerCase().includes(query) ||
          r.city.toLowerCase().includes(query) ||
          r.zip.includes(query) ||
          (r.services &&
            r.services.some(s => s.toLowerCase().includes(query)))
      );
    }

    // Distance-based sorting
    if (lat && lon) {
      const userLat = parseFloat(lat);
      const userLon = parseFloat(lon);

      filtered = filtered
        .map(r => ({
          ...r,
          distance:
            r.lat && r.lon
              ? calculateDistance(userLat, userLon, r.lat, r.lon)
              : null
        }))
        .filter(r => r.distance === null || r.distance <= radius)
        .sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
    }

    // Pagination
    const total = filtered.length;
    const paginated = filtered.slice(
      parseInt(offset) || 0,
      (parseInt(offset) || 0) + (parseInt(limit) || 100)
    );

    res.json({
      success: true,
      data: paginated,
      meta: {
        total,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0,
        returned: paginated.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get single resource by ID
 */
app.get('/api/resources/:id', (req, res) => {
  const resource = resources.find(r => r.id === req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      error: 'Resource not found'
    });
  }

  res.json({
    success: true,
    data: resource
  });
});

/**
 * Search endpoint (convenience wrapper)
 * POST /api/search
 * Body: { lat?, lon?, radius?, type?, clientType?, search?, limit?, offset? }
 */
app.post('/api/search', (req, res) => {
  const query = new URLSearchParams();

  if (req.body.lat) query.append('lat', req.body.lat);
  if (req.body.lon) query.append('lon', req.body.lon);
  if (req.body.radius) query.append('radius', req.body.radius);
  if (req.body.type) query.append('type', req.body.type);
  if (req.body.clientType) query.append('clientType', req.body.clientType);
  if (req.body.search) query.append('search', req.body.search);
  if (req.body.limit) query.append('limit', req.body.limit);
  if (req.body.offset) query.append('offset', req.body.offset);

  res.redirect(`/api/resources?${query}`);
});

/**
 * Admin endpoints (in production, add authentication)
 */

// Reload data from file
app.post('/api/admin/reload', (req, res) => {
  console.log('🔄 Reloading resources...');
  loadResources();
  res.json({
    success: true,
    message: `Loaded ${resources.length} resources`
  });
});

// Get server stats
app.get('/api/admin/stats', (req, res) => {
  const stats = {
    totalResources: resources.length,
    byType: {},
    bySource: {},
    byState: {}
  };

  resources.forEach(r => {
    stats.byType[r.type] = (stats.byType[r.type] || 0) + 1;
    stats.bySource[r.source] = (stats.bySource[r.source] || 0) + 1;
    stats.byState[r.state] = (stats.byState[r.state] || 0) + 1;
  });

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
if (require.main === module) {
  loadResources();

  app.listen(PORT, () => {
    console.log(`\n🚀 Crisis Compass API running on port ${PORT}`);
    console.log(`\n📍 Available endpoints:`);
    console.log(`   GET  /api/health`);
    console.log(`   GET  /api/resources?lat=X&lon=Y&radius=50&type=shelter`);
    console.log(`   GET  /api/resources/:id`);
    console.log(`   POST /api/search`);
    console.log(`   POST /api/admin/reload`);
    console.log(`   GET  /api/admin/stats`);
    console.log(`\n💾 Resources loaded: ${resources.length}`);
  });
}

module.exports = app;
