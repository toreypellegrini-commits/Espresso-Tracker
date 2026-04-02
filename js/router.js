// ─── Dialed — Router ───
// Page navigation, drawer menu, back button, FAB visibility.
// Loads after config.js, state.js, utils.js, db.js, auth.js.

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

function navTo(page, opts = {}) {
  closeDrawer();
  previousPage = currentPage;
  currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.drawer-item').forEach(i => i.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  const backBtn = document.getElementById('back-btn');
  const hamburger = document.getElementById('hamburger-btn');
  const subtitle = document.getElementById('header-subtitle');

  const titles = {
    home: '<img src="data:image/png;base64,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" alt="Dialed" style="height:20px;width:auto;opacity:0.9;">',
    library: 'Roast Library',
    log: 'Log Shot',
    'roast-detail': '',
    community: 'Community Shots',
    myshots: 'My Shots',
    grinders: 'Grinders',
    insights: 'Insights',
    profile: 'My Profile'
  };

  document.getElementById('header-title').innerHTML = titles[page] || page;

  const isTopLevel = ['home', 'library', 'community', 'myshots', 'grinders', 'insights', 'profile'].includes(page);
  backBtn.style.display = isTopLevel ? 'none' : 'block';
  hamburger.style.display = isTopLevel ? 'flex' : 'none';
  subtitle.style.display = 'none';

  if (page === 'library') { renderLibrary(); }
  if (page === 'log') { populateRoastDropdown(); populateGrinderDropdown(); if (opts.roastId) { const sel = document.getElementById('roast-select'); sel.value = opts.roastId; loadRoast(); } }
  if (page === 'roast-detail' && opts.roastId) { currentDetailRoastId = opts.roastId; renderRoastDetail(); }
  if (page === 'home') { renderHome(); }
  if (page === 'profile') { populateProfileForm(); const thSel = document.getElementById('p-theme'); if (thSel) thSel.value = localStorage.getItem('ext_theme') || 'auto'; renderProfileRankAndAchievements(); }
  if (page === 'myshots') { populateMyShotsGrinderFilter(); renderMyShots(); }
  if (page === 'community') { loadCommunityShots().then(() => { populateCommunityGrinderFilter(); renderCommunity(); }); }
  if (page === 'grinders') renderGrinders();
  if (page === 'insights') renderInsights();

  window.scrollTo(0, 0);
  updateFabVisibility();
}

function goBack() {
  navTo(previousPage === 'roast-detail' ? 'library' : previousPage === 'log' ? 'home' : previousPage);
}

function logShotForCurrentRoast() {
  navTo('log', { roastId: currentDetailRoastId });
}

function globalFabClick() {
  if (currentPage === 'roast-detail' && currentDetailRoastId) {
    navTo('log', { roastId: currentDetailRoastId });
  } else {
    navTo('log');
  }
}

function updateFabVisibility() {
  const fab = document.getElementById('global-fab');
  if (!fab) return;
  fab.style.display = currentPage === 'log' ? 'none' : 'flex';
}
