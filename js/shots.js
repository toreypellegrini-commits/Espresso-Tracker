// ─── Dialed — Shots ───
// Shot logging form: compact layout, roast-based prefill, taste tags, smart save.
// Loads after router.js.

// Current recipe source on the log form: 'reference' or 'last'.
// Resets to default each time the log page is opened (default = reference if exists, else last).
let _recipeMode = 'reference';

// ─── INIT ───
function initExtractionDate() {
  const el = document.getElementById('f-extractdate');
  const vis = document.getElementById('f-extractdate-visible');
  const today = todayStr();
  if (el) el.value = today;
  if (vis) vis.value = today;
}

function syncExtractionDate() {
  const vis = document.getElementById('f-extractdate-visible');
  const hidden = document.getElementById('f-extractdate');
  if (vis && hidden) hidden.value = vis.value;
}

function updateRatio() {
  const dose = parseFloat(document.getElementById('f-dose').value);
  const yld = parseFloat(document.getElementById('f-yield').value);
  const el = document.getElementById('f-ratio');
  if (!isNaN(dose) && !isNaN(yld) && dose > 0) {
    el.className = 'shot-ratio';
    el.textContent = `1 : ${(yld / dose).toFixed(2)}`;
  } else {
    el.className = 'shot-ratio dim';
    el.textContent = 'Enter dose & yield';
  }
}

function updateShareNotice() {
  const grinderName = document.getElementById('f-grinder').value;
  const wrap = document.getElementById('share-notice-wrap');
  const notice = document.getElementById('share-notice');
  if (!grinderName) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  if (currentRating >= SHARE_MIN_RATING) {
    notice.className = 'notice notice-success';
    notice.textContent = `Rated ${currentRating}★ — this shot will be shared with the community. Params only, no tasting notes.`;
  } else if (currentRating > 0) {
    notice.className = 'notice notice-warning';
    notice.textContent = `Rated ${currentRating}★ — only shots rated ${SHARE_MIN_RATING}★+ are shared with the community.`;
  } else {
    notice.className = 'notice notice-info';
    notice.textContent = `Rate this shot ${SHARE_MIN_RATING}★+ to share with the community. Tasting notes stay private.`;
  }
}

// ─── STAR RATING ───
document.querySelectorAll('.star').forEach(s => {
  s.addEventListener('click', () => {
    currentRating = +s.dataset.v;
    document.querySelectorAll('.star').forEach(x => x.classList.toggle('active', +x.dataset.v <= currentRating));
    document.getElementById('star-label').textContent = ['', 'Poor', 'Fair', 'Good', 'Great', 'Outstanding'][currentRating];
    updateShareNotice();
  });
  s.addEventListener('mouseover', () => document.querySelectorAll('.star').forEach(x => x.style.color = +x.dataset.v <= +s.dataset.v ? '#d4880a' : ''));
  s.addEventListener('mouseout', () => document.querySelectorAll('.star').forEach(x => x.style.color = ''));
});

// ─── TASTE TAGS ───
function toggleTag(btn) {
  btn.classList.toggle('active');
}

function getSelectedTags() {
  return Array.from(document.querySelectorAll('.taste-tag.active')).map(b => b.dataset.tag);
}

function clearTags() {
  document.querySelectorAll('.taste-tag').forEach(b => b.classList.remove('active'));
}

// ─── STEPPER ───
// Store reference values from last shot for change indicators
let _refValues = {};

function stepField(id, delta) {
  const input = document.getElementById(id);
  const step = Math.abs(delta);
  const current = parseFloat(input.value) || 0;
  const decimals = step < 1 ? 1 : 0;
  input.value = (current + delta).toFixed(decimals);
  input.dispatchEvent(new Event('input'));
  updateChangeIndicator(id);
}

function updateChangeIndicator(id) {
  const input = document.getElementById(id);
  const stepper = input.closest('.stepper');
  if (!stepper) return;
  const ref = _refValues[id];
  const current = parseFloat(input.value);
  const indicator = stepper.parentElement.querySelector('.change-indicator');

  if (ref == null || isNaN(current) || current === ref) {
    stepper.classList.remove('changed');
    if (indicator) indicator.textContent = '';
    return;
  }

  stepper.classList.add('changed');
  const diff = current - ref;
  const decimals = (diff % 1 !== 0) ? 1 : 0;
  const sign = diff > 0 ? '▲' : '▼';
  const absDiff = Math.abs(diff).toFixed(decimals);
  if (indicator) {
    indicator.textContent = `${sign} ${absDiff}`;
    indicator.className = 'change-indicator ' + (diff > 0 ? 'up' : 'down');
  }
}

// Smart grind stepper: if current value has a decimal, step by 0.1; otherwise step by 1
function stepGrind(direction) {
  const input = document.getElementById('f-grind');
  const current = parseFloat(input.value) || 0;
  const hasDecimal = String(input.value).includes('.');
  const step = hasDecimal ? 0.1 : 1;
  const delta = direction * step;
  const decimals = hasDecimal ? 1 : 0;
  input.value = (Math.round((current + delta) * 10) / 10).toFixed(decimals);
  input.dispatchEvent(new Event('input'));
  updateChangeIndicator('f-grind');
}

// Format a value cleanly — no trailing .0 for whole numbers
function cleanNum(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return '';
  return n % 1 === 0 ? n.toFixed(0) : n.toString();
}

// ─── DROPDOWNS ───
function populateRoastDropdown() {
  const sel = document.getElementById('roast-select');
  const prev = sel.value;
  sel.innerHTML = '<option value="">— choose a saved roast —</option>';
  roastLib.filter(r => !r.finished).forEach(r => {
    sel.innerHTML += `<option value="${r.id}">${r.roastName ? r.roaster + ' · ' + r.roastName : r.roaster}${r.origin ? ' (' + r.origin + ')' : ''}</option>`;
  });
  if (prev) sel.value = prev;
}

function populateGrinderDropdown() {
  const sel = document.getElementById('f-grinder');
  const prev = sel.value;
  // Build list from user's grinder names used in their shots
  const grinderNames = [...new Set(shots.map(s => s.grinderName).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">— none —</option>';
  grinderNames.forEach(name => {
    sel.innerHTML += `<option value="${name}">${name}</option>`;
  });
  // Also add grinders from grinderLib if it exists (backward compat)
  if (typeof grinderLib !== 'undefined' && grinderLib.length) {
    grinderLib.forEach(gr => {
      if (!grinderNames.includes(gr.name)) {
        sel.innerHTML += `<option value="${gr.name}">${gr.name}</option>`;
      }
    });
  }
  if (prev) sel.value = prev;
}

// ─── LOAD ROAST + PREFILL ───
function loadRoast() {
  const roastId = document.getElementById('roast-select').value;
  const r = roastLib.find(x => x.id == roastId);
  if (!r) {
    document.getElementById('shot-context').style.display = 'none';
    return;
  }

  // Set hidden fields from roast record
  setField('f-roaster', r.roaster);
  setField('f-roastname', r.roastName || '');
  setField('f-origin', r.origin);
  setField('f-varietal', r.varietal || '');
  setField('f-roastdate', r.roastDate || '');
  document.getElementById('f-process').value = r.process || '';
  document.getElementById('f-roast').value = r.roast || '';

  // Determine default recipe mode: reference if it exists, else last
  const referenceShot = getReferenceShot(roastId);
  const lastShot = shots.find(s => s.roastLibId == roastId);
  if (referenceShot) _recipeMode = 'reference';
  else _recipeMode = 'last';

  renderShotContext(r, roastId);
  applyRecipePrefill(roastId);
}

// Renders the shot-context block (roast title, chips, days off roast, recipe line + toggle)
function renderShotContext(r, roastId) {
  const days = calcDaysOffRoast(r.roastDate, todayStr());
  const daysHTML = days !== null ? (() => {
    const p = getRoastPhase(days, r.restDays);
    return p ? `<span class="days-badge ${p.cls}">${days}d · ${p.label}</span>` : '';
  })() : '';

  const referenceShot = getReferenceShot(roastId);
  const lastShot = shots.find(s => s.roastLibId == roastId);
  const activeShot = _recipeMode === 'reference' && referenceShot ? referenceShot : lastShot;

  // Build compact recipe line for whichever mode is active.
  // Format: "⭐ 18g → 45g · 13s · grind 37" (Reference) or "Last · 18g → 45g · 13s · grind 37"
  let recipeHTML = '';
  if (activeShot) {
    const parts = [];
    if (activeShot.dose && activeShot.yield) parts.push(`${activeShot.dose}g → ${activeShot.yield}g`);
    else if (activeShot.dose) parts.push(`${activeShot.dose}g in`);
    else if (activeShot.yield) parts.push(`${activeShot.yield}g out`);
    if (activeShot.time) parts.push(`${activeShot.time}s`);
    if (activeShot.grind) parts.push(`grind ${activeShot.grind}`);
    if (parts.length) {
      const prefix = _recipeMode === 'reference'
        ? '<span class="recipe-line-star">⭐</span>'
        : '<span class="recipe-line-label">Last</span>';
      const notesHTML = (_recipeMode === 'last' && activeShot.notes) ? `<div class="shot-context-notes">${activeShot.notes}</div>` : '';
      recipeHTML = `<div class="shot-context-recipe">${prefix}${parts.join(' · ')}</div>${notesHTML}`;
    }
  }

  // Inline text toggle — always show whenever a reference recipe exists.
  // Compact "Ref · Last" with the active option in accent color.
  let toggleHTML = '';
  if (referenceShot) {
    toggleHTML = `
      <div class="recipe-toggle">
        <span class="recipe-toggle-opt ${_recipeMode === 'reference' ? 'active' : ''}" onclick="setRecipeMode('reference')">Ref</span>
        <span class="recipe-toggle-sep">·</span>
        <span class="recipe-toggle-opt ${_recipeMode === 'last' ? 'active' : ''}" onclick="setRecipeMode('last')">Last</span>
      </div>`;
  }

  const chips = [r.origin, r.varietal, r.process, r.roast].filter(Boolean).map(c => `<span class="chip">${c}</span>`).join('');
  const ctx = document.getElementById('shot-context');
  ctx.style.display = 'block';
  ctx.innerHTML = `
    <div class="shot-context-header">
      <div class="shot-context-title">${r.roastName ? r.roaster + ' · ' + r.roastName : r.roaster}</div>
      ${toggleHTML}
    </div>
    <div class="shot-context-meta">${chips} ${daysHTML}</div>
    ${recipeHTML}
  `;
}

// Applies the prefill values from the active source (reference or last) to the form
function applyRecipePrefill(roastId) {
  const referenceShot = getReferenceShot(roastId);
  const lastShot = shots.find(s => s.roastLibId == roastId);
  const source = _recipeMode === 'reference' && referenceShot ? referenceShot : lastShot;

  _refValues = {};
  if (source) {
    if (source.grinderName) {
      const sel = document.getElementById('f-grinder');
      if (!Array.from(sel.options).some(o => o.value === source.grinderName)) {
        sel.innerHTML += `<option value="${source.grinderName}">${source.grinderName}</option>`;
      }
      sel.value = source.grinderName;
    }
    if (source.grind) { setField('f-grind', cleanNum(source.grind)); _refValues['f-grind'] = parseFloat(source.grind); }
    if (source.dose) { setField('f-dose', cleanNum(source.dose)); _refValues['f-dose'] = parseFloat(source.dose); }
    if (source.yield) { setField('f-yield', cleanNum(source.yield)); _refValues['f-yield'] = parseFloat(source.yield); }
    if (source.time) { setField('f-time', cleanNum(source.time)); _refValues['f-time'] = parseFloat(source.time); }
    if (source.temp) setField('f-temp', cleanNum(source.temp));
    if (source.preinfusion) setField('f-preinfusion', cleanNum(source.preinfusion));
    updateRatio();
    updateShareNotice();
    document.querySelectorAll('.stepper').forEach(s => s.classList.remove('changed'));
    document.querySelectorAll('.change-indicator').forEach(el => el.textContent = '');
  } else {
    // No prior shot for this roast — clear prefillable fields so values from a previous roast don't carry over
    ['f-grind','f-dose','f-yield','f-time','f-temp','f-preinfusion'].forEach(id => setField(id, ''));
    document.getElementById('f-grinder').value = '';
    updateRatio();
    updateShareNotice();
    document.querySelectorAll('.stepper').forEach(s => s.classList.remove('changed'));
    document.querySelectorAll('.change-indicator').forEach(el => el.textContent = '');
  }
}

// Called when the user toggles between Reference and Last
function setRecipeMode(mode) {
  if (_recipeMode === mode) return; // No-op if already in this mode
  _recipeMode = mode;
  const roastId = document.getElementById('roast-select').value;
  const r = roastLib.find(x => x.id == roastId);
  if (!r) return;

  // Brief fade-out → re-render → fade-in for a smooth recipe line swap
  const existingRecipe = document.querySelector('.shot-context-recipe');
  if (existingRecipe) {
    existingRecipe.classList.add('fading');
    setTimeout(() => {
      renderShotContext(r, roastId);
      applyRecipePrefill(roastId);
      // Force a reflow then add the entering class so the fade-in transition fires
      const newRecipe = document.querySelector('.shot-context-recipe');
      if (newRecipe) {
        newRecipe.classList.add('entering');
        // Remove the entering class on the next frame to trigger the transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => newRecipe.classList.remove('entering'));
        });
      }
    }, 130);
  } else {
    renderShotContext(r, roastId);
    applyRecipePrefill(roastId);
  }
}

// ─── SAVE ───
async function saveShot() {
  const btn = document.getElementById('save-shot-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  setDbStatus('saving', 'Saving…');

  const dose = parseFloat(g('f-dose')), yld = parseFloat(g('f-yield'));
  const ratio = (!isNaN(dose) && !isNaN(yld) && dose > 0) ? +(yld / dose).toFixed(2) : null;
  const roastDate = g('f-roastdate');
  const extractDate = g('f-extractdate') || todayStr();
  const grinderName = document.getElementById('f-grinder').value || null;
  const roastLibId = document.getElementById('roast-select').value || null;
  const tags = getSelectedTags();

  const shot = {
    id: Date.now(),
    date: extractDate + 'T12:00:00.000Z',
    roastLibId,
    roaster: g('f-roaster'),
    roastName: g('f-roastname'),
    origin: g('f-origin'),
    varietal: g('f-varietal'),
    process: g('f-process'),
    roast: g('f-roast'),
    roastDate,
    daysOffRoast: calcDaysOffRoast(roastDate, extractDate),
    grinderName,
    grind: g('f-grind'),
    dose: isNaN(dose) ? null : dose,
    yield: isNaN(yld) ? null : yld,
    ratio,
    temp: g('f-temp'),
    preinfusion: g('f-preinfusion'),
    time: g('f-time'),
    rating: currentRating,
    notes: g('f-notes'),
    tags
  };

  try {
    const row = await dbInsert('shots', shot);
    shot._db_id = row.id;
    shots.unshift(shot);
    shots.sort((a, b) => new Date(b.date) - new Date(a.date));
    setDbStatus('ok', 'Saved');
    syncShotCount();

    // Check if this bag is now dialed
    if (roastLibId) checkDialedCondition(parseInt(roastLibId));

    // Community sharing
    const willShare = grinderName && currentRating >= SHARE_MIN_RATING;
    if (willShare) await publishCommunityShot(shot, grinderName);

    // Smart save message
    const msg = getSaveMessage(shot, willShare);
    flash('save-msg', msg, 'success');

    // Check for new achievements
    computeAchievements();

    clearForm();

    // Navigate back to roast detail
    if (roastLibId) {
      setTimeout(() => navTo('roast-detail', { roastId: parseInt(roastLibId) }), 1500);
    }
  } catch (e) {
    setDbStatus('error', 'Save failed');
    flash('save-msg', 'Error saving — please try again', 'danger');
  }
  btn.disabled = false; btn.textContent = 'Save shot';
}

function getSaveMessage(shot, willShare) {
  const roastId = shot.roastLibId;
  if (roastId) {
    const bagShots = shots.filter(s => s.roastLibId == roastId && s.rating > 0);
    const rated = bagShots.filter(s => s.rating >= 4);

    // Best shot for this roast?
    if (shot.rating && shot.rating >= Math.max(...bagShots.map(s => s.rating || 0))) {
      if (shot.rating >= 4) return 'Best shot so far 🎯';
    }

    // Close to dialed?
    if (rated.length >= 2 && rated.length < 4 && shot.rating >= 4) {
      return 'Nice — that looks close to dialed ☕';
    }
  }

  if (willShare) return `Shot saved · shared with community (${shot.rating}★)`;
  if (shot.rating === 5) return 'Outstanding shot saved! ⭐';
  return 'Shot saved!';
}

// ─── CLEAR ───
function clearForm() {
  ['f-roaster', 'f-roastname', 'f-origin', 'f-varietal', 'f-grind', 'f-dose', 'f-yield', 'f-temp', 'f-preinfusion', 'f-time', 'f-notes', 'f-roastdate'].forEach(id => setField(id, ''));
  document.getElementById('f-process').value = '';
  document.getElementById('f-roast').value = '';
  document.getElementById('roast-select').value = '';
  document.getElementById('f-grinder').value = '';
  currentRating = 0;
  document.querySelectorAll('.star').forEach(x => x.classList.remove('active'));
  document.getElementById('star-label').textContent = 'tap to rate';
  initExtractionDate();
  updateRatio();
  updateShareNotice();
  clearTags();
  document.getElementById('shot-context').style.display = 'none';
  const adv = document.getElementById('shot-advanced');
  if (adv) adv.removeAttribute('open');
  _refValues = {};
  _recipeMode = 'reference'; // Reset to default so next roast load uses reference if available
  document.querySelectorAll('.stepper').forEach(s => s.classList.remove('changed'));
  document.querySelectorAll('.change-indicator').forEach(el => el.textContent = '');
}

// ─── DELETE ───
async function deleteShot(id) {
  const s = shots.find(x => x.id == id);
  if (!s) return;
  try {
    await dbDelete('shots', s._db_id);
    shots = shots.filter(x => x.id !== id);
    // If this shot was the reference recipe for its roast, clear the reference
    if (s.roastLibId) {
      const roast = roastLib.find(r => r.id == s.roastLibId);
      if (roast && roast.referenceShotId == id) {
        roast.referenceShotId = null;
        try {
          await dbUpdate('roast_library', roast._db_id, roast);
          showSimpleToast('☆ Reference recipe cleared — this shot was your reference');
        } catch (e) { console.warn('Failed to clear reference on delete:', e.message); }
      }
    }
    setDbStatus('ok', 'Saved');
    syncShotCount();
    if (currentPage === 'roast-detail') renderRoastShots();
    else if (currentPage === 'home') renderHome();
    else if (currentPage === 'myshots') renderMyShots();
  } catch (e) { setDbStatus('error', 'Error'); }
}
