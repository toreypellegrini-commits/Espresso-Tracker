// ─── Dialed — Achievements ───
// Rank system, achievement computation, dialed badge logic.
// Loads after router.js.

// Per-user localStorage key for achievements
function _achievementsKey() {
  return currentUser ? 'dialed_achievements_' + currentUser.id : 'dialed_achievements';
}

// Clean up the old shared key from before per-user fix
localStorage.removeItem('dialed_achievements');

// Track which achievements have already been toasted this session to prevent repeats
let _toastedThisSession = new Set();

// Toast queue — achievements are shown one at a time
let _toastQueue = [];
let _toastActive = false;

// Compute which achievements are unlocked from current data
function computeAchievements() {
  const unlocked = new Set(JSON.parse(localStorage.getItem(_achievementsKey()) || '[]'));
  const newlyUnlocked = [];

  const check = (id, condition) => {
    if (!unlocked.has(id) && condition) {
      unlocked.add(id);
      // Only toast if we haven't already shown this achievement this session
      if (!_toastedThisSession.has(id)) {
        _toastedThisSession.add(id);
        const a = ACHIEVEMENTS.find(a => a.id === id);
        if (a) newlyUnlocked.push(a);
      }
    }
  };

  // Shot-based
  check('first_pull', shots.length >= 1);
  check('century_pull', shots.length >= 100);

  // Ratio-based
  const turboShots = shots.filter(s => s.ratio && parseFloat(s.ratio) >= 3);
  check('turbo_time', turboShots.length >= 1);
  check('turbo_charged', turboShots.length >= 10);
  const ristrettoShots = shots.filter(s => s.ratio && parseFloat(s.ratio) < 1.5);
  check('ooey_gooey', ristrettoShots.length >= 1);
  check('buonissimo', ristrettoShots.length >= 10);

  // Rating-based
  check('perfectionist', shots.some(s => s.rating === 5));
  // 5 consecutive 5★
  let consec5 = 0, maxConsec5 = 0;
  [...shots].sort((a,b) => new Date(a.date) - new Date(b.date)).forEach(s => {
    if (s.rating === 5) { consec5++; maxConsec5 = Math.max(maxConsec5, consec5); }
    else consec5 = 0;
  });
  check('high_five', maxConsec5 >= 5);

  // Daily streak
  check('dedicated', computeStreak() >= 7);

  // Shots per day
  const shotsByDay = {};
  shots.forEach(s => {
    const d = s.date.slice(0, 10);
    shotsByDay[d] = (shotsByDay[d] || 0) + 1;
  });
  const maxPerDay = Math.max(0, ...Object.values(shotsByDay));
  check('caffeine_junkie', maxPerDay >= 3);
  check('certifiable', maxPerDay >= 5);

  // Bag-based
  const finishedBags = roastLib.filter(r => r.finished);
  check('completionist', finishedBags.length >= 1);
  check('bag_whisperer', finishedBags.length >= 10);

  // Dialed bags
  const dialedBags = roastLib.filter(r => r.dialed);
  check('dialed_in', dialedBags.length >= 1);
  check('espresso_nerd', dialedBags.length >= 10);
  check('won_the_game', dialedBags.length >= 100);

  // Roaster loyalist — 10 finished bags from same roaster
  const roasterFinished = {};
  finishedBags.forEach(r => {
    if (r.roaster) roasterFinished[r.roaster] = (roasterFinished[r.roaster] || 0) + 1;
  });
  check('roaster_loyalist', Object.values(roasterFinished).some(v => v >= 10));

  // Community
  const myCommShots = communityShots.filter(s => s.user_id === currentUser?.id);
  check('contributor', myCommShots.length >= 1);
  check('comm_regular', myCommShots.length >= 10);
  check('comm_pillar', myCommShots.length >= 100);

  localStorage.setItem(_achievementsKey(), JSON.stringify([...unlocked]));

  // Queue any newly unlocked achievements for display
  if (newlyUnlocked.length > 0) {
    queueAchievementToasts(newlyUnlocked);
  }

  return unlocked;
}

// Reset session toast tracking (call on sign-out so new user gets fresh toasts)
function resetAchievementSession() {
  _toastedThisSession = new Set();
  _toastQueue = [];
  _toastActive = false;
  if (toastTimeout) clearTimeout(toastTimeout);
}

function computeStreak() {
  if (!shots.length) return 0;
  const dates = [...new Set(shots.map(s => s.date.slice(0, 10)))].sort().reverse();
  let streak = 0, prev = null;
  for (const d of dates) {
    if (!prev) { streak = 1; prev = d; continue; }
    const diff = (new Date(prev) - new Date(d)) / 86400000;
    if (diff === 1) { streak++; prev = d; }
    else break;
  }
  return streak;
}

// Queue multiple achievements and show them one at a time
function queueAchievementToasts(achievements) {
  _toastQueue.push(...achievements);
  if (!_toastActive) {
    // Small initial delay so it doesn't pop immediately on page load
    setTimeout(showNextToast, 800);
  }
}

function showNextToast() {
  if (_toastQueue.length === 0) {
    _toastActive = false;
    return;
  }
  _toastActive = true;
  const achievement = _toastQueue.shift();
  const toast = document.getElementById('achievement-toast');
  document.getElementById('achievement-toast-icon').textContent = achievement.icon;
  document.getElementById('achievement-toast-name').textContent = achievement.name;
  document.getElementById('achievement-toast-desc').textContent = achievement.desc;
  toast.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
    // Show next toast after a brief gap
    setTimeout(showNextToast, 500);
  }, 3500);
}

// ─── DIALED BADGE ───

function checkDialedCondition(roastId) {
  const r = roastLib.find(x => x.id == roastId);
  if (!r || r.dialed) return; // already dialed
  const bagShots = shots
    .filter(s => s.roastLibId == roastId && s.rating > 0)
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);
  if (bagShots.length < 4) return;
  const highRated = bagShots.filter(s => s.rating >= 4).length;
  if (highRated >= 3) {
    pendingDialedRoastId = roastId;
    setTimeout(() => document.getElementById('modal-dialed').classList.remove('modal-hidden'), 600);
  }
}

async function confirmDialed() {
  if (!pendingDialedRoastId) return;
  const r = roastLib.find(x => x.id == pendingDialedRoastId);
  if (!r) return;
  r.dialed = true;
  try {
    await dbUpdate('roast_library', r._db_id, r);
    closeModal('dialed');
    renderLibrary();
    if (currentPage === 'roast-detail') renderRoastDetail();
    computeAchievements();
    setDbStatus('ok', 'Saved');
  } catch(e) { setDbStatus('error', 'Error'); }
  pendingDialedRoastId = null;
}

async function toggleDialed(id) {
  const r = roastLib.find(x => x.id == id);
  if (!r) return;
  r.dialed = !r.dialed;
  try {
    await dbUpdate('roast_library', r._db_id, r);
    setDbStatus('ok', 'Saved');
    renderLibrary();
    if (currentPage === 'roast-detail') renderRoastDetail();
    const dialBtn = document.getElementById('modal-dialed-btn');
    if (dialBtn) dialBtn.textContent = r.dialed ? 'Remove Dialed' : 'Mark as Dialed';
    computeAchievements();
  } catch(e) { setDbStatus('error', 'Error'); }
}
