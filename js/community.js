// ─── Dialed — Community ───
// Community shots: publish, load, render, server-side filters + pagination.
// Loads after router.js.

var COMM_PAGE_SIZE = 10;
var _communityLoaded = false;
var _commHasMore = true;
var _commLoading = false;

// ─── PUBLISH ───
async function publishCommunityShot(shot,grinderName){
  if(!shot||!grinderName||shot.rating<SHARE_MIN_RATING)return;
  try{
    var ins = {
      user_id:currentUser.id,grinder_name:grinderName,
      roaster:shot.roaster||null,
      roast_name:shot.roastName||null,
      origin:shot.origin||null,
      varietal:shot.varietal||null,
      coffee:[shot.roaster,shot.roastName,shot.origin,shot.varietal].filter(Boolean).join(' \u00b7 '),
      process:shot.process||null,roast:shot.roast||null,
      days_off_roast:shot.daysOffRoast!=null?parseInt(shot.daysOffRoast):null,
      grind:shot.grind||null,
      dose:shot.dose?parseFloat(shot.dose):null,
      yield_g:shot.yield?parseFloat(shot.yield):null,
      ratio:shot.ratio?parseFloat(shot.ratio):null,
      temp:shot.temp||null,time_s:shot.time||null,
      rating:parseInt(shot.rating),
      extraction_date:shot.date?.slice(0,10)||todayStr()
    };
    var res = await sb.from('community_shots').insert(ins).select().single();
    if(res.error)throw res.error;
    if(res.data)communityShots.unshift(res.data);
    myCommunityCount++;
    console.log('Community shot published successfully');
  }catch(e){console.error('Community shot publish failed:',e.message,e);}
}

// ─── SERVER-SIDE FETCH WITH FILTERS ───
async function _fetchCommunityPage(offset) {
  var search = document.getElementById('cf-search').value.trim().toLowerCase();
  var grinder = document.getElementById('cf-grinder').value;
  var process = document.getElementById('cf-process').value;
  var roast = document.getElementById('cf-roast').value;
  var varietal = document.getElementById('cf-varietal').value;
  var minRating = +document.getElementById('cf-rating').value || 0;

  var q = sb.from('community_shots').select('*');

  if (search) q = q.ilike('coffee', '%' + search + '%');
  if (grinder) q = q.eq('grinder_name', grinder);
  if (process) q = q.eq('process', process);
  if (roast) q = q.eq('roast', roast);
  if (varietal) q = q.eq('varietal', varietal);
  if (minRating) q = q.gte('rating', minRating);

  // Always newest first
  q = q.order('created_at', { ascending: false });
  q = q.range(offset, offset + COMM_PAGE_SIZE - 1);

  var result = await q;
  if (result.error) throw result.error;
  return result.data || [];
}

async function _fetchProfilesForShots(newShots) {
  var newIds = [];
  var seen = {};
  newShots.forEach(function(s) {
    if (s.user_id && !profileCache[s.user_id] && !seen[s.user_id]) {
      seen[s.user_id] = true;
      newIds.push(s.user_id);
    }
  });
  if (!newIds.length) return;
  var res = await sb.from('profiles').select('id,username,photo_url').in('id', newIds);
  (res.data || []).forEach(function(p) { profileCache[p.id] = { username: p.username || '', photo: p.photo_url || null }; });
}

// ─── LAZY LOADER ───
async function ensureCommunityLoaded() {
  if (!_communityLoaded) {
    _communityLoaded = true;
  }
  await _resetAndFetchCommunity();
}

function populateCommunityGrinderFilter() {
  // No-op — grinder filter is inside the modal now
}

// ─── RENDER ───
async function _resetAndFetchCommunity() {
  communityShots = [];
  _commHasMore = true;
  var el = document.getElementById('community-list');
  el.innerHTML = '<div class="empty">Loading community shots\u2026</div>';
  await _loadMoreCommunity(true);
}

async function _loadMoreCommunity(isReset) {
  if (_commLoading || !_commHasMore) return;
  _commLoading = true;
  try {
    var offset = isReset ? 0 : communityShots.length;
    var page = await _fetchCommunityPage(offset);
    await _fetchProfilesForShots(page);
    if (isReset) communityShots = page;
    else communityShots = communityShots.concat(page);
    if (page.length < COMM_PAGE_SIZE) _commHasMore = false;
    _renderCommunityList();
  } catch (e) {
    console.error('Community fetch error:', e.message);
    var el = document.getElementById('community-list');
    if (!communityShots.length) el.innerHTML = '<div class="empty">Error loading community shots.</div>';
  }
  _commLoading = false;
}

function _renderCommunityList() {
  var el = document.getElementById('community-list');
  if (!communityShots.length) {
    el.innerHTML = '<div class="empty">No community shots match these filters.</div>';
    return;
  }
  el.innerHTML = communityShots.map(function(s) { return _renderCommCard(s); }).join('');
  if (_commHasMore) {
    el.insertAdjacentHTML('beforeend',
      '<button id="comm-load-more" class="load-more-btn" onclick="_loadMoreCommunity(false)">Show more</button>'
    );
  }
}

function _renderCommCard(s) {
  var isMe = s.user_id === (currentUser ? currentUser.id : null);
  var profile = profileCache[s.user_id] || {};
  var username = isMe ? (userProfile.username || profile.username || '') : profile.username || '';

  var roaster = s.roaster, roastName = s.roast_name, origin = s.origin, varietal = s.varietal;
  if (!roaster && s.coffee) {
    var parts = s.coffee.split(' \u00b7 ');
    roaster = parts[0] || null;
    roastName = parts[1] || null;
    origin = parts[2] || null;
    varietal = parts[3] || null;
  }

  var title = roastName ? (roaster ? roaster + ' \u00b7 ' + roastName : roastName) : (roaster || 'Unknown coffee');
  var chipsArr = [origin, varietal, s.process, s.roast].filter(Boolean);
  var chips = chipsArr.map(function(c) { return '<span class="chip">' + c + '</span>'; }).join('');

  var metaParts = [];
  if (s.extraction_date) metaParts.push(fmtDate(s.extraction_date + 'T12:00:00'));
  if (s.rating) metaParts.push(starsHTML(s.rating));
  if (s.grinder_name) metaParts.push(s.grinder_name);
  var metaLine = metaParts.join(' \u00b7 ');

  var userByline = username
    ? '<div class="comm-user-byline" onclick="openProfileSheet(\'' + s.user_id + '\')"><span class="comm-user-handle' + (isMe ? ' mine' : '') + '">@' + username + '</span>' + (isMe ? '<span class="comm-user-you"> (you)</span>' : '') + '</div>'
    : (isMe ? '<div class="comm-user-byline"><span class="comm-user-handle mine">you</span></div>' : '');

  var ratioVal = s.ratio ? parseFloat(s.ratio).toFixed(2) : (s.dose && s.yield_g ? (s.yield_g / s.dose).toFixed(2) : null);
  var params = [
    s.grind ? 'Grind ' + s.grind : null,
    ratioVal ? '1:' + ratioVal : null,
    s.temp ? fmtTemp(s.temp) : null,
    s.time_s ? s.time_s + 's' : null,
    s.days_off_roast != null ? s.days_off_roast + 'd off roast' : null
  ].filter(Boolean).join(' \u00b7 ');

  return '<div class="shot-card">'
    + '<div class="shot-card-header"><div style="min-width:0;flex:1;">'
    + '<div class="shot-date" style="font-family:var(--font-serif);font-size:15px;">' + title + '</div>'
    + '<div class="shot-meta">' + metaLine + '</div>'
    + '</div>'
    + (isMe ? '<button class="delete-btn" onclick="deleteCommunityShot(\'' + s.id + '\')" title="Remove from community">\u2715</button>' : '')
    + '</div>'
    + userByline
    + (chips ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">' + chips + '</div>' : '')
    + '<div class="comm-params" style="color:var(--muted);">' + params + '</div>'
    + '</div>';
}

function renderCommunity() {
  _resetAndFetchCommunity();
}

// ─── PUBLIC PROFILE SHEET ───
async function openProfileSheet(userId) {
  document.getElementById('profile-sheet-backdrop').classList.add('open');
  document.getElementById('profile-sheet').classList.add('open');
  document.getElementById('profile-sheet-content').innerHTML = '<div class="empty" style="padding:2rem;">Loading\u2026</div>';

  try {
    var profileRes = await sb.from('profiles').select('*').eq('id', userId).single();
    var countRes = await sb.from('community_shots').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    var isMe = userId === (currentUser ? currentUser.id : null);
    var totalShots = isMe ? shots.length : ((profileRes.data || {}).shot_count || 0);

    var p = profileRes.data || {};
    var username = isMe ? (userProfile.username || p.username || '') : (p.username || '');
    var photo = isMe ? (userProfile.photo || p.photo_url) : p.photo_url;
    var machine = isMe ? (userProfile.machine || p.machine || '') : (p.machine || '');
    var grinder = isMe ? (userProfile.grinder || p.grinder || '') : (p.grinder || '');
    var coffeePrefs = isMe ? (userProfile.coffee_prefs || p.coffee_prefs || '') : (p.coffee_prefs || '');
    var favRoasters = isMe ? (userProfile.fav_roasters || p.favorite_roasters || '') : (p.favorite_roasters || '');
    var memberSince = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

    var avatarInitial = username ? username[0].toUpperCase() : '?';
    var avatarHTML = photo
      ? '<div class="pub-profile-avatar"><img src="' + photo + '" alt="' + username + '"></div>'
      : '<div class="pub-profile-avatar">' + avatarInitial + '</div>';

    var favRoaster = null;
    if (isMe) {
      var roasterCounts = {};
      shots.forEach(function(s) { if (s.roaster) roasterCounts[s.roaster] = (roasterCounts[s.roaster]||0) + 1; });
      var sorted = Object.entries(roasterCounts).sort(function(a,b){return b[1]-a[1];});
      favRoaster = sorted.length ? sorted[0][0] : null;
    } else {
      favRoaster = p.top_roaster || null;
    }

    var pubRank = getRank(totalShots);
    var communityCount = countRes.count || 0;
    document.getElementById('profile-sheet-content').innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:1.25rem;">'
      + avatarHTML
      + '<div>'
      + '<div class="pub-profile-username">' + (username ? '@' + username : 'Anonymous') + '</div>'
      + (memberSince ? '<div style="font-size:12px;color:var(--muted);margin-top:3px;">Member since ' + memberSince + '</div>' : '')
      + '</div>'
      + (isMe ? '<button class="btn" style="margin-left:auto;font-size:12px;padding:6px 12px;" onclick="closeProfileSheet();navTo(\'profile\');">Edit profile</button>' : '')
      + '</div>'
      + '<div id="pub-profile-rank" style="text-align:center;margin-bottom:1rem;"></div>'
      + '<div style="text-align:center;margin-bottom:1rem;"><span class="rank-badge"><span class="rank-badge-icon">' + pubRank.icon + '</span>' + pubRank.name + '</span></div>'
      + '<div class="pub-stat-row">'
      + '<div class="pub-stat"><div class="pub-stat-val">' + communityCount + '</div><div class="pub-stat-lbl">Shared shots</div></div>'
      + '<div class="pub-stat"><div class="pub-stat-val">' + totalShots + '</div><div class="pub-stat-lbl">Total shots</div></div>'
      + (favRoaster ? '<div class="pub-stat"><div class="pub-stat-val" style="font-size:13px;padding-top:4px;">' + favRoaster + '</div><div class="pub-stat-lbl">Top roaster</div></div>' : '')
      + '</div>'
      + (machine||grinder ? '<div class="pub-profile-row"><span class="pub-profile-label">Setup</span><span class="pub-profile-val">' + [machine,grinder].filter(Boolean).join(' \u00b7 ') + '</span></div>' : '')
      + (coffeePrefs ? '<div class="pub-profile-row"><span class="pub-profile-label">Preferences</span><span class="pub-profile-val">' + coffeePrefs + '</span></div>' : '')
      + (favRoasters ? '<div class="pub-profile-row"><span class="pub-profile-label">Fav roasters</span><span class="pub-profile-val">' + favRoasters + '</span></div>' : '')
      + (!machine&&!grinder&&!coffeePrefs&&!favRoasters ? '<div style="font-size:13px;color:var(--muted);text-align:center;padding:1rem 0;">This user hasn\'t filled in their profile yet.</div>' : '');
  } catch (e) {
    document.getElementById('profile-sheet-content').innerHTML = '<div class="empty" style="padding:2rem;">Could not load profile.</div>';
  }
}

async function deleteCommunityShot(id) {
  if (!confirm('Remove this shot from the community?')) return;
  try {
    var res = await sb.from('community_shots').delete().eq('id', id).eq('user_id', currentUser.id);
    if (res.error) throw res.error;
    communityShots = communityShots.filter(function(s) { return s.id !== id; });
    _renderCommunityList();
  } catch (e) {
    console.error('Delete community shot failed:', e.message);
  }
}

function closeProfileSheet() {
  document.getElementById('profile-sheet-backdrop').classList.remove('open');
  document.getElementById('profile-sheet').classList.remove('open');
}
