// ─── Dialed — Home ───
// Home page rendering, greeting, rank display.
// Loads after router.js.

// ─── UTILS ───



// ─── RANK + ACHIEVEMENTS RENDER ───
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

// ─── HOME PAGE ───
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

  // Stats
  const roasterCounts = {};
  shots.forEach(s => { if(s.roaster) roasterCounts[s.roaster]=(roasterCounts[s.roaster]||0)+1; });
  const favRoaster = Object.entries(roasterCounts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—';
  document.getElementById('home-total-shots').textContent = shots.length || '0';
  const rank = getRank(shots.length);
  const rankBadgeEl = document.getElementById('home-rank-badge');
  if (rankBadgeEl) rankBadgeEl.innerHTML = `<span class="rank-badge"><span class="rank-badge-icon">${rank.icon}</span>${rank.name}</span>`;
  const favEl = document.getElementById('home-fav-roaster');
  favEl.textContent = favRoaster;
  favEl.style.fontSize = favRoaster.length > 12 ? '12px' : favRoaster.length > 8 ? '14px' : '15px';

  // Most recent shot
  const recentLabelEl = document.getElementById('home-recent-label');
  const recentEl = document.getElementById('home-recent-shot');
  if (!shots.length) {
    recentLabelEl.style.display = 'none';
    recentEl.innerHTML = '<div class="empty" style="padding:1.5rem 0;">No shots logged yet.<br>Tap ＋ Log Shot to get started.</div>';
    return;
  }
  recentLabelEl.style.display = 'block';
  const s = shots[0];
  recentEl.innerHTML = `<div class="shot-card" style="cursor:pointer;" onclick="navTo('roast-detail',{roastId:${s.roastLibId||0}})">
    <div class="shot-card-header">
      <div>
        <div class="shot-date" style="font-family:var(--font-serif);font-size:15px;">${s.roaster||'Unknown'}${s.origin?' · '+s.origin:''}</div>
        <div class="shot-meta">${fmtDate(s.date)}${s.daysOffRoast!=null?' · '+s.daysOffRoast+'d off roast':''}${s.rating?' · '+starsHTML(s.rating):''}</div>
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
      <div class="stat"><div class="stat-val">${s.grinderName||'—'}</div><div class="stat-lbl">Grinder</div></div>
      <div class="stat"><div class="stat-val">${s.preinfusion?s.preinfusion+'s':'—'}</div><div class="stat-lbl">Pre-inf</div></div>
    </div>
    ${s.notes?`<div class="shot-note">${s.notes}</div>`:''}
  </div>`;
}


