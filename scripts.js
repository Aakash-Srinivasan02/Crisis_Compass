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
  return String(str).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
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

function renderResults(list){
  const container = document.getElementById('results');
  if(!container) return;
  console.log('renderResults called with', list.length, 'items');
  container.innerHTML = '';
  if(list.length===0){
    container.innerHTML = '<p class="hint">No matches found. Try another city, ZIP, or service.</p>';
    return;
  }
  list.forEach(it=>{
    const el = document.createElement('div');
    el.className = 'card';
    const distance = (window.__userLocation && it.lat && it.lon) ? 
      ' • <strong>'+distanceMiles(window.__userLocation.lat, window.__userLocation.lon, it.lat, it.lon).toFixed(1)+' miles</strong>' : '';
    el.innerHTML = `<h4><a href="#" onclick="openDetail('${escapeHtml(it.id)}');return false;">${escapeHtml(it.name)}</a>${it.verified?'<span class="verified">Verified</span>':''}</h4>
      <div class="meta">${escapeHtml(it.type)} — ${escapeHtml(it.city)} ${it.zip ? '• '+escapeHtml(it.zip):''}${distance}${it.capacityStatus?'<span class="capacity">'+escapeHtml(it.capacityStatus)+'</span>':''}</div>
      <div>${escapeHtml(it.address || '')}</div>
      <div>${it.phone?'<strong>Phone:</strong> <a href="tel:'+escapeHtml(it.phone)+'">'+escapeHtml(it.phone)+'</a>':''}</div>
      ${it.website?'<div><a href="'+escapeHtml(it.website)+'" target="_blank" rel="noopener">Website</a></div>':''}
    `;
    container.appendChild(el);
  })
}

function doSearch(userTriggered){
  const q = document.getElementById('query').value.trim();
  const filter = document.getElementById('filter').value;
  const stateFilter = document.getElementById('stateFilter').value;
  const all = await loadResources();
  let results = all.filter(r=>matchText(r,q));
  if(filter) results = results.filter(r=>r.type===filter || (r.services||[]).includes(filter));
  if(stateFilter) results = results.filter(r=>r.state===stateFilter);
  results = results.filter(r=>passesRefinements(r));
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
  const reports = JSON.parse(localStorage.getItem('reports||[]')||'[]');
  reports.push({id,problem,details,t: new Date().toISOString()});
  localStorage.setItem('reports||[]', JSON.stringify(reports));
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
  // Set up search input
  const q = document.getElementById('query');
  q.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ doSearch(true); e.preventDefault(); } });
  
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
