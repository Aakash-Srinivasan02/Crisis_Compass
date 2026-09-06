/* eslint-disable no-unused-vars */
/* global L */
let resourcesCache = null;
let mapLoaded = false;

async function loadResources(){
  if(resourcesCache) return resourcesCache;
  try{
    const res = await fetch('resources.json');
    resourcesCache = await res.json();
    return resourcesCache;
  }catch(e){
    console.error('Failed to load resources', e);
    return [];
  }
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
}

function matchText(item, q){
  if(!q) return true;
  q = q.toLowerCase();
  return [item.name, item.city, item.zip, (item.services||[]).join(' '), item.type].join(' ').toLowerCase().includes(q);
}

function passesRefinements(item){
  // client type
  const clients = Array.from(document.querySelectorAll('input[name="client"]:checked')).map(i=>i.value);
  if(clients.length){
    if(!item.clientTypes || !clients.some(c=> (item.clientTypes||[]).includes(c))) return false;
  }
  const reqs = Array.from(document.querySelectorAll('input[name="req"]:checked')).map(i=>i.value);
  if(reqs.length){
    if(reqs.includes('pet_friendly') && !item.petFriendly) return false;
    if(reqs.includes('walkins') && !item.walkIns) return false;
    if(reqs.includes('wheelchair') && !item.wheelchair) return false;
  }
  return true;
}

function readFavorites(){
  try {
    const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    return [];
  }
}

function saveFavorites(list){
  localStorage.setItem('favorites', JSON.stringify(list));
  window.__favorites = list;
}

function toggleFavorite(id){
  const favorites = readFavorites();
  const idx = favorites.indexOf(id);
  if(idx >= 0) {
    favorites.splice(idx, 1);
  } else {
    favorites.push(id);
  }
  saveFavorites(favorites);
  if(window.__showFavoritesOnly){
    doSearch(false);
  } else {
    renderResults((resourcesCache || []).filter(item => !window.__showFavoritesOnly || favorites.includes(item.id)));
  }
}

function toggleFavoriteView(){
  window.__showFavoritesOnly = !window.__showFavoritesOnly;
  localStorage.setItem('favoritesView', window.__showFavoritesOnly ? '1' : '0');
  doSearch(false);
}

function clearAllFilters(){
  document.getElementById('query').value = '';
  document.getElementById('filter').value = '';
  document.getElementById('stateFilter').value = '';
  document.querySelectorAll('input[name="client"]').forEach(input => input.checked = false);
  document.querySelectorAll('input[name="req"]').forEach(input => input.checked = false);
  doSearch(false);
}

function getCostClass(cost){
  if(!cost) return '';
  const text = String(cost).toLowerCase();
  if(text.includes('free')) return 'cost-free';
  if(text.includes('sliding') || text.includes('scale')) return 'cost-sliding';
  return 'cost-standard';
}

function getHoursClass(hours){
  if(!hours) return '';
  const text = String(hours).toLowerCase();
  if(text.includes('24') || text.includes('open')) return 'hours-24';
  if(text.includes('call') || text.includes('by appointment')) return 'hours-call';
  return 'hours-regular';
}

function getDirections(lat, lon, name){
  if(!lat || !lon) return;
  const destination = encodeURIComponent(String(name || 'Service provider'));
  const url = `https://maps.google.com/?q=${lat},${lon}&label=${destination}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function renderResults(list, paginationInfo = null){
  const container = document.getElementById('results');
  if(!container) return;
  console.log('renderResults called with', list.length, 'items');
  
  container.innerHTML = '';
  
  // Add search results summary
  const totalResults = paginationInfo?.total || list.length;
  const currentPage = paginationInfo?.currentPage || 1;
  const totalPages = paginationInfo?.totalPages || 1;
  
  const summary = document.createElement('div');
  summary.className = 'results-summary';
  summary.innerHTML = `
    <div class="summary-content">
      <h3 class="results-count">${totalResults} ${totalResults === 1 ? 'service' : 'services'} found</h3>
      ${paginationInfo ? `<div class="pagination-info">Page ${currentPage} of ${totalPages}</div>` : ''}
      <div class="view-controls">
        <button onclick="toggleFavoriteView()" class="small-btn ${window.__showFavoritesOnly ? 'active' : ''}" id="favoritesBtn">
          ${window.__showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites'}
        </button>
      </div>
    </div>
  `;
  container.appendChild(summary);
  
  if(list.length===0){
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.innerHTML = `
      <div class="no-results-content">
        <div class="no-results-icon">🔍</div>
        <h4>No services found</h4>
        <p>Try adjusting your search criteria:</p>
        <ul>
          <li>Use a different city or ZIP code</li>
          <li>Select "All services" instead of a specific type</li>
          <li>Clear some filters</li>
          <li>Try searching for broader terms</li>
        </ul>
        <button onclick="clearAllFilters()" class="cta">Clear All Filters</button>
      </div>
    `;
    container.appendChild(noResults);
    return;
  }
  
  // Add loading state for large result sets
  if(list.length > 20) {
    const loading = document.createElement('div');
    loading.className = 'loading-indicator';
    loading.innerHTML = '<div class="spinner"></div> Loading services...';
    container.appendChild(loading);
  }
  
  // Render each service card with enhanced information
  list.forEach((it, index) => {
    const el = document.createElement('div');
    el.className = 'card';
    
    // Enhanced distance calculation
    const distance = (window.__userLocation && it.lat && it.lon) ? 
      '<span class="distance-badge">' + distanceMiles(window.__userLocation.lat, window.__userLocation.lon, it.lat, it.lon).toFixed(1) + ' miles away</span>' : '';
    
    // Enhanced capacity status
    let capacityClass = '';
    if(it.capacityStatus) {
      const status = it.capacityStatus.toLowerCase();
      if(status.includes('limited') || status.includes('full')) {
        capacityClass = 'capacity-limited';
      } else if(status.includes('available') || status.includes('open')) {
        capacityClass = 'capacity-available';
      }
    }
    
    // Enhanced cost information
    const costBadge = it.cost ? `<span class="cost-badge ${getCostClass(it.cost)}">${escapeHtml(it.cost)}</span>` : '';
    
    // Operating hours indicator
    const hoursBadge = it.hours ? `<span class="hours-badge ${getHoursClass(it.hours)}">${escapeHtml(it.hours)}</span>` : '';
    
    // Favorites functionality
    const isFavorite = window.__favorites && window.__favorites.includes(it.id);
    const favoriteBtn = `<button class="favorite-btn ${isFavorite ? 'favorited' : ''}" onclick="toggleFavorite('${escapeHtml(it.id)}')" aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites">
      ${isFavorite ? '★' : '☆'}
    </button>`;
    
    el.innerHTML = `
      <div class="card-header">
        <h4>
          <a href="#" onclick="openDetail('${escapeHtml(it.id)}');return false;" class="service-name">${escapeHtml(it.name)}</a>
          ${it.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
        </h4>
        ${favoriteBtn}
      </div>
      <div class="meta">
        <span class="service-type">${escapeHtml(it.type)}</span>
        <span class="location">${escapeHtml(it.city)}${it.zip ? ', ' + escapeHtml(it.zip) : ''}</span>
        ${distance}
        ${capacityClass ? `<span class="capacity ${capacityClass}">${escapeHtml(it.capacityStatus)}</span>` : ''}
      </div>
      <div class="address">${escapeHtml(it.address || '')}</div>
      <div class="contact-info">
        ${it.phone ? `<div class="phone"><strong>Phone:</strong> <a href="tel:${escapeHtml(it.phone)}" class="phone-link">${escapeHtml(it.phone)}</a></div>` : ''}
        ${it.website ? `<div class="website"><a href="${escapeHtml(it.website)}" target="_blank" rel="noopener" class="website-link">Visit Website</a></div>` : ''}
      </div>
      <div class="service-details">
        ${costBadge}
        ${hoursBadge}
        ${it.intake ? `<div class="intake-info"><strong>Intake:</strong> ${escapeHtml(it.intake)}</div>` : ''}
        ${it.eligibility ? `<div class="eligibility-info"><strong>Eligibility:</strong> ${escapeHtml(it.eligibility)}</div>` : ''}
      </div>
      <div class="card-actions">
        <button onclick="openDetail('${escapeHtml(it.id)}')" class="small-btn">View Details</button>
        ${it.phone ? `<button onclick="window.location.href='tel:${escapeHtml(it.phone)}'" class="small-btn cta">Call Now</button>` : ''}
        ${it.lat && it.lon ? `<button onclick="getDirections(${it.lat}, ${it.lon}, '${escapeHtml(it.name)}')" class="small-btn">Directions</button>` : ''}
      </div>
    `;
    
    // Add fade-in animation
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    container.appendChild(el);
    
    setTimeout(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, index * 50);
  });
  
  // Add pagination if needed
  if(paginationInfo && totalPages > 1) {
    renderPagination(container, paginationInfo);
  }
}

async function doSearch(userTriggered){
  const q = document.getElementById('query').value.trim();
  const filter = document.getElementById('filter').value;
  const stateFilter = document.getElementById('stateFilter').value;
  const all = await loadResources();
  let results = all.filter(r=>matchText(r,q));
  if(filter) results = results.filter(r=>r.type===filter || (r.services||[]).includes(filter));
  if(stateFilter) results = results.filter(r=>r.state===stateFilter);
  results = results.filter(r=>passesRefinements(r));

  const zipLike = /^\d{3,5}$/.test(q);
  if(zipLike && !results.length){
    const zipPrefix = q.replace(/\D/g, '').slice(0, 3);
    const prefixMatches = all.filter(r => {
      const zipDigits = String(r.zip || '').replace(/\D/g, '');
      return zipDigits.startsWith(zipPrefix) || zipDigits.includes(q.replace(/\D/g, ''));
    });
    results = prefixMatches.filter(r => passesRefinements(r));
  }

  if(zipLike && !results.length){
    results = all.filter(r => passesRefinements(r)).slice(0, 12);
  }

  // if a geolocation search was performed, userLat/Lon may be set
  if(window.__userLocation){
    results = results.map(r=>{
      const d = distanceMiles(window.__userLocation.lat, window.__userLocation.lon, r.lat, r.lon);
      return {r:r, d:d};
    })
      .filter(x=>x.d===null || x.d<=50) // include all if no coords, or those within 50 miles
      .sort((a,b)=>{
        if(a.d===null) return 1; // resources without coords go to end
        if(b.d===null) return -1;
        return a.d-b.d;
      })
      .map(x=>x.r);
  }
  renderResults(results);
  if(userTriggered) document.getElementById('results').scrollIntoView({behavior:'smooth'});
}

function quickExit(){
  try{ window.location.replace('https://www.weather.com'); }catch(e){ window.location.href='https://www.weather.com'; }
}

function toggleLowBandwidth(){
  const on = document.body.classList.toggle('low-bandwidth');
  localStorage.setItem('lowBandwidth', on? '1':'0');
  if(on){
    alert('Low‑data mode on: maps and images will be disabled.');
  }
}

async function geolocateAndSearch(){
  if(!navigator.geolocation){ 
    alert('Geolocation not supported on this device. Please enter a city or ZIP code.');
    return;
  }
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<p class="hint">📍 Finding your location...</p>';
  
  navigator.geolocation.getCurrentPosition(async (pos)=>{
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    window.__userLocation = {lat, lon};
    console.log('✓ Location found:', lat.toFixed(4), lon.toFixed(4));
    
    // Don't clear search, just perform search with location filter
    const q = document.getElementById('query').value.trim();
    const filter = document.getElementById('filter').value;
    const all = await loadResources();
    console.log('✓ Loaded', all.length, 'resources');
    
    let results = all.filter(r=>matchText(r,q));
    console.log('✓ Text matched:', results.length, 'resources');
    
    if(filter) results = results.filter(r=>r.type===filter || (r.services||[]).includes(filter));
    console.log('✓ After type filter:', results.length, 'resources');
    
    results = results.filter(r=>passesRefinements(r));
    console.log('✓ After refinements:', results.length, 'resources');
    
    // Filter and sort by distance
    results = results.map(r=>{
      const d = distanceMiles(lat, lon, r.lat, r.lon);
      return {r:r, d:d};
    })
      .filter(x=>{
        const withinRange = x.d===null || x.d<=50;
        if(withinRange && x.d !== null){
          console.log('  📍', x.r.name, ':', x.d.toFixed(2), 'miles');
        }
        return withinRange;
      })
      .sort((a,b)=>{
        if(a.d===null) return 1;
        if(b.d===null) return -1;
        return a.d-b.d;
      })
      .map(x=>x.r);
    
    console.log('✓ After distance filter/sort:', results.length, 'resources');
    renderResults(results);
    resultsDiv.scrollIntoView({behavior:'smooth'});
    
  }, (err)=>{
    console.error('❌ Geolocation error:', err.code, err.message);
    let msg = '❌ Location access denied or unavailable. Please enter a city or ZIP code instead.';
    if(err.code === 1) msg = '❌ Permission denied. Enable location access in your browser settings.';
    if(err.code === 2) msg = '❌ Position unavailable. Try again or use city/ZIP search.';
    if(err.code === 3) msg = '❌ Request timeout. Your device took too long to find location.';
    resultsDiv.innerHTML = '<p class="hint">'+msg+'</p>';
  }, {timeout:8000, enableHighAccuracy:false});
}

function distanceMiles(lat1, lon1, lat2, lon2){
  if(!lat2 || !lon2) return null;
  const R = 3958.8; // miles
  const toRad = v=>v*Math.PI/180;
  const dLat = toRad(lat2-lat1);
  const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R*c;
}

function showMapView(){
  if(document.body.classList.contains('low-bandwidth')){ alert('Map disabled in low-data mode'); return; }
  document.getElementById('listViewBtn').classList.remove('active');
  document.getElementById('mapViewBtn').classList.add('active');
  // lazy load Leaflet if needed
  if(!mapLoaded){
    mapLoaded = true;
    const link = document.createElement('link');
    link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.9.3/dist/leaflet.css';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src='https://unpkg.com/leaflet@1.9.3/dist/leaflet.js';
    s.onload = setupMap;
    document.body.appendChild(s);
  }else{
    setupMap();
  }
}

async function setupMap(){
  const container = document.getElementById('results');
  container.innerHTML = '<div id="map" style="height:400px;border-radius:8px;overflow:hidden"></div>';
  
  // Determine map center: use user location if available, otherwise Springfield IL
  const center = window.__userLocation ? [window.__userLocation.lat, window.__userLocation.lon] : [39.78, -89.65];
  const zoomLevel = window.__userLocation ? 13 : 4;
  
  const map = L.map('map').setView(center, zoomLevel);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);
  
  const all = await loadResources();
  all.forEach(it=>{
    if(it.lat && it.lon){
      // Add distance to popup if user has location
      let popupText = '<strong>'+escapeHtml(it.name)+'</strong><br/>'+escapeHtml(it.city);
      if(window.__userLocation){
        const dist = distanceMiles(window.__userLocation.lat, window.__userLocation.lon, it.lat, it.lon);
        popupText += '<br/><em>'+dist.toFixed(1)+' miles away</em>';
      }
      if(it.phone) popupText += '<br/><a href="tel:'+escapeHtml(it.phone)+'">'+escapeHtml(it.phone)+'</a>';
      
      const marker = L.marker([it.lat,it.lon]).addTo(map);
      marker.bindPopup(popupText);
    }
  });
  
  // Add user location marker if available
  if(window.__userLocation){
    const userMarker = L.marker([window.__userLocation.lat, window.__userLocation.lon], {
      icon: L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjNDI4NWY0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).addTo(map);
    userMarker.bindPopup('📍 Your location');
  }
}

function showListView(){
  document.getElementById('mapViewBtn').classList.remove('active');
  document.getElementById('listViewBtn').classList.add('active');
  doSearch(false);
}

// Detail view and reporting
function openDetail(id){
  const all = resourcesCache || [];
  const item = all.find(r=>r.id===id);
  if(!item) return;
  const body = document.getElementById('detailBody');
  body.innerHTML = `
    <h2>${escapeHtml(item.name)} ${item.verified?'<span class="verified">Verified</span>':''}</h2>
    <div class="meta">${escapeHtml(item.type)} — ${escapeHtml(item.city)} ${item.zip? '• '+escapeHtml(item.zip):''}</div>
    <p>${escapeHtml(item.address||'')}</p>
    <p><strong>Phone:</strong> <a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone)}</a></p>
    ${item.website?'<p><a href="'+escapeHtml(item.website)+'" target="_blank" rel="noopener">Website</a></p>':''}
    <p><strong>Hours:</strong> ${escapeHtml(item.hours||'Call for hours')}</p>
    <p><strong>Intake:</strong> ${escapeHtml(item.intake||'Call ahead')}</p>
    <p><strong>Eligibility:</strong> ${escapeHtml(item.eligibility||'See provider')}</p>
    <p><strong>Cost:</strong> ${escapeHtml(item.cost||'Free or sliding scale')}</p>
    <p><strong>Capacity:</strong> ${escapeHtml(item.capacityStatus||'Call first')}</p>
  `;
  const reportArea = document.getElementById('reportArea');
  reportArea.innerHTML = `
    <h3>Report an issue (anonymous)</h3>
    <form onsubmit="submitReport(event,'${escapeHtml(id)}')">
      <label for="problem">What's wrong?</label>
      <select id="problem" required>
        <option value="phone">Wrong phone</option>
        <option value="closed">Closed</option>
        <option value="other">Other</option>
      </select>
      <div><textarea id="details" placeholder="Details (optional)" rows="3"></textarea></div>
      <div><button class="small-btn">Send report</button></div>
    </form>
  `;
  const modal = document.getElementById('detailModal');
  modal.setAttribute('aria-hidden','false');
}

function closeDetail(){
  const modal = document.getElementById('detailModal');
  modal.setAttribute('aria-hidden','true');
}

function submitReport(e,id){
  e.preventDefault();
  const problem = document.getElementById('problem').value;
  const details = document.getElementById('details').value;
  const reports = JSON.parse(localStorage.getItem('reports') || '[]');
  reports.push({id,problem,details,t: new Date().toISOString()});
  localStorage.setItem('reports', JSON.stringify(reports));
  alert('Thanks — report saved for review');
  closeDetail();
}

// Internationalization (i18n) support
async function loadTranslation(lang){
  if(!lang || lang==='auto') return null;
  try{
    const res = await fetch('i18n/' + lang + '.json');
    if(!res.ok) throw new Error('no translation');
    return await res.json();
  }catch(e){
    console.warn('Failed to load translation for '+lang, e);
    return null;
  }
}

function applyTranslations(trans){
  if(!trans) return;
  // text content
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(trans[key]) el.innerText = trans[key];
  });
  // placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    if(trans[key]) el.setAttribute('placeholder', trans[key]);
  });
  // labels for inputs
  document.querySelectorAll('[data-i18n-label]').forEach(el=>{
    const key = el.getAttribute('data-i18n-label');
    if(trans[key]){
      // label may be a parent <label> element or the input itself
      const parent = el.closest('label');
      if(parent) parent.childNodes.forEach(n=>{ if(n.nodeType===3) n.textContent = trans[key]; });
    }
  });
}

async function setLanguage(lang){
  if(lang==='auto'){
    const nav = navigator.language || navigator.userLanguage || 'en';
    lang = nav.split('-')[0];
  }
  localStorage.setItem('lang', lang);
  const trans = await loadTranslation(lang);
  if(trans) applyTranslations(trans);
  else if(lang!=='en'){
    const en = await loadTranslation('en');
    if(en) applyTranslations(en);
  }
}

// Single initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async ()=>{
  window.__favorites = readFavorites();
  window.__showFavoritesOnly = localStorage.getItem('favoritesView') === '1';

  // Set up search input
  const q = document.getElementById('query');
  q.addEventListener('keydown', async (e)=>{ if(e.key==='Enter'){ await doSearch(true); e.preventDefault(); } });

  // Load low-bandwidth preference
  if(localStorage.getItem('lowBandwidth')==='1') document.body.classList.add('low-bandwidth');

  // Initialize language
  const saved = localStorage.getItem('lang') || 'auto';
  const select = document.getElementById('langSelect');
  if(select) select.value = saved;
  await setLanguage(saved);

  // Load and display resources
  await loadResources();
  await doSearch(false);
});
