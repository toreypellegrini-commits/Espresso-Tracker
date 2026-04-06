// ─── Dialed — Grinders ───
// Grinder CRUD and rendering.
// Loads after router.js.

// ─── GRINDER DROPDOWN BUILDER ───
function buildGrinderOptionsHTML(selectedName) {
  let html = '<option value="">Select grinder…</option>';
  Object.entries(GRINDERS).forEach(([group, names]) => {
    html += `<optgroup label="${group}">`;
    names.forEach(n => {
      html += `<option value="${n}"${n === selectedName ? ' selected' : ''}>${n}</option>`;
    });
    html += '</optgroup>';
  });
  // Add any user grinders not in the config list
  const configNames = Object.values(GRINDERS).flat();
  const custom = grinderLib.filter(gr => !configNames.includes(gr.name)).map(gr => gr.name);
  if (custom.length) {
    html += '<optgroup label="Your grinders">';
    custom.forEach(n => {
      html += `<option value="${n}"${n === selectedName ? ' selected' : ''}>${n}</option>`;
    });
    html += '</optgroup>';
  }
  html += '<option value="__other__">Other…</option>';
  return html;
}

// ─── GRINDERS ───
function renderGrinders() {
  const el = document.getElementById('grinder-list');
  if (!grinderLib.length) {
    el.innerHTML = '<div class="empty">No grinders yet.<br>Add your grinder above.</div>';
    return;
  }
  el.innerHTML = grinderLib.map(gr => `<div class="shot-card" style="margin-bottom:8px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-weight:600;font-size:14px;">${gr.name}</div>
        ${gr.notes ? `<div style="font-size:12px;color:var(--muted);margin-top:2px;">${gr.notes}</div>` : ''}
      </div>
      <div style="display:flex;gap:4px;">
        <button class="icon-btn" onclick="openEditGrinder(${gr.id})">✏</button>
        <button class="icon-btn" onclick="deleteGrinder(${gr.id})" style="color:var(--danger-text);">✕</button>
      </div>
    </div>
  </div>`).join('');
}

function populateGrinderModal(selectedName) {
  const sel = document.getElementById('mg-name-select');
  if (sel) sel.innerHTML = buildGrinderOptionsHTML(selectedName || '');
  const otherWrap = document.getElementById('mg-name-other-wrap');
  if (otherWrap) otherWrap.style.display = 'none';
}

function openEditGrinder(id) {
  const gr = grinderLib.find(x => x.id == id);
  if (!gr) return;
  editingGrinderId = id;
  document.getElementById('modal-grinder-title').textContent = 'Edit grinder';
  populateGrinderModal(gr.name);
  // If grinder isn't in the config list, select "Other" and fill custom field
  const configNames = Object.values(GRINDERS).flat();
  if (!configNames.includes(gr.name)) {
    const sel = document.getElementById('mg-name-select');
    sel.value = '__other__';
    document.getElementById('mg-name-other-wrap').style.display = 'block';
    setField('mg-name-other', gr.name);
  }
  setField('mg-notes', gr.notes || '');
  document.getElementById('modal-grinder-msg').textContent = '';
  document.getElementById('modal-grinder').classList.remove('modal-hidden');
}

async function saveGrinderEntry() {
  const sel = document.getElementById('mg-name-select');
  let name = sel.value;
  if (name === '__other__') name = document.getElementById('mg-name-other').value.trim();
  if (!name) { flash('modal-grinder-msg', 'Grinder name is required', 'danger'); return; }
  const entry = { name, notes: g('mg-notes') };
  try {
    setDbStatus('saving', 'Saving…');
    if (editingGrinderId) {
      const gr = grinderLib.find(x => x.id == editingGrinderId);
      if (gr) { Object.assign(gr, entry); await dbUpdate('grinders', gr._db_id, gr); }
    } else {
      // Check if grinder already exists
      if (grinderLib.some(gr => gr.name === name)) {
        flash('modal-grinder-msg', 'This grinder is already in your list', 'danger');
        return;
      }
      const ne = { id: Date.now(), ...entry };
      const row = await dbInsert('grinders', ne);
      ne._db_id = row.id;
      grinderLib.push(ne);
    }
    setDbStatus('ok', 'Saved');
    renderGrinders();
    populateGrinderDropdown();
    closeModal('grinder');
  } catch (e) {
    setDbStatus('error', 'Save failed');
    flash('modal-grinder-msg', 'Error', 'danger');
  }
}

async function deleteGrinder(id) {
  const gr = grinderLib.find(x => x.id == id);
  if (!gr) return;
  try {
    await dbDelete('grinders', gr._db_id);
    grinderLib = grinderLib.filter(x => x.id !== id);
    renderGrinders();
    populateGrinderDropdown();
    setDbStatus('ok', 'Saved');
  } catch (e) { setDbStatus('error', 'Error'); }
}


