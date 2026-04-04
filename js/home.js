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
    // Split into unlocked and locked for ordering
    const unlockedList = ACHIEVEMENTS.filter(a => unlocked.has(a.id)).sort((a, b) => a.name.localeCompare(b.name));
    const lockedList = ACHIEVEMENTS.filter(a => !unlocked.has(a.id)).sort((a, b) => a.name.localeCompare(b.name));
    const ordered = [...unlockedList, ...lockedList];

    gridEl.innerHTML = ordered.map(a => {
      const isUnlocked = unlocked.has(a.id);
      return `<div class="achievement-row ${isUnlocked ? 'unlocked' : ''}">
        <div class="achievement-row-icon ${isUnlocked ? '' : 'achievement-locked'}">${a.icon}</div>
        <div class="achievement-row-text">
          <div class="achievement-row-name">${a.name}</div>
          <div class="achievement-row-desc">${a.desc}</div>
        </div>
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
    const dialedBadge = r.dialed ? '<span class="dialed-stamp"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJAAAAAoCAYAAAAR33OgAAABCGlDQ1BJQ0MgUHJvZmlsZQAAeJxjYGA8wQAELAYMDLl5JUVB7k4KEZFRCuwPGBiBEAwSk4sLGHADoKpv1yBqL+viUYcLcKakFicD6Q9ArFIEtBxopAiQLZIOYWuA2EkQtg2IXV5SUAJkB4DYRSFBzkB2CpCtkY7ETkJiJxcUgdT3ANk2uTmlyQh3M/Ck5oUGA2kOIJZhKGYIYnBncAL5H6IkfxEDg8VXBgbmCQixpJkMDNtbGRgkbiHEVBYwMPC3MDBsO48QQ4RJQWJRIliIBYiZ0tIYGD4tZ2DgjWRgEL7AwMAVDQsIHG5TALvNnSEfCNMZchhSgSKeDHkMyQx6QJYRgwGDIYMZAKbWPz9HbOBQAAAK50lEQVR42u2baYhdZxnHf2e5y8wkMY21Vostgn5wCxgX1CJtNbUFaxuoYq1Wk7SKYFSiSOkXl0+KH4q4RUWKoEURF6TiUlyqtUWlFqnVilpTlxobNTWZZOYu55zXD/O8zD9Pzp2c27mZgpwXLnPuuee8z/L+32d9Jwkh0I52PNaRtipoRwugdrQAakcLoHa0AGpHO1oAtaMFUDv+nwDUdd9zIFtjjhRI7LpT866ftwkP+YT5cdfxWb03Z3/7wk8m7yYTeEjcx/PRdKiuekJrzsmTTHi/jsd8wlomTqddRz+uSbKRABqJ8DlQACWwYPcSYyoqJNi9DBiLAPHdBNhs8/aAqgYAHSdoJbzG68yeDXYd6RR2L86zbPQGxk/Pfkf49crP7W9w8hSyqGnN4tSN0mjG68q+L4s8QXhKHD+ZXVcmj/KxWfSPzJHL2lUyb1yTMCsPlDSsRCeOgYju0Rrv9OzZysC1LHPFRatEkOAWsxTLMRDFKojr+AzuOr7fMX4i35nM4emrnJH3KH/H5gtTWqH4XiagSdcAT+V4qkSmZAL9RDYUDjDzwJLzIsONsECRqcqYiYs4MiuU2b3UlO13W2YL0JEdk7qdgbM2pYBwJAtZmtBRmX0ng5rsqOCBWE+1qB1n1YJcjwW8y3Jd2Pcg8p5uzBvfAwfWTOgnwnNpdCqxpJWTaU70o6HCZpuztM9I5h4KOLuzAE9Tn54KEKJ7iCb0HcDV9tuSMVcYsIIp+xHgEPBb4AfAosybCdDUZJf2/enA54FNJvAHgO8JqAeOz7EDZg84C/gM8CngDlmcgXOtOPoAFwCfBbYY/RuBO2Uhlxvob8kW+GLgZuNzaDQXDWCpuN+xgKILvMdoKq9R128H9tpvx+zeUNx0AP4N/B243+b5k1iivtPhGQFQJWbTu6BLgRc7E4wod852QVeYvgt4P/BzAeYk4G4DXig77UlCpyO7yLvTTHb984ArgKPA7TJ3KhuibnSApwAvlYB/q6NRNQ0VgPOA5xqfhQEnWurMWb9EaD4DuFs2lY6XA9vlN7XGhayvxpB3GJC/v17wTBtEjR3oKlFGtCBHRCmFy7bm7d1LgR8C73VmWd0JYoajuR1LYBycCQ41WRdmCW+0ua8z2jjglhPox2e6Ik8i84+n0F1MGIY23zzwT+Ahsw5/Bf4GPGwWO1rtw8CfRT6NP6OFH9rmTIHjEjiPXdgxMDkuBr4OfHIjXZjuFI1PFm2OEvgDcK0J1RNfvAnYAbwReJEJOG9WKAM+KnRKFw8UQjd3Jt7HZ4hVKY3Gq4BXyA7cC/zYnilcLNZxoNRYKJM4YuBc8OmAlMlm6wkQdpsV2FKTDSbiggonX+Wsbc8+/wHeBtwDnGPynADOBZ5tm+cykXW30XnruhAUQpjmk8p1EkL4RlgZVQjhHvdbvO7I9d4QwlIIYWzvLYYQXiJzdx29HSGEoT1bhhD2OB6o+U4IoWd/77R3C+HzwhBC5p5PavhOQggX2TuVvX+FPJNNqbcbHC/b5feFCTLkTsbEff+iyHU4hHD+GmuFyX5Q9FmFEHbXyLMgOlzzs5GV6By4BXiLmPVNwDWSaYxcrNVpGKN59zU0a/gCmWtof/ebheo3rOOsu1RiPMbAOXP1JsxS1MlQzIB+V1zgryzpOSxhx3WWvZWS3p+QrO1xb2WMpTAI8E0L5OLCXws8WXhJJ4CjiRtetvd7wD5X7c1MkVdbYD6YUEua9dDiXi6lha7LPnsus9syI/ojoT8E7gW+Jd8vsUQDifPqYsvHHAPNaixLKeBLwE7JrM4zHz6QWICGOzDUWKRdBpJCKrm5gHk/8KYpi4HrsQAxsxoZ/T7wEcsMtSof48fM0u8PAr+bER+a1HzVYp+o52eZdRoKiHpNsrSNAFBPgtNSahZIoLjVMRtq+khrtQr6UjAsgHc79xecS9wFXG5BbHWG5R+5Xlxhfy9xVjaVQmJs0dw6IwDlMvfIsrxjZuUq4Ini4hOpk6Wn089GAGjoKrmFZQm4mgxSnR1PASClMQReY7UbrV0dA57gqsP7ge9ugPyxhbJkCxhB/BDwgLnvJeN3s/B9HHhwhnxUNv+iWaEFsfblepC5ESN1FuY5Uuj6l9VBdBdOEwOphdti1idanZHRPQBcaJ84Xmkp/o/OsOxlTdC8ZHzeZhsrkRgtVq63WS1oVgBGugA7XPHyN6z2/ILUvsomC7sRLqySnXcB8AbJvO4TM60FyH5DAA1lYS4yYMS5elaouwn4ipjkaPXetQHya9FyLDWqg8b3wECzaFYnvnOoYRbatAC8IIDaJ671kEtqotstm1qGaSxVXcA6qimja7yhRyDOBT4GnC3PHpBsqXKZSu7SXu1O5zUx0001BbwP2/UBVvpxWni8yj7+SIfGTXpWZ8hqg7Os2emJ2zhqhfQ4xkiCem0DJa6AOXZxSJAAV1s4vkGay5y60RLTw3Z55mZWm9QdkaURPpoCqHDp8Byrne9o7o5K6qlKKIHzgTez0gjdJanqT4DvSPqdSDU6KrOU3ZIKAApTZOx2X2OxzxHh+zYLRKPy98lCxzn2mDyVczU+rR4J0Isa/dVVretcWZRpi9twa9WQUgfsofEyEP0fsTgvddXrrm3cy4CfAtebLKnp/1ZJRJKm6fs0MZB2qyvpwSCthdz86i1mKmPPB2P+bOBprlh2O/B6matTo/ShxAce+JU8fxbwPru3zRQbj3rcYFneEic3Y2M2dBXwauBrnNwHi93+OVmId9qzEcRznNybmwceBT4B/H6NzTpn7vO1rDZV6yxfCvyalRMB8UhM7OYvS1ZXsXJy4eOc3JvMLHB+pgXrWuv5o8nziNz3G2MmdaDUmenIYF96LjGAvdK+j6RQljpg/Bf4AivN1K6k4EPZwbH/tdXFT2NxD3qUYo8BGOHtF+bfrxS3kQKfNmu1jdVu/PXAtzm5z9U15SMuZ+cacVg8QnEU+ByrpyQL5wYHBpqdkkYnrqyhIcHzrW4zdvIPxc1H67aT1f6cpu7qAnOzOh8yEHVdkpNNk5XlU7gvxL3Equr9wMtEuHgAbCTKK4y5n1nG82XgH6JMXAyQSwawLMIsSVFw7FLy11n5PbYnHjDLcozV7nQsjEWLsZfV7v7llpHdZQCojPZRC2wXjGaUZ861RzSjqZz71VKFHuOYk/hFTxhq+SE1Po65dRhKPBUtZeWyp1zKBgetffFLSybudgFzKngoOfXE6MTR5EhrIgGpHtYKVsHUE3M9YyBWXmO7YMDK8YXMFvmEq9JqbKMucxMrZ3L6pvj7xHRHSzO2Unxu1ewFq+I+XFMRjgu2CXiqvXPcaDxoJYWOVI0XzDXMsdrlH4mFilaxazLlxtO9QjMCrc/KeaBHxRWNazaxd2GLwF8ELJUs7jkWGujRl1I22ECC9YOurdJxVjxxNaEeDU4tNj0T3XG7XiefdD43d0FxPAYbOPUUoAdsXzIe9cWpuMZRjfVC6CDu0Z9+9K65cs8Gl22FNXQx6Z66glyAUXBqX4wJAWwiuvZnoRMXD4aa0CMRmogFL121vy6jrJq4sqYASiUWGbt71CyWPyjumVUfXzrXVU3oJ41qeOpIwdD/lokl1P9k8DvLHyTzCs1F9qFL7UuRT2MOn3zkEyw4NZnYpMPyaqWjDKnLtvw/CyRSGBw5K+ZBogfyK/feugHUjnY8bpXodrQAakc7WgC1owVQO1oAtaMFUDva0QKoHTMZ/wPQ3E1nT09fUQAAAABJRU5ErkJggg==" alt="Dialed"></span>' : '';

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
