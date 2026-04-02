// ─── Dialed — Grinders ───
// Grinder CRUD and rendering.
// Loads after router.js.

// ─── GRINDERS ───
function renderGrinders(){const el=document.getElementById('grinder-list');if(!grinderLib.length){el.innerHTML='<div class="empty">No grinders yet.<br>Add your grinder above.</div>';return;}el.innerHTML=grinderLib.map(gr=>`<div class="shot-card" style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;align-items:center;"><div><div style="font-weight:600;font-size:14px;">${gr.name}</div>${gr.notes?`<div style="font-size:12px;color:var(--muted);margin-top:2px;">${gr.notes}</div>`:''}</div><div style="display:flex;gap:4px;"><button class="icon-btn" onclick="openEditGrinder(${gr.id})">✏</button><button class="icon-btn" onclick="deleteGrinder(${gr.id})" style="color:var(--danger-text);">✕</button></div></div></div>`).join('');}

function openEditGrinder(id){const gr=grinderLib.find(x=>x.id==id);if(!gr)return;editingGrinderId=id;document.getElementById('modal-grinder-title').textContent='Edit grinder';setField('mg-name',gr.name);setField('mg-notes',gr.notes||'');document.getElementById('modal-grinder-msg').textContent='';document.getElementById('modal-grinder').classList.remove('modal-hidden');}
async function saveGrinderEntry(){const name=g('mg-name');if(!name){flash('modal-grinder-msg','Grinder name is required','danger');return;}const entry={name,notes:g('mg-notes')};try{setDbStatus('saving','Saving…');if(editingGrinderId){const gr=grinderLib.find(x=>x.id==editingGrinderId);if(gr){Object.assign(gr,entry);await dbUpdate('grinders',gr._db_id,gr);}}else{const ne={id:Date.now(),...entry};const row=await dbInsert('grinders',ne);ne._db_id=row.id;grinderLib.push(ne);}setDbStatus('ok','Saved');renderGrinders();populateGrinderDropdown();closeModal('grinder');}catch(e){setDbStatus('error','Save failed');flash('modal-grinder-msg','Error','danger');}}
async function deleteGrinder(id){const gr=grinderLib.find(x=>x.id==id);if(!gr)return;try{await dbDelete('grinders',gr._db_id);grinderLib=grinderLib.filter(x=>x.id!==id);renderGrinders();populateGrinderDropdown();setDbStatus('ok','Saved');}catch(e){setDbStatus('error','Error');}}


