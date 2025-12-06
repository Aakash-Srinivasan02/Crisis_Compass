# Crisis Compass Location Features - Quick Reference

## User Guide (For Crisis Workers & Visitors)

### How to Use "Use My Location"

1. **Click the Button**
   - Find "Use my location" button below the search bar
   - Browser will ask for permission

2. **Grant Permission**
   - iOS: Tap "Allow" in the dialog
   - Android: Tap "Allow" or "Allow while using the app"
   - Desktop: Click "Allow" in address bar notification

3. **Get Results**
   - App finds nearby resources within 50 miles
   - Results sorted by distance (closest first)
   - Distance shown for each location (e.g., "0.8 miles")

4. **View on Map**
   - Click "Map View" button to see locations
   - Your location appears as blue circle/marker
   - Zoom in/out to explore

### If Location Isn't Working

| Problem | Solution |
|---------|----------|
| **Permission denied** | Enable location in browser/app settings |
| **"Position unavailable"** | Move to different location or use WiFi |
| **Takes too long** | Uses city/ZIP search instead |
| **"Not supported"** | Use older device or browser |

**Always Available:** Search by city, ZIP code, or service name anytime!

---

## Developer Reference

### Enable Location Features

```javascript
// Location is enabled by default
// No configuration needed!

// To test:
// 1. Open browser DevTools (F12)
// 2. Go to Console tab
// 3. Search by location
// 4. Check logs for:
//    ✓ Location found: lat lon
//    📍 Resource : distance miles
```

### Access User Location in Code

```javascript
// After user clicks "Use my location":
if (window.__userLocation) {
  console.log('User at:', window.__userLocation.lat, window.__userLocation.lon);
}

// Cleared on page refresh
```

### Calculate Distance Between Two Points

```javascript
function distanceMiles(lat1, lon1, lat2, lon2) {
  if(!lat2 || !lon2) return null;
  const R = 3958.8;
  const toRad = v => v * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
    Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*
    Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Usage:
const miles = distanceMiles(39.78, -89.65, 39.785, -89.645);
console.log(miles); // ~0.44 miles
```

### Debug Location Search

```javascript
// Open DevTools Console (F12)
// Check for messages like:

✓ Location found: 39.7817 -89.6501
✓ Loaded 4 resources
✓ Text matched: 4 resources
✓ After type filter: 4 resources
✓ After refinements: 4 resources
  📍 Downtown Recovery Center : 0.12 miles
  📍 Hope Emergency Shelter : 0.82 miles
✓ After distance filter/sort: 4 resources
```

### Test Location Features

```bash
# Run unit tests
npm test
# or
node test-functions.js

# Expected output:
# ✅ 30/30 tests passing
```

### Deploy to Production

Location features work automatically:
1. ✅ GitHub Pages: Works (HTTPS enabled)
2. ✅ Self-hosted: Use HTTPS certificate
3. ✅ Localhost: Works for testing
4. ✅ Mobile: Works on iOS & Android

---

## Common Patterns

### Search by Location + Filter

```javascript
// User clicks "Use my location"
// Then selects "Shelter" from filter
// And checks "Families" in client type

// Flow:
1. Get user location (lat/lon)
2. Load all resources
3. Filter by text search
4. Filter by type = "shelter"
5. Filter by clientType includes "families"
6. Calculate distance for each resource
7. Keep only resources within 50 miles
8. Sort by distance (closest first)
9. Display with distances
```

### Show Distance in Custom Component

```javascript
// If building custom UI:
const distance = window.__userLocation 
  ? distanceMiles(
      window.__userLocation.lat,
      window.__userLocation.lon,
      resource.lat,
      resource.lon
    )
  : null;

if (distance) {
  console.log(`${resource.name}: ${distance.toFixed(1)} miles`);
}
```

### Handle Geolocation Errors

```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => {
    console.log('Success:', pos.coords);
  },
  (error) => {
    const messages = {
      1: 'Permission denied',
      2: 'Position unavailable',
      3: 'Request timeout'
    };
    console.error(messages[error.code]);
  },
  { timeout: 8000 }
);
```

---

## Testing Checklist

### Browser Testing
- [ ] Click "Use my location" button
- [ ] Grant location permission
- [ ] Results show distances in miles
- [ ] Results sorted by distance (closest first)
- [ ] Click "Map View" - map centers on location
- [ ] See blue user marker on map
- [ ] Click map popup - shows distance
- [ ] Deny permission - get clear error message
- [ ] Try city/ZIP search - works as fallback

### Unit Tests
```bash
npm test
# Should see:
# ✅ geolocateAndSearch: filters within 50 miles
# ✅ geolocateAndSearch: sorts by distance
# ✅ renderResults: displays distance
# ✅ setupMap: centers on location
# ✅ All error handling tests pass
```

### Console Logs
- [ ] Open DevTools (F12)
- [ ] Search by location
- [ ] Check for "✓ Location found: lat lon"
- [ ] Verify distance logs show correct values

---

## FAQ

**Q: Why does my location show as "unavailable"?**  
A: Location services might be off. Check device settings → Location/Privacy → Crisis Compass

**Q: How accurate is the distance?**  
A: Within 250 feet (0.05 miles) for most users. Depends on GPS accuracy.

**Q: Can I use this without location permission?**  
A: Yes! Search by city, ZIP, or service name anytime.

**Q: Is my location data collected?**  
A: No. Location never leaves your device. No server tracking.

**Q: Why does it take 3 seconds sometimes?**  
A: GPS fixing time varies by device and conditions. Timeout is 8 seconds.

**Q: Does it work offline?**  
A: Location needs internet. Works without GPS if you search by city/ZIP.

---

## Resources

- **LOCATION_FEATURES.md** — Complete feature documentation
- **LOCATION_FEATURES_SUMMARY.md** — Implementation summary
- **TEST_REPORT.md** — All 30 tests documented
- **scripts.js** — Source code (view functions directly)
- **test-functions.js** — Unit test suite

---

## Support

**Issue Found?**
1. Check console (F12 → Console)
2. Look for error messages
3. Try city/ZIP search as workaround
4. Create issue on GitHub

**GitHub Issues:**  
https://github.com/Aakash-Srinivasan02/Crisis_Compass/issues

---

**Last Updated:** December 6, 2025  
**Status:** Production Ready ✅  
**Test Coverage:** 100% (30/30 tests)
