// ─── Dialed — My Shots + Shared Filter Modal ───
// Filter modal logic shared between My Shots and Community pages.
// My Shots page: filtering, progressive rendering.
// Loads after router.js.

// ─── SHARED FILTER MODAL ───
let _filterTarget = null; // 'myshots' or 'community'
let _filterSelections = {}; // temp selections while modal is open

const FILTER_DEFS = {
  roast: {
    title: 'Roast Level',
    options: ['Ultra-light','Light','Light-medium','Medium','Medium-dark','Dark']
  },
  process: {
    title: 'Process',
    options: ['Washed','Natural','Honey','Anaerobic','Anaerobic Washed','Co-ferment','Wet-hulled']
  },
  rating: {
    title: 'Min Rating',
    options: [
      { label: '3\u2605+', value: '3' },
      { label: '4\u2605+', value: '4' },
      { label: '5\u2605', value: '5' }
    ]
  }
};

function openFilterModal(target) {
  _filterTarget = target;
  var prefix = target === 'myshots' ? 'ms' : 'cf';
  _filterSelections = {
    process: document.getElementById(prefix + '-process').value,
    roast: document.getElementById(prefix + '-roast').value,
    varietal: document.getElementById(prefix + '-varietal').value,
    rating: document.getElementById(prefix + '-rating').value,
    grinder: document.getElementById(prefix + '-grinder') ? document.getElementById(prefix + '-grinder').value : ''
  };
  _renderFilterSections(target);
  document.getElementById('filter-modal-backdrop').classList.add('open');
  document.getElementById('filter-modal').classList.add('open');
}

function closeFilterModal() {
  document.getElementById('filter-modal-backdrop').classList.remove('open');
  document.getElementById('filter-modal').classList.remove('open');
  _filterTarget = null;
}

function _renderFilterSections(target) {
  var container = document.getElementById('filter-modal-sections');
  var html = '';
  html += _renderFilterSection('roast', FILTER_DEFS.roast.title, FILTER_DEFS.roast.options);
  html += _renderFilterSection('process', FILTER_DEFS.process.title, FILTER_DEFS.process.options);
  var varietals = _getVarietalOptions(target);
  if (varietals.length) html += _renderFilterSection('varietal', 'Varietal', varietals);
  var grinders = _getGrinderOptions(target);
  if (grinders.length) html += _renderFilterSection('grinder', 'Grinder', grinders);
  var rLabels = FILTER_DEFS.rating.options.map(function(o) { return o.label; });
  var rValues = FILTER_DEFS.rating.options.map(function(o) { return o.value; });
  html += _renderFilterSection('rating', FILTER_DEFS.rating.title, rLabels, rValues);
  container.innerHTML = html;
}

function _renderFilterSection(key, title, labels, values) {
  if (!values) values = labels;
  var current = _filterSelections[key] || '';
  var html = '<div class="filter-section"><div class="filter-section-title">' + title + '</div><div class="filter-options">';
  for (var i = 0; i < labels.length; i++) {
    var val = String(values[i]);
    var label = labels[i];
    var selected = current === val ? ' selected' : '';
    var safeVal = val.replace(/'/g, "\\'");
    html += '<div class="filter-chip' + selected + '" onclick="_toggleFilterChip(\'' + key + '\',\'' + safeVal + '\',this)">' + label + '</div>';
  }
  html += '</div></div>';
  return html;
}

function _toggleFilterChip(key, value, el) {
  if (_filterSelections[key] === value) {
    _filterSelections[key] = '';
    el.classList.remove('selected');
  } else {
    var parent = el.parentElement;
    parent.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('selected'); });
    _filterSelections[key] = value;
    el.classList.add('selected');
  }
}

function clearAllFilters() {
  _filterSelections = { process: '', roast: '', varietal: '', rating: '', grinder: '' };
  document.querySelectorAll('#filter-modal-sections .filter-chip').forEach(function(c) { c.classList.remove('selected'); });
}

function applyFilters() {
  var target = _filterTarget;
  var prefix = target === 'myshots' ? 'ms' : 'cf';
  document.getElementById(prefix + '-process').value = _filterSelections.process || '';
  document.getElementById(prefix + '-roast').value = _filterSelections.roast || '';
  document.getElementById(prefix + '-varietal').value = _filterSelections.varietal || '';
  document.getElementById(prefix + '-rating').value = _filterSelections.rating || '';
  var gEl = document.getElementById(prefix + '-grinder');
  if (gEl) gEl.value = _filterSelections.grinder || '';
  _updateFilterBadge(prefix);
  closeFilterModal();
  if (target === 'myshots') renderMyShots();
  else renderCommunity();
}

function _updateFilterBadge(prefix) {
  var count = ['process','roast','varietal','rating','grinder'].reduce(function(n, key) {
    var el = document.getElementById(prefix + '-' + key);
    return n + (el && el.value ? 1 : 0);
  }, 0);
  var label = document.getElementById(prefix + '-filter-label');
  var btn = document.getElementById(prefix + '-filter-btn');
  if (label) label.textContent = count ? 'Filter (' + count + ')' : 'Filter';
  if (btn) { if (count) btn.classList.add('active'); else btn.classList.remove('active'); }
}

function _getVarietalOptions(target) {
  var vals = {};
  if (target === 'myshots') {
    shots.forEach(function(s) { if (s.varietal) vals[s.varietal] = true; });
  } else {
    communityShots.forEach(function(s) { if (s.varietal) vals[s.varietal] = true; });
  }
  return Object.keys(vals).sort();
}

function _getGrinderOptions(target) {
  var vals = {};
  if (target === 'myshots') {
    shots.forEach(function(s) { if (s.grinderName) vals[s.grinderName] = true; });
  } else {
    communityShots.forEach(function(s) { if (s.grinder_name) vals[s.grinder_name] = true; });
  }
  return Object.keys(vals).sort();
}

// ─── MY SHOTS PAGE ───
var MY_SHOTS_PAGE_SIZE = 10;
var _myShotsFiltered = [];
var _myShotsShown = 0;

function populateMyShotsGrinderFilter() {
  // No-op — grinder filter is inside the modal now
}

function renderMyShots() {
  var search = document.getElementById('ms-search').value.toLowerCase();
  var process = document.getElementById('ms-process').value;
  var roast = document.getElementById('ms-roast').value;
  var varietal = document.getElementById('ms-varietal').value;
  var minRating = +document.getElementById('ms-rating').value || 0;
  var grinder = document.getElementById('ms-grinder').value;

  _myShotsFiltered = shots.filter(function(s) {
    var text = [s.roaster,s.roastName,s.origin,s.varietal,s.notes,s.grinderName].join(' ').toLowerCase();
    if (search && !text.includes(search)) return false;
    if (process && s.process !== process) return false;
    if (roast && s.roast !== roast) return false;
    if (varietal && s.varietal !== varietal) return false;
    if (minRating && (s.rating||0) < minRating) return false;
    if (grinder && s.grinderName !== grinder) return false;
    return true;
  });

  _myShotsFiltered.sort(function(a,b) { return new Date(b.date) - new Date(a.date); });

  var el = document.getElementById('myshots-list');
  if (!_myShotsFiltered.length) { el.innerHTML='<div class="empty">No shots match these filters.</div>'; return; }

  _myShotsShown = 0;
  el.innerHTML = '';
  _renderMoreMyShots();
}

function _renderMoreMyShots() {
  var el = document.getElementById('myshots-list');
  var end = Math.min(_myShotsShown + MY_SHOTS_PAGE_SIZE, _myShotsFiltered.length);
  var batch = _myShotsFiltered.slice(_myShotsShown, end);

  var oldBtn = document.getElementById('myshots-load-more');
  if (oldBtn) oldBtn.remove();

  var html = batch.map(function(s) {
    var chips = [s.origin,s.varietal,s.process,s.roast].filter(Boolean).map(function(c){return '<span class="chip">'+c+'</span>';}).join('');
    var roast = s.roastLibId ? roastLib.find(function(r){return r.id==s.roastLibId;}) : null;
    var isRef = roast && roast.referenceShotId == s.id;
    var canBeRef = !!s.roastLibId;
    return '<div class="shot-card">'
      + '<div class="shot-card-header"><div>'
      + '<div class="shot-date" style="font-family:var(--font-serif);font-size:15px;">' + (s.roastName ? s.roaster + ' \u00b7 ' + s.roastName : s.roaster||'Unknown') + '</div>'
      + '<div class="shot-meta">' + fmtDate(s.date) + (s.rating ? ' \u00b7 ' + starsHTML(s.rating) : '') + (s.grinderName ? ' \u00b7 ' + s.grinderName : '') + '</div>'
      + '</div><div style="display:flex;align-items:center;gap:4px;">'
      + (canBeRef ? '<button class="ref-star-btn ' + (isRef?'active':'') + '" onclick="toggleReferenceShot(' + s.id + ')" title="' + (isRef?'Reference recipe':'Set as reference recipe') + '">' + (isRef?'\u2b50':'\u2606') + '</button>' : '')
      + '<button class="delete-btn" onclick="if(confirm(\'Delete this shot? This cannot be undone.\'))deleteShot(' + s.id + ')">\u2715</button>'
      + '</div></div>'
      + (chips ? '<div class="shot-chips">' + chips + '</div>' : '')
      + '<div class="shot-stats">'
      + '<div class="stat"><div class="stat-val">' + (s.dose||'\u2014') + 'g</div><div class="stat-lbl">Dose</div></div>'
      + '<div class="stat"><div class="stat-val">' + (s.yield||'\u2014') + 'g</div><div class="stat-lbl">Yield</div></div>'
      + '<div class="stat"><div class="stat-val">' + (s.ratio ? '1:'+s.ratio : '\u2014') + '</div><div class="stat-lbl">Ratio</div></div>'
      + '<div class="stat"><div class="stat-val">' + (s.time ? s.time+'s' : '\u2014') + '</div><div class="stat-lbl">Time</div></div>'
      + '</div>'
      + '<div class="shot-stats" style="margin-top:6px;">'
      + '<div class="stat"><div class="stat-val">' + (s.grind||'\u2014') + '</div><div class="stat-lbl">Grind</div></div>'
      + '<div class="stat"><div class="stat-val">' + (s.temp ? fmtTemp(s.temp) : '\u2014') + '</div><div class="stat-lbl">Temp</div></div>'
      + '<div class="stat"><div class="stat-val">' + (s.preinfusion ? s.preinfusion+'s' : '\u2014') + '</div><div class="stat-lbl">Pre-inf</div></div>'
      + '<div class="stat"><div class="stat-val">' + (s.daysOffRoast!=null ? s.daysOffRoast+'d' : '\u2014') + '</div><div class="stat-lbl">Off roast</div></div>'
      + '</div>'
      + (s.notes ? '<div class="shot-note">' + s.notes + '</div>' : '')
      + '</div>';
  }).join('');

  el.insertAdjacentHTML('beforeend', html);
  _myShotsShown = end;

  if (_myShotsShown < _myShotsFiltered.length) {
    var remaining = _myShotsFiltered.length - _myShotsShown;
    el.insertAdjacentHTML('beforeend',
      '<button id="myshots-load-more" class="load-more-btn" onclick="_renderMoreMyShots()">Show more (' + remaining + ' remaining)</button>'
    );
  }
}
