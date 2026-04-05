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
