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

// ─── HAPTIC FEEDBACK ───
// Light tap — for button presses, chip selections, star taps
function hapticTap() {
  if (navigator.vibrate) navigator.vibrate(10);
}

// Success — for shot save, reference set, confirmations
function hapticSuccess() {
  if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
}

// Bounce animation — scale an element briefly for visual feedback
// Works on all platforms including iOS where vibrate isn't supported
function animateTap(el) {
  if (!el) return;
  el.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
  el.style.transform = 'scale(0.92)';
  setTimeout(function() {
    el.style.transform = 'scale(1)';
    setTimeout(function() { el.style.transition = ''; el.style.transform = ''; }, 150);
  }, 100);
}

// Combined: vibrate + animate
function tapFeedback(el) {
  hapticTap();
  animateTap(el);
}

function successFeedback(el) {
  hapticSuccess();
  if (el) {
    el.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    el.style.transform = 'scale(1.1)';
    setTimeout(function() {
      el.style.transform = 'scale(1)';
      setTimeout(function() { el.style.transition = ''; el.style.transform = ''; }, 200);
    }, 150);
  }
}
