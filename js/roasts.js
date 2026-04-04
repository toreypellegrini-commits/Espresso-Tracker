// ─── Dialed — Roasts ───
// Roast library rendering, roast detail, roast modal CRUD.
// Loads after router.js.

// ─── LIBRARY ───

function renderLibCard(r){
  const refDate=r.finished&&r.finishedDate?r.finishedDate:null;
  const days=calcDaysOffRoast(r.roastDate,refDate);
  let dc='';
  if(days!==null&&!r.finished){const cls=days<7?'days-fresh':days<=21?'days-peak':'days-old';const lbl=days<7?'resting':days<=21?'peak':'past peak';dc=`<span class="days-badge ${cls}">${days}d \u00b7 ${lbl}</span>`;}
  else if(days!==null&&r.finished){dc=`<span class="chip finished-chip">finished at ${days}d</span>`;}
  const heading=r.roastName?r.roaster+' \u00b7 '+r.roastName:r.roaster;
  const img=r.photo?`<img src="${r.photo}">`:`<span class="lib-card-placeholder">\u2615</span>`;
  const dialedStamp=r.dialed?'<span class="lib-card-dialed">\ud83c\udfaf Dialed</span>':'';
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
  const r=roastLib.find(x=>x.id==currentDetailRoastId);
  if(!r){navTo('library');return;}
  document.getElementById('header-title').textContent='Roast Details';
  document.getElementById('header-subtitle').style.display='block';
  document.getElementById('header-subtitle').textContent=[r.origin,r.varietal,r.process,r.roast].filter(Boolean).join(' · ')||'';
  const chips=[r.origin,r.varietal,r.process,r.roast].filter(Boolean).map(c=>`<span class="chip">${c}</span>`).join('');
  const sc=shots.filter(s=>s.roastLibId==r.id).length;
  const days=calcDaysOffRoast(r.roastDate,r.finished&&r.finishedDate?r.finishedDate:null);
  let dc='';
  if(days!==null&&!r.finished){const cls=days<7?'days-fresh':days<=21?'days-peak':'days-old';const lbl=days<7?'resting':days<=21?'peak':'past peak';dc=`<span class="days-badge ${cls}">${days}d · ${lbl}</span>`;}
  else if(days!==null&&r.finished)dc=`<span class="chip finished-chip">finished at ${days}d</span>`;
  const dialedChip=r.dialed?'<span class="chip highlight">🎯 Dialed</span>':'';
  const shotCountChip=sc?`<span class="chip">${sc} shot${sc>1?'s':''}</span>`:'';
  const img=r.photo?`<img src="${r.photo}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--border);float:left;margin-right:12px;">`:'';
  document.getElementById('roast-detail-header').innerHTML=`
    <div style="display:flex;align-items:flex-start;gap:12px;max-width:680px;margin:0 auto;padding:0 1rem;">
      ${r.photo?`<img src="${r.photo}" style="width:64px;height:64px;object-fit:cover;border-radius:var(--radius);border:1px solid var(--border);flex-shrink:0;">`:``}
      <div style="flex:1;min-width:0;">
        <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;letter-spacing:-0.01em;">${r.roastName ? r.roaster + ' · ' + r.roastName : r.roaster}</div>
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
  el.innerHTML=roastShots.map(s=>`<div class="shot-card">
    <div class="shot-card-header">
      <div>
        <div class="shot-date">${fmtDate(s.date)}${s.daysOffRoast!=null?' · '+s.daysOffRoast+'d off roast':''}</div>
        <div class="shot-meta">${s.rating?starsHTML(s.rating):'Not rated'}${s.grinderName?' · '+s.grinderName:''}</div>
      </div>
      <button class="delete-btn" onclick="deleteShot(${s.id})">✕</button>
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
  </div>`).join('');
}


// ─── ROAST MODAL ───
function previewPhoto(){const file=document.getElementById('m-photo').files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{const img=document.getElementById('m-photo-preview');img.src=e.target.result;img.style.display='block';};reader.readAsDataURL(file);}

function openModal(type){document.getElementById('modal-'+type).classList.remove('modal-hidden');if(type==='roast'){editingRoastId=null;document.getElementById('modal-roast-title').textContent='Add roast';document.getElementById('modal-roast-save').textContent='Save roast';['m-roaster','m-roastname','m-origin','m-varietal','m-desc','m-roastdate'].forEach(id=>setField(id,''));document.getElementById('m-process').value='';document.getElementById('m-roast-level').value='';document.getElementById('m-photo-preview').style.display='none';document.getElementById('modal-roast-msg').textContent='';document.getElementById('modal-roast-extra').style.display='none';}if(type==='grinder'){editingGrinderId=null;document.getElementById('modal-grinder-title').textContent='Add grinder';setField('mg-name','');setField('mg-notes','');document.getElementById('modal-grinder-msg').textContent='';}}
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

async function saveRoastEntry(){const roaster=g('m-roaster'),roastName=g('m-roastname');if(!roaster||!roastName){flash('modal-roast-msg','Roaster and roast name are required','danger');return;}const photo=document.getElementById('m-photo-preview').style.display!=='none'?document.getElementById('m-photo-preview').src:null;const entry={roaster,roastName,origin:g('m-origin'),varietal:g('m-varietal'),process:g('m-process'),roast:g('m-roast-level'),roastDate:g('m-roastdate'),desc:g('m-desc'),photo};try{setDbStatus('saving','Saving…');if(editingRoastId){const r=roastLib.find(x=>x.id==editingRoastId);if(r){Object.assign(r,entry);await dbUpdate('roast_library',r._db_id,r);}}else{const ne={id:Date.now(),...entry,finished:false,finishedDate:null};const row=await dbInsert('roast_library',ne);ne._db_id=row.id;roastLib.unshift(ne);}setDbStatus('ok','Saved');renderLibrary();populateRoastDropdown();closeModal('roast');if(currentPage==='roast-detail')renderRoastDetail();}catch(e){setDbStatus('error','Save failed');flash('modal-roast-msg','Error saving — try again','danger');}}


