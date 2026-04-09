// ─── Dialed — Roasts ───
// Roast library rendering, roast detail, roast modal CRUD.
// Loads after router.js.

// ─── REFERENCE RECIPE HELPERS ───
// Each roast stores a single referenceShotId pointing to a shot in the shots array.
// Helpers below read/write that pointer and handle persistence + toast notifications.

function getReferenceShot(roastId) {
  const r = roastLib.find(x => x.id == roastId);
  if (!r || !r.referenceShotId) return null;
  return shots.find(s => s.id == r.referenceShotId) || null;
}

async function setReferenceShot(shotId) {
  const shot = shots.find(s => s.id == shotId);
  if (!shot || !shot.roastLibId) return;
  const roast = roastLib.find(r => r.id == shot.roastLibId);
  if (!roast) return;

  const hadPrevious = !!roast.referenceShotId;
  roast.referenceShotId = shot.id;

  try {
    await dbUpdate('roast_library', roast._db_id, roast);
    setDbStatus('ok', 'Saved');
    showSimpleToast(hadPrevious ? '⭐ Reference recipe updated' : '⭐ Reference recipe saved');
    // Re-render the relevant views so the star state updates
    if (currentPage === 'roast-detail') renderRoastShots();
    if (currentPage === 'myshots' && typeof renderMyShots === 'function') renderMyShots();
    if (currentPage === 'home' && typeof renderOpenBags === 'function') renderOpenBags();
  } catch (e) {
    setDbStatus('error', 'Save failed');
  }
}

async function clearReferenceShot(roastId, silent) {
  const roast = roastLib.find(r => r.id == roastId);
  if (!roast || !roast.referenceShotId) return;
  roast.referenceShotId = null;
  try {
    await dbUpdate('roast_library', roast._db_id, roast);
    setDbStatus('ok', 'Saved');
    if (!silent) showSimpleToast('☆ Reference recipe cleared');
    if (currentPage === 'roast-detail') renderRoastShots();
    if (currentPage === 'myshots' && typeof renderMyShots === 'function') renderMyShots();
    if (currentPage === 'home' && typeof renderOpenBags === 'function') renderOpenBags();
  } catch (e) {
    setDbStatus('error', 'Save failed');
  }
}

// Toggle a shot as reference (clicked on the star icon)
function toggleReferenceShot(shotId) {
  const shot = shots.find(s => s.id == shotId);
  if (!shot || !shot.roastLibId) return;
  const roast = roastLib.find(r => r.id == shot.roastLibId);
  if (!roast) return;
  if (roast.referenceShotId == shotId) {
    // Clicking star on current reference clears it
    clearReferenceShot(roast.id);
  } else {
    setReferenceShot(shotId);
  }
}

// Simple non-blocking toast for reference recipe actions.
// Uses an inline DOM element inserted into body, auto-dismisses after 2s.
let _simpleToastTimeout = null;
function showSimpleToast(message) {
  let el = document.getElementById('simple-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'simple-toast';
    el.className = 'simple-toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  if (_simpleToastTimeout) clearTimeout(_simpleToastTimeout);
  _simpleToastTimeout = setTimeout(() => {
    el.classList.remove('show');
  }, 2000);
}

// Format a shot as a compact recipe line: "18g → 42g · 29s · grind 36"
function formatRecipeLine(shot) {
  if (!shot) return '';
  const parts = [];
  if (shot.dose && shot.yield) parts.push(`${shot.dose}g → ${shot.yield}g`);
  else if (shot.dose) parts.push(`${shot.dose}g in`);
  else if (shot.yield) parts.push(`${shot.yield}g out`);
  if (shot.time) parts.push(`${shot.time}s`);
  if (shot.grind) parts.push(`grind ${shot.grind}`);
  return parts.join(' · ');
}

// ─── LIBRARY ───

function renderLibCard(r){
  const refDate=r.finished&&r.finishedDate?r.finishedDate:null;
  const days=calcDaysOffRoast(r.roastDate,refDate);
  let dc='';
  if(days!==null&&!r.finished){const cls=days<7?'days-fresh':days<=21?'days-peak':'days-old';const lbl=days<7?'resting':days<=21?'peak':'past peak';dc=`<span class="days-badge ${cls}">${days}d \u00b7 ${lbl}</span>`;}
  else if(days!==null&&r.finished){dc=`<span class="chip finished-chip">finished at ${days}d</span>`;}
  const heading=r.roastName?r.roaster+' \u00b7 '+r.roastName:r.roaster;
  const img=r.photo?`<img src="${r.photo}">`:`<span class="lib-card-placeholder">\u2615</span>`;
  const dialedStamp=r.dialed?'<span class="dialed-stamp"><img src="data:image/png;base64,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" alt="Dialed"></span>':'';
  const finBtn=r.finished
    ?`<button class="lib-card-fin-btn" onclick="event.stopPropagation();toggleFinished(${r.id})">\u21a9 Reopen</button>`
    :`<button class="lib-card-fin-btn" onclick="event.stopPropagation();toggleFinished(${r.id})">\u2713 Finish</button>`;
  return`<div class="lib-card-compact" onclick="navTo('roast-detail',{roastId:${r.id}})">
    <div class="lib-card-compact-img">${img}</div>
    <div class="lib-card-compact-body">
      <div class="lib-card-compact-name">${r.roastName||r.roaster}</div>
      ${r.roastName?`<div class="lib-card-compact-roaster">${r.roaster}</div>`:''}
      <div class="lib-card-compact-meta">${dc}</div>
    </div>
    <div class="lib-card-compact-right">
      ${dialedStamp}
      ${finBtn}
    </div>
  </div>`;
}

function renderLibrary(){
  const active=roastLib.filter(r=>!r.finished),finished=roastLib.filter(r=>r.finished);
  const el=document.getElementById('library-list');
  if(!active.length&&!finished.length){el.innerHTML='<div class="empty">No roasts yet.<br>Add your first bag above.</div>';}
  else{el.innerHTML=active.map(renderLibCard).join('');}
  const fel=document.getElementById('finished-section');
  if(!finished.length){fel.innerHTML='';return;}
  fel.innerHTML=`<div class="finished-section-header" onclick="finishedExpanded=!finishedExpanded;renderLibrary();"><span class="finished-section-title">Finished bags (${finished.length})</span><span style="font-size:13px;color:var(--muted);">${finishedExpanded?'▲':'▼'}</span></div>${finishedExpanded?finished.map(renderLibCard).join(''):''}`;
}


// ─── ROAST DETAIL ───
function renderRoastDetail(){
  // Safety net: recompute achievements when viewing roast detail (catches anything missed elsewhere)
  if(typeof computeAchievements==='function')computeAchievements();
  const r=roastLib.find(x=>x.id==currentDetailRoastId);
  if(!r){navTo('library');return;}
  document.getElementById('header-title').textContent='Roast Details';
  document.getElementById('header-subtitle').style.display='block';
  document.getElementById('header-subtitle').textContent=r.roastName||r.roaster;
  const chips=[r.origin,r.varietal,r.process,r.roast].filter(Boolean).map(c=>`<span class="chip">${c}</span>`).join('');
  const sc=shots.filter(s=>s.roastLibId==r.id).length;
  const days=calcDaysOffRoast(r.roastDate,r.finished&&r.finishedDate?r.finishedDate:null);
  let dc='';
  if(days!==null&&!r.finished){const cls=days<7?'days-fresh':days<=21?'days-peak':'days-old';const lbl=days<7?'resting':days<=21?'peak':'past peak';dc=`<span class="days-badge ${cls}">${days}d · ${lbl}</span>`;}
  else if(days!==null&&r.finished)dc=`<span class="chip finished-chip">finished at ${days}d</span>`;
  const dialedChip=r.dialed?'<span class="dialed-stamp"><img src="data:image/png;base64,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" alt="Dialed"></span>':'';
  const shotCountChip=sc?`<span class="chip">${sc} shot${sc>1?'s':''}</span>`:'';
  const img=r.photo?`<img src="${r.photo}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--border);float:left;margin-right:12px;">`:'';
  document.getElementById('roast-detail-header').innerHTML=`
    <div style="display:flex;align-items:flex-start;gap:12px;max-width:680px;margin:0 auto;padding:0 1rem;">
      ${r.photo?`<img src="${r.photo}" style="width:64px;height:64px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--border);flex-shrink:0;">`:``}
      <div style="flex:1;min-width:0;">
        <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;letter-spacing:-0.01em;">${r.roastName||r.roaster}</div>
        ${r.roastName?`<div style="font-size:13px;color:var(--muted);margin-top:2px;">${r.roaster}</div>`:''}
        <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:5px;">${chips}${dc}${dialedChip}${shotCountChip}</div>
        ${r.roastDate?`<div style="font-size:12px;color:var(--muted);margin-top:5px;">Roasted ${fmtDate(r.roastDate+'T12:00:00')}</div>`:''}
        ${r.desc?`<div style="font-size:12px;color:var(--muted);margin-top:3px;font-style:italic;">${r.desc}</div>`:''}
      </div>
      <button class="icon-btn" onclick="openEditRoast(${r.id})" title="Edit roast" style="flex-shrink:0;">✏</button>
    </div>`;
  renderRoastShots();
}

function renderRoastShots(){
  const sortVal=document.getElementById('shot-sort').value;
  let roastShots=shots.filter(s=>s.roastLibId==currentDetailRoastId);
  if(sortVal==='date-desc')roastShots.sort((a,b)=>new Date(b.date)-new Date(a.date));
  else if(sortVal==='date-asc')roastShots.sort((a,b)=>new Date(a.date)-new Date(b.date));
  else if(sortVal==='rating-desc')roastShots.sort((a,b)=>(b.rating||0)-(a.rating||0));
  const el=document.getElementById('roast-shots-list');
  if(!roastShots.length){el.innerHTML='<div class="empty">No shots logged for this roast yet.<br>Tap "+ Log Shot" to add your first.</div>';return;}
  const roast=roastLib.find(x=>x.id==currentDetailRoastId);
  const refId=roast?roast.referenceShotId:null;
  el.innerHTML=roastShots.map(s=>{
    const isRef=refId==s.id;
    return `<div class="shot-card">
    <div class="shot-card-header">
      <div>
        <div class="shot-date">${fmtDate(s.date)}${s.daysOffRoast!=null?' · '+s.daysOffRoast+'d off roast':''}</div>
        <div class="shot-meta">${s.rating?starsHTML(s.rating):'Not rated'}${s.grinderName?' · '+s.grinderName:''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <button class="ref-star-btn ${isRef?'active':''}" onclick="toggleReferenceShot(${s.id})" title="${isRef?'Reference recipe':'Set as reference recipe'}">${isRef?'⭐':'☆'}</button>
        <button class="delete-btn" onclick="if(confirm('Delete this shot? This cannot be undone.'))deleteShot(${s.id})">✕</button>
      </div>
    </div>
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


// ─── ROAST MODAL ───
function previewPhoto(){const file=document.getElementById('m-photo').files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{const img=document.getElementById('m-photo-preview');img.src=e.target.result;img.style.display='block';};reader.readAsDataURL(file);}

function openModal(type){document.getElementById('modal-'+type).classList.remove('modal-hidden');if(type==='roast'){editingRoastId=null;document.getElementById('modal-roast-title').textContent='Add roast';document.getElementById('modal-roast-save').textContent='Save roast';['m-roaster','m-roastname','m-origin','m-varietal','m-desc','m-roastdate'].forEach(id=>setField(id,''));document.getElementById('m-process').value='';document.getElementById('m-roast-level').value='';document.getElementById('m-photo-preview').style.display='none';document.getElementById('modal-roast-msg').textContent='';document.getElementById('modal-roast-extra').style.display='none';}if(type==='grinder'){editingGrinderId=null;document.getElementById('modal-grinder-title').textContent='Add grinder';populateGrinderModal('');setField('mg-notes','');document.getElementById('modal-grinder-msg').textContent='';document.getElementById('mg-name-other-wrap').style.display='none';setField('mg-name-other','');}}
function closeModal(type){document.getElementById('modal-'+type).classList.add('modal-hidden');}

function openEditRoast(id){
  const r=roastLib.find(x=>x.id==id);if(!r)return;
  editingRoastId=id;
  document.getElementById('modal-roast-title').textContent='Edit roast';document.getElementById('modal-roast-save').textContent='Update';
  setField('m-roaster',r.roaster);setField('m-roastname',r.roastName||'');setField('m-origin',r.origin);setField('m-varietal',r.varietal||'');setField('m-desc',r.desc||'');setField('m-roastdate',r.roastDate||'');
  document.getElementById('m-process').value=r.process||'';document.getElementById('m-roast-level').value=r.roast||'';
  const img=document.getElementById('m-photo-preview');if(r.photo){img.src=r.photo;img.style.display='block';}else{img.style.display='none';}
  document.getElementById('modal-roast-msg').textContent='';
  document.getElementById('modal-roast-extra').style.display='block';
  const finBtn=document.getElementById('modal-finish-btn');finBtn.textContent=r.finished?'↩ Mark active':'✓ Mark finished';
  const dialBtn=document.getElementById('modal-dialed-btn');if(dialBtn)dialBtn.textContent=r.dialed?'Remove Dialed':'Mark as Dialed';
  document.getElementById('modal-roast').classList.remove('modal-hidden');
}

function toggleFinished(id){const r=roastLib.find(x=>x.id==id);if(!r)return;r.finished=!r.finished;r.finishedDate=r.finished?todayStr():null;dbUpdate('roast_library',r._db_id,r).then(()=>{setDbStatus('ok','Saved');renderLibrary();populateRoastDropdown();}).catch(()=>setDbStatus('error','Error'));}
function modalToggleFinished(){const r=roastLib.find(x=>x.id==editingRoastId);if(!r)return;r.finished=!r.finished;r.finishedDate=r.finished?todayStr():null;dbUpdate('roast_library',r._db_id,r).then(()=>{setDbStatus('ok','Saved');document.getElementById('modal-finish-btn').textContent=r.finished?'↩ Mark active':'✓ Mark finished';renderLibrary();populateRoastDropdown();}).catch(()=>setDbStatus('error','Error'));}

function modalDeleteRoast(){if(!editingRoastId)return;const r=roastLib.find(x=>x.id==editingRoastId);if(!r)return;dbDelete('roast_library',r._db_id).then(()=>{roastLib=roastLib.filter(x=>x.id!==editingRoastId);closeModal('roast');renderLibrary();populateRoastDropdown();setDbStatus('ok','Saved');if(currentPage==='roast-detail')navTo('library');}).catch(()=>setDbStatus('error','Error'));}

async function saveRoastEntry(){const roaster=g('m-roaster'),roastName=g('m-roastname');if(!roaster||!roastName){flash('modal-roast-msg','Roaster and roast name are required','danger');return;}const photo=document.getElementById('m-photo-preview').style.display!=='none'?document.getElementById('m-photo-preview').src:null;const entry={roaster,roastName,origin:g('m-origin'),varietal:g('m-varietal'),process:g('m-process'),roast:g('m-roast-level'),roastDate:g('m-roastdate'),desc:g('m-desc'),photo};try{setDbStatus('saving','Saving…');if(editingRoastId){const r=roastLib.find(x=>x.id==editingRoastId);if(r){Object.assign(r,entry);await dbUpdate('roast_library',r._db_id,r);}}else{const ne={id:Date.now(),...entry,finished:false,finishedDate:null};const row=await dbInsert('roast_library',ne);ne._db_id=row.id;roastLib.unshift(ne);}setDbStatus('ok','Saved');renderLibrary();populateRoastDropdown();closeModal('roast');if(currentPage==='roast-detail')renderRoastDetail();if(typeof renderOnboarding==='function')renderOnboarding();if(typeof renderOpenBags==='function'&&currentPage==='home')renderOpenBags();}catch(e){setDbStatus('error','Save failed');flash('modal-roast-msg','Error saving — try again','danger');}}


