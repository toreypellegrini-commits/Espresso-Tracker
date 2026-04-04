// ─── Dialed — Home ───
// Home page: rank progress card, open bags, greeting.
// Loads after router.js.

// ─── RANK + ACHIEVEMENTS RENDER (Profile page) ───
function renderProfileRankAndAchievements() {
  const rank = getRank(shots.length);
  const rankEl = document.getElementById('profile-rank-section');
  if (rankEl) {
    rankEl.innerHTML = `
      <div style="font-size:36px;margin-bottom:6px;">${rank.icon}</div>
      <div class="rank-badge" style="font-size:14px;padding:6px 16px;">${rank.name}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:8px;">${shots.length} shot${shots.length!==1?'s':''} pulled</div>
      ${shots.length < 250 ? (() => {
        const next = RANKS.find(r => r.min > shots.length);
        return next ? `<div style="font-size:11px;color:var(--hint);margin-top:4px;">${next.min - shots.length} shots until ${next.name}</div>` : '';
      })() : '<div style="font-size:11px;color:var(--accent);margin-top:4px;">Maximum rank achieved 👑</div>'}
    `;
  }

  const unlocked = computeAchievements();
  const gridEl = document.getElementById('profile-achievements-grid');
  if (gridEl) {
    gridEl.innerHTML = ACHIEVEMENTS.map(a => {
      const isUnlocked = unlocked.has(a.id);
      return `<div class="achievement ${isUnlocked?'unlocked':''}" title="${a.desc}">
        <div class="achievement-icon ${isUnlocked?'':'achievement-locked'}">${a.icon}</div>
        <div class="achievement-name">${a.name}</div>
      </div>`;
    }).join('');
  }
}

// ─── GREETING ───
function getTimeGreeting(day) {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    const opts = [
      `Good morning — happy ${day}!`,
      `Rise and pull — happy ${day}!`,
      `Morning! Happy ${day}.`,
      `Happy ${day} morning!`,
    ];
    return opts[new Date().getDate() % opts.length];
  } else if (hour >= 12 && hour < 17) {
    const opts = [
      `Good afternoon — happy ${day}!`,
      `${day} afternoon — time for a shot?`,
      `Hope your ${day} is going well!`,
      `Happy ${day} afternoon.`,
    ];
    return opts[new Date().getDate() % opts.length];
  } else if (hour >= 17 && hour < 21) {
    const opts = [
      `Good evening — happy ${day}!`,
      `Evening shot? Happy ${day}.`,
      `${day} evening — how'd the shots go today?`,
      `Happy ${day} evening!`,
    ];
    return opts[new Date().getDate() % opts.length];
  } else {
    const opts = [
      `Burning the midnight oil on a ${day}?`,
      `Late night ${day} pull?`,
      `Up late on ${day} — hope it's worth it!`,
    ];
    return opts[new Date().getDate() % opts.length];
  }
}

// ─── RANK PROGRESS CARD ───
function renderRankCard() {
  const el = document.getElementById('home-rank-card');
  if (!el) return;

  const rank = getRank(shots.length);
  const dialedCount = roastLib.filter(r => r.dialed).length;
  const nextRank = RANKS.find(r => r.min > shots.length);
  const isMaxRank = !nextRank || rank.max === Infinity;

  let progressPct = 100;
  let progressLabel = 'Max rank achieved!';
  if (!isMaxRank && nextRank) {
    const rangeTotal = nextRank.min - rank.min;
    const rangeDone = shots.length - rank.min;
    progressPct = Math.min(100, Math.max(2, (rangeDone / rangeTotal) * 100));
    progressLabel = `${shots.length} / ${nextRank.min} shots`;
  }

  el.innerHTML = `
    <div class="rank-card">
      <div class="rank-card-top">
        <div class="rank-card-stats">
          <div class="rank-card-stat">
            <div class="rank-card-stat-val">${shots.length}</div>
            <div class="rank-card-stat-lbl">Shots</div>
          </div>
          <div class="rank-card-stat">
            <div class="rank-card-stat-val">${dialedCount}</div>
            <div class="rank-card-stat-lbl">Dialed</div>
          </div>
        </div>
        <div class="rank-card-rank">
          <div class="rank-card-rank-icon">${rank.icon}</div>
          <div class="rank-card-rank-name">${rank.name}</div>
        </div>
      </div>
      <div class="rank-progress">
        <div class="rank-progress-bar">
          <div class="rank-progress-fill" style="width:${progressPct}%"></div>
        </div>
        <div class="rank-progress-label">
          <span>${progressLabel}</span>
          ${!isMaxRank ? `<span>Next Rank: ${nextRank.name}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ─── OPEN BAGS ───
function renderOpenBags() {
  const container = document.getElementById('home-open-bags');
  const label = document.getElementById('home-bags-label');
  if (!container) return;

  const activeBags = roastLib.filter(r => !r.finished);

  if (!activeBags.length) {
    label.style.display = 'none';
    container.innerHTML = `<div class="bag-card-empty">No open bags yet.<br>Add a roast from the library to get started.</div>`;
    return;
  }

  label.style.display = 'block';
  container.innerHTML = activeBags.map(r => {
    const days = calcDaysOffRoast(r.roastDate, todayStr());
    const daysHTML = days !== null ? (() => {
      const cls = days < 7 ? 'days-fresh' : days <= 21 ? 'days-peak' : 'days-old';
      const lbl = days < 7 ? 'resting' : days <= 21 ? 'peak' : 'past peak';
      return `<span class="days-badge ${cls}">${days}d · ${lbl}</span>`;
    })() : '';

    const chips = [r.origin, r.varietal, r.process, r.roast].filter(Boolean).map(c => `<span class="chip">${c}</span>`).join('');
    const dialedBadge = r.dialed ? '<span class="chip highlight">🎯 Dialed</span>' : '';

    // Find most recent shot for this roast
    const lastShot = shots.find(s => s.roastLibId == r.id);
    let lastHTML = '';
    if (lastShot) {
      const parts = [];
      if (lastShot.dose) parts.push(`<span>${lastShot.dose}g in</span>`);
      if (lastShot.yield) parts.push(`<span>${lastShot.yield}g out</span>`);
      if (lastShot.time) parts.push(`<span>${lastShot.time}s</span>`);
      if (lastShot.grind) parts.push(`<span>grind ${lastShot.grind}</span>`);
      if (lastShot.rating) parts.push(`<span>${'★'.repeat(lastShot.rating)}</span>`);
      if (parts.length) {
        lastHTML = `<div class="bag-card-last">Last: ${parts.join(' · ')}</div>`;
      }
    }

    const shotCount = shots.filter(s => s.roastLibId == r.id).length;

    return `<div class="bag-card">
      <div class="bag-card-title">${r.roastName ? r.roaster + ' · ' + r.roastName : r.roaster}</div>
      <div class="bag-card-meta">${chips} ${daysHTML} ${dialedBadge} ${shotCount ? `<span>${shotCount} shot${shotCount>1?'s':''}</span>` : ''}</div>
      ${lastHTML}
      <button class="bag-card-btn" onclick="navTo('log',{roastId:${r.id}})">＋ Pull a shot</button>
    </div>`;
  }).join('');
}

// ─── RENDER HOME ───
function renderHome() {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const day = days[new Date().getDay()];
  const name = userProfile.username ? userProfile.username.charAt(0).toUpperCase() + userProfile.username.slice(1) : '';

  // Greeting
  const greetingEl = document.getElementById('home-greeting');
  const subtextEl = document.getElementById('home-subtext');
  const greetingText = getTimeGreeting(day);
  greetingEl.innerHTML = name
    ? `Welcome back, <em>${name}</em> — ${greetingText.toLowerCase()}`
    : `<em>${greetingText}</em>`;
  const tipIdx = (new Date().getDate() + new Date().getMonth()) % TIPS.length;
  subtextEl.textContent = TIPS[tipIdx];

  // Rank card
  renderRankCard();

  // Open bags
  renderOpenBags();
}
