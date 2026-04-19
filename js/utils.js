// ─── Dialed — Utilities ───
// Pure helper functions used across the app.
// Loads after config.js and state.js.

function flash(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color = type === 'danger' ? 'var(--danger-text)' : type === 'info' ? 'var(--muted)' : 'var(--success-text)';
  el.textContent = msg;
  if (type !== 'info') setTimeout(() => el.textContent = '', 3500);
}

function starsHTML(r) {
  return r ? `<span class="stars-display">${'★'.repeat(r)}${'☆'.repeat(5 - r)}</span>` : '';
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function calcDaysOffRoast(roastDateStr, fromDateStr) {
  if (!roastDateStr) return null;
  return Math.round((new Date((fromDateStr || todayStr()) + 'T12:00:00') - new Date(roastDateStr + 'T12:00:00')) / 86400000);
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function g(id) {
  return document.getElementById(id).value.trim();
}

function getRank(shotCount) {
  return RANKS.find(r => shotCount >= r.min && shotCount <= r.max) || RANKS[0];
}

// Classify a bag's current phase based on days off roast and its rest period.
// restDays = end of rest / start of peak. Peak lasts 14 days after rest ends.
// Returns { cls, label, phase } where phase is 'rest' | 'peak' | 'past'.
function getRoastPhase(daysOffRoast, restDays) {
  if (daysOffRoast == null) return null;
  const rest = (typeof restDays === 'number' && restDays > 0) ? restDays : 7;
  const peakEnd = rest + 14;
  if (daysOffRoast < rest) return { cls: 'days-fresh', label: 'resting', phase: 'rest' };
  if (daysOffRoast <= peakEnd) return { cls: 'days-peak', label: 'peak', phase: 'peak' };
  return { cls: 'days-old', label: 'past peak', phase: 'past' };
}

// ─── TEMPERATURE HELPERS ───
// All temps are stored in °C. These helpers convert for display/input
// based on userProfile.temp_unit ('C' or 'F').

function cToF(c) { return Math.round(c * 9 / 5 + 32); }
function fToC(f) { return Math.round((f - 32) * 5 / 9 * 10) / 10; }

// Format a temp value (stored in °C) for display in the user's preferred unit.
// Returns e.g. "93°C" or "200°F", or '—' if no value.
function fmtTemp(tempC) {
  if (tempC == null || tempC === '') return '—';
  const v = parseFloat(tempC);
  if (isNaN(v)) return '—';
  if (userProfile.temp_unit === 'F') return cToF(v) + '°F';
  const display = Number.isInteger(v) ? v : parseFloat(v.toFixed(1));
  return display + '°C';
}

// Returns the unit label string, e.g. "°C" or "°F"
function tempUnitLabel() {
  return userProfile.temp_unit === 'F' ? '°F' : '°C';
}

// Convert a user-entered temp to °C for storage.
// If user is in F mode, converts from F to C. Otherwise returns as-is.
function tempInputToC(val) {
  if (val === '' || val == null) return '';
  const v = parseFloat(val);
  if (isNaN(v)) return '';
  if (userProfile.temp_unit === 'F') return fToC(v);
  return v;
}

// Convert a stored °C temp to the user's unit for form prefill.
function tempCToInput(tempC) {
  if (tempC == null || tempC === '') return '';
  const v = parseFloat(tempC);
  if (isNaN(v)) return '';
  if (userProfile.temp_unit === 'F') return cToF(v);
  return v;
}
