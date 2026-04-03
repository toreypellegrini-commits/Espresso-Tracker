// ─── Dialed — My Shots ───
// My Shots page: filtering, sorting, rendering.
// Loads after router.js.

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

  let filtered = shots.filter(s => {
    const text = [s.roaster,s.roastName,s.origin,s.varietal,s.notes,s.grinderName].join(' ').toLowerCase();
    if (search && !text.includes(search)) return false;
    if (process && s.process !== process) return false;
    if (roast && s.roast !== roast) return false;
    if (minRating && (s.rating||0) < minRating) return false;
    if (grinder && s.grinderName !== grinder) return false;
    return true;
  });

  if (sortVal==='date-desc') filtered.sort((a,b)=>new Date(b.date)-new Date(a.date));
  else if (sortVal==='date-asc') filtered.sort((a,b)=>new Date(a.date)-new Date(b.date));
  else if (sortVal==='rating-desc') filtered.sort((a,b)=>(b.rating||0)-(a.rating||0));

  const el = document.getElementById('myshots-list');
  if (!filtered.length) { el.innerHTML='<div class="empty">No shots match these filters.</div>'; return; }

  el.innerHTML = filtered.map(s => {
    const chips = [s.origin,s.varietal,s.process,s.roast].filter(Boolean).map(c=>`<span class="chip">${c}</span>`).join('');
    return `<div class="shot-card">
      <div class="shot-card-header">
        <div>
          <div class="shot-date" style="font-family:var(--font-serif);font-size:15px;">${s.roastName ? s.roaster + ' · ' + s.roastName : s.roaster||'Unknown'}</div>
          <div class="shot-meta">${fmtDate(s.date)}${s.rating?' · '+starsHTML(s.rating):''}${s.grinderName?' · '+s.grinderName:''}</div>
        </div>
        <button class="delete-btn" onclick="deleteShot(${s.id})">✕</button>
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
        <div class="stat"><div class="stat-val">${s.temp?s.temp+'°C':'—'}</div><div class="stat-lbl">Temp</div></div>
        <div class="stat"><div class="stat-val">${s.preinfusion?s.preinfusion+'s':'—'}</div><div class="stat-lbl">Pre-inf</div></div>
        <div class="stat"><div class="stat-val">${s.daysOffRoast!=null?s.daysOffRoast+'d':'—'}</div><div class="stat-lbl">Off roast</div></div>
      </div>
      ${s.notes?`<div class="shot-note">${s.notes}</div>`:''}
    </div>`;
  }).join('');
}


