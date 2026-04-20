// ─── Dialed — My Shots ───
// My Shots page: filtering, sorting, progressive rendering.
// Loads after router.js.

const MY_SHOTS_PAGE_SIZE = 10;
let _myShotsFiltered = [];  // cached filtered+sorted result
let _myShotsShown = 0;      // how many currently rendered

// ─── MY SHOTS PAGE ───
function populateMyShotsGrinderFilter() {
  const sel = document.getElementById('ms-grinder');
  const prev = sel.value;
  sel.innerHTML = '<option value="">All grinders</option>' + [...new Set(shots.map(s=>s.grinderName).filter(Boolean))].sort().map(g=>`<option value="${g}">${g}</option>`).join('');
  if (prev) sel.value = prev;
}

function renderMyShots() {
  const search = document.getElementById('ms-search').value.toLowerCase();
  const process = document.getElementById('ms-process').value;
  const roast = document.getElementById('ms-roast').value;
  const minRating = +document.getElementById('ms-rating').value||0;
  const grinder = document.getElementById('ms-grinder').value;
  const sortVal = document.getElementById('ms-sort').value;

  _myShotsFiltered = shots.filter(s => {
    const text = [s.roaster,s.roastName,s.origin,s.varietal,s.notes,s.grinderName].join(' ').toLowerCase();
    if (search && !text.includes(search)) return false;
    if (process && s.process !== process) return false;
    if (roast && s.roast !== roast) return false;
    if (minRating && (s.rating||0) < minRating) return false;
    if (grinder && s.grinderName !== grinder) return false;
    return true;
  });

  if (sortVal==='date-desc') _myShotsFiltered.sort((a,b)=>new Date(b.date)-new Date(a.date));
  else if (sortVal==='date-asc') _myShotsFiltered.sort((a,b)=>new Date(a.date)-new Date(b.date));
  else if (sortVal==='rating-desc') _myShotsFiltered.sort((a,b)=>(b.rating||0)-(a.rating||0));

  const el = document.getElementById('myshots-list');
  if (!_myShotsFiltered.length) { el.innerHTML='<div class="empty">No shots match these filters.</div>'; return; }

  // Reset and render first page
  _myShotsShown = 0;
  el.innerHTML = '';
  _renderMoreMyShots();
}

function _renderMoreMyShots() {
  const el = document.getElementById('myshots-list');
  const end = Math.min(_myShotsShown + MY_SHOTS_PAGE_SIZE, _myShotsFiltered.length);
  const batch = _myShotsFiltered.slice(_myShotsShown, end);

  // Remove existing load-more button if present
  const oldBtn = document.getElementById('myshots-load-more');
  if (oldBtn) oldBtn.remove();

  const html = batch.map(s => {
    const chips = [s.origin,s.varietal,s.process,s.roast].filter(Boolean).map(c=>`<span class="chip">${c}</span>`).join('');
    const roast = s.roastLibId ? roastLib.find(r => r.id == s.roastLibId) : null;
    const isRef = roast && roast.referenceShotId == s.id;
    const canBeRef = !!s.roastLibId;
    return `<div class="shot-card">
      <div class="shot-card-header">
        <div>
          <div class="shot-date" style="font-family:var(--font-serif);font-size:15px;">${s.roastName ? s.roaster + ' · ' + s.roastName : s.roaster||'Unknown'}</div>
          <div class="shot-meta">${fmtDate(s.date)}${s.rating?' · '+starsHTML(s.rating):''}${s.grinderName?' · '+s.grinderName:''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;">
          ${canBeRef ? `<button class="ref-star-btn ${isRef?'active':''}" onclick="toggleReferenceShot(${s.id})" title="${isRef?'Reference recipe':'Set as reference recipe'}">${isRef?'⭐':'☆'}</button>` : ''}
          <button class="delete-btn" onclick="if(confirm('Delete this shot? This cannot be undone.'))deleteShot(${s.id})">✕</button>
        </div>
      </div>
      ${chips?`<div class="shot-chips">${chips}</div>`:''}
      <div class="shot-stats">
        <div class="stat"><div class="stat-val">${s.dose||'—'}g</div><div class="stat-lbl">Dose</div></div>
        <div class="stat"><div class="stat-val">${s.yield||'—'}g</div><div class="stat-lbl">Yield</div></div>
        <div class="stat"><div class="stat-val">${s.ratio?'1:'+s.ratio:'—'}</div><div class="stat-lbl">Ratio</div></div>
        <div class="stat"><div class="stat-val">${s.time?s.time+'s':'—'}</div><div class="stat-lbl">Time</div></div>
      </div>
      <div class="shot-stats" style="margin-top:6px;">
        <div class="stat"><div class="stat-val">${s.grind||'—'}</div><div class="stat-lbl">Grind</div></div>
        <div class="stat"><div class="stat-val">${s.temp?fmtTemp(s.temp):'—'}</div><div class="stat-lbl">Temp</div></div>
        <div class="stat"><div class="stat-val">${s.preinfusion?s.preinfusion+'s':'—'}</div><div class="stat-lbl">Pre-inf</div></div>
        <div class="stat"><div class="stat-val">${s.daysOffRoast!=null?s.daysOffRoast+'d':'—'}</div><div class="stat-lbl">Off roast</div></div>
      </div>
      ${s.notes?`<div class="shot-note">${s.notes}</div>`:''}
    </div>`;
  }).join('');

  el.insertAdjacentHTML('beforeend', html);
  _myShotsShown = end;

  // Add load-more button if there are more results
  if (_myShotsShown < _myShotsFiltered.length) {
    const remaining = _myShotsFiltered.length - _myShotsShown;
    el.insertAdjacentHTML('beforeend',
      `<button id="myshots-load-more" class="load-more-btn" onclick="_renderMoreMyShots()">Show more (${remaining} remaining)</button>`
    );
  }
}
