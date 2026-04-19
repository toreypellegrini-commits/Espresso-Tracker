// ─── Dialed — Community ───
// Community shots: publish, load, render, server-side filters + pagination.
// Loads after router.js.

const COMM_PAGE_SIZE = 10;
let _communityLoaded = false;
let _commHasMore = true;       // whether there are more pages to fetch
let _commLoading = false;       // prevent concurrent fetches

// ─── PUBLISH ───
async function publishCommunityShot(shot,grinderName){
  if(!shot||!grinderName||shot.rating<SHARE_MIN_RATING)return;
  try{
    const{data,error}=await sb.from('community_shots').insert({
      user_id:currentUser.id,grinder_name:grinderName,
      roaster:shot.roaster||null,
      roast_name:shot.roastName||null,
      origin:shot.origin||null,
      varietal:shot.varietal||null,
      coffee:[shot.roaster,shot.roastName,shot.origin,shot.varietal].filter(Boolean).join(' · '),
      process:shot.process||null,roast:shot.roast||null,
      days_off_roast:shot.daysOffRoast!=null?parseInt(shot.daysOffRoast):null,
      grind:shot.grind||null,
      dose:shot.dose?parseFloat(shot.dose):null,
      yield_g:shot.yield?parseFloat(shot.yield):null,
      ratio:shot.ratio?parseFloat(shot.ratio):null,
      temp:shot.temp||null,time_s:shot.time||null,
      rating:parseInt(shot.rating),
      extraction_date:shot.date?.slice(0,10)||todayStr()
    }).select().single();
    if(error)throw error;
    if(data)communityShots.unshift(data);
    myCommunityCount++;
    console.log('Community shot published successfully');
  }catch(e){console.error('Community shot publish failed:',e.message,e);}
}

// ─── SERVER-SIDE FETCH WITH FILTERS ───
// Builds a Supabase query from the current filter UI state, fetches one page.
async function _fetchCommunityPage(offset) {
  const search = document.getElementById('cf-search').value.trim().toLowerCase();
  const grinder = document.getElementById('cf-grinder').value;
  const process = document.getElementById('cf-process').value;
  const roast = document.getElementById('cf-roast').value;
  const minRating = +document.getElementById('cf-rating').value || 0;
  const sortVal = document.getElementById('cf-sort').value;

  let q = sb.from('community_shots').select('*');

  // Filters
  if (search) q = q.ilike('coffee', '%' + search + '%');
  if (grinder) q = q.eq('grinder_name', grinder);
  if (process) q = q.eq('process', process);
  if (roast) q = q.eq('roast', roast);
  if (minRating) q = q.gte('rating', minRating);

  // Sort
  if (sortVal === 'date-asc') q = q.order('created_at', { ascending: true });
  else if (sortVal === 'rating-desc') q = q.order('rating', { ascending: false }).order('created_at', { ascending: false });
  else q = q.order('created_at', { ascending: false }); // default: date-desc

  // Pagination
  q = q.range(offset, offset + COMM_PAGE_SIZE - 1);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

// Fetch profile data for a batch of shots (only for new user_ids)
async function _fetchProfilesForShots(newShots) {
  const newIds = [...new Set(newShots.map(s => s.user_id).filter(id => id && !profileCache[id]))];
  if (!newIds.length) return;
  const { data: profiles } = await sb.from('profiles').select('id,username,photo_url').in('id', newIds);
  (profiles || []).forEach(p => { profileCache[p.id] = { username: p.username || '', photo: p.photo_url || null }; });
}

// ─── LAZY LOADER ───
async function ensureCommunityLoaded() {
  if (!_communityLoaded) {
    await _loadGrinderFilterOptions();
    _communityLoaded = true;
  }
  // Always reset and fetch fresh when entering the tab (filters may have changed)
  await _resetAndFetchCommunity();
}

// Fetch distinct grinder names for the filter dropdown (lightweight query)
async function _loadGrinderFilterOptions() {
  try {
    const { data } = await sb.from('community_shots').select('grinder_name');
    const grinders = [...new Set((data || []).map(r => r.grinder_name).filter(Boolean))].sort();
    const sel = document.getElementById('cf-grinder');
    sel.innerHTML = '<option value="">All grinders</option>' + grinders.map(g => `<option value="${g}">${g}</option>`).join('');
  } catch (e) { /* grinder filter just stays empty */ }
}

function populateCommunityGrinderFilter() {
  // No-op now — grinder filter is populated from server in _loadGrinderFilterOptions
}

// ─── RENDER ───
async function _resetAndFetchCommunity() {
  communityShots = [];
  _commHasMore = true;
  const el = document.getElementById('community-list');
  el.innerHTML = '<div class="empty">Loading community shots…</div>';
  await _loadMoreCommunity(true);
}

async function _loadMoreCommunity(isReset) {
  if (_commLoading || !_commHasMore) return;
  _commLoading = true;

  try {
    const offset = isReset ? 0 : communityShots.length;
    const page = await _fetchCommunityPage(offset);
    await _fetchProfilesForShots(page);

    if (isReset) {
      communityShots = page;
    } else {
      communityShots.push(...page);
    }

    if (page.length < COMM_PAGE_SIZE) _commHasMore = false;
    _renderCommunityList();
  } catch (e) {
    console.error('Community fetch error:', e.message);
    const el = document.getElementById('community-list');
    if (!communityShots.length) {
      el.innerHTML = '<div class="empty">Error loading community shots.</div>';
    }
  }
  _commLoading = false;
}

function _renderCommunityList() {
  const el = document.getElementById('community-list');
  if (!communityShots.length) {
    el.innerHTML = '<div class="empty">No community shots match these filters.</div>';
    return;
  }

  el.innerHTML = communityShots.map(s => _renderCommCard(s)).join('');

  // Remove old load-more if present, then add new one
  if (_commHasMore) {
    el.insertAdjacentHTML('beforeend',
      `<button id="comm-load-more" class="load-more-btn" onclick="_loadMoreCommunity(false)">Show more</button>`
    );
  }
}

function _renderCommCard(s) {
  const isMe = s.user_id === currentUser?.id;
  const profile = profileCache[s.user_id] || {};
  const username = isMe ? (userProfile.username || profile.username || '') : profile.username || '';

  let roaster = s.roaster, roastName = s.roast_name, origin = s.origin, varietal = s.varietal;
  if (!roaster && s.coffee) {
    const parts = s.coffee.split(' · ');
    roaster = parts[0] || null;
    roastName = parts[1] || null;
    origin = parts[2] || null;
    varietal = parts[3] || null;
  }

  const title = roastName ? (roaster ? roaster + ' · ' + roastName : roastName) : (roaster || 'Unknown coffee');
  const chipsArr = [origin, varietal, s.process, s.roast].filter(Boolean);
  const chips = chipsArr.map(c => `<span class="chip">${c}</span>`).join('');

  const metaParts = [];
  if (s.extraction_date) metaParts.push(fmtDate(s.extraction_date + 'T12:00:00'));
  if (s.rating) metaParts.push(starsHTML(s.rating));
  if (s.grinder_name) metaParts.push(s.grinder_name);
  const metaLine = metaParts.join(' · ');

  const userByline = username
    ? `<div class="comm-user-byline" onclick="openProfileSheet('${s.user_id}')"><span class="comm-user-handle${isMe ? ' mine' : ''}">@${username}</span>${isMe ? '<span class="comm-user-you"> (you)</span>' : ''}</div>`
    : (isMe ? `<div class="comm-user-byline"><span class="comm-user-handle mine">you</span></div>` : '');

  const ratioVal = s.ratio ? parseFloat(s.ratio).toFixed(2) : (s.dose && s.yield_g ? (s.yield_g / s.dose).toFixed(2) : null);
  const params = [
    s.grind ? `Grind ${s.grind}` : null,
    ratioVal ? `1:${ratioVal}` : null,
    s.temp ? fmtTemp(s.temp) : null,
    s.time_s ? `${s.time_s}s` : null,
    s.days_off_roast != null ? `${s.days_off_roast}d off roast` : null
  ].filter(Boolean).join(' · ');

  return `<div class="shot-card">
    <div class="shot-card-header">
      <div style="min-width:0;flex:1;">
        <div class="shot-date" style="font-family:var(--font-serif);font-size:15px;">${title}</div>
        <div class="shot-meta">${metaLine}</div>
      </div>
      ${isMe ? `<button class="delete-btn" onclick="deleteCommunityShot('${s.id}')" title="Remove from community">✕</button>` : ''}
    </div>
    ${userByline}
    ${chips ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${chips}</div>` : ''}
    <div class="comm-params" style="color:var(--muted);">${params}</div>
  </div>`;
}

// Called by filter/sort dropdowns — re-fetches from server with new params
function renderCommunity() {
  _resetAndFetchCommunity();
}

// ─── PUBLIC PROFILE SHEET ───
async function openProfileSheet(userId) {
  document.getElementById('profile-sheet-backdrop').classList.add('open');
  document.getElementById('profile-sheet').classList.add('open');
  document.getElementById('profile-sheet-content').innerHTML = '<div class="empty" style="padding:2rem;">Loading…</div>';

  try {
    const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();

    const { count: communityCount } = await sb.from('community_shots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const isMe = userId === currentUser?.id;
    const totalShots = isMe ? shots.length : (profile?.shot_count || 0);

    const p = profile || {};
    const username = isMe ? (userProfile.username || p.username || '') : (p.username || '');
    const photo = isMe ? (userProfile.photo || p.photo_url) : p.photo_url;
    const machine = isMe ? (userProfile.machine || p.machine || '') : (p.machine || '');
    const grinder = isMe ? (userProfile.grinder || p.grinder || '') : (p.grinder || '');
    const coffeePrefs = isMe ? (userProfile.coffee_prefs || p.coffee_prefs || '') : (p.coffee_prefs || '');
    const favRoasters = isMe ? (userProfile.fav_roasters || p.favorite_roasters || '') : (p.favorite_roasters || '');
    const memberSince = p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

    const avatarInitial = username ? username[0].toUpperCase() : '?';
    const avatarHTML = photo
      ? `<div class="pub-profile-avatar"><img src="${photo}" alt="${username}"></div>`
      : `<div class="pub-profile-avatar">${avatarInitial}</div>`;

    let favRoaster = null;
    if (isMe) {
      const roasterCounts = {};
      shots.forEach(s => {
        if (s.roaster) roasterCounts[s.roaster] = (roasterCounts[s.roaster] || 0) + 1;
      });
      favRoaster = Object.entries(roasterCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    } else {
      favRoaster = p.top_roaster || null;
    }

    const pubRank = getRank(totalShots);
    document.getElementById('profile-sheet-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:1.25rem;">
        ${avatarHTML}
        <div>
          <div class="pub-profile-username">${username ? '@' + username : 'Anonymous'}</div>
          ${memberSince ? `<div style="font-size:12px;color:var(--muted);margin-top:3px;">Member since ${memberSince}</div>` : ''}
        </div>
        ${isMe ? `<button class="btn" style="margin-left:auto;font-size:12px;padding:6px 12px;" onclick="closeProfileSheet();navTo('profile');">Edit profile</button>` : ''}
      </div>
      <div id="pub-profile-rank" style="text-align:center;margin-bottom:1rem;"></div>
      <div style="text-align:center;margin-bottom:1rem;"><span class="rank-badge"><span class="rank-badge-icon">${pubRank.icon}</span>${pubRank.name}</span></div>
      <div class="pub-stat-row">
        <div class="pub-stat">
          <div class="pub-stat-val">${communityCount || 0}</div>
          <div class="pub-stat-lbl">Shared shots</div>
        </div>
        <div class="pub-stat"><div class="pub-stat-val">${totalShots}</div><div class="pub-stat-lbl">Total shots</div></div>
        ${favRoaster ? `<div class="pub-stat"><div class="pub-stat-val" style="font-size:13px;padding-top:4px;">${favRoaster}</div><div class="pub-stat-lbl">Top roaster</div></div>` : ''}
      </div>
      ${machine || grinder ? `<div class="pub-profile-row"><span class="pub-profile-label">Setup</span><span class="pub-profile-val">${[machine, grinder].filter(Boolean).join(' · ')}</span></div>` : ''}
      ${coffeePrefs ? `<div class="pub-profile-row"><span class="pub-profile-label">Preferences</span><span class="pub-profile-val">${coffeePrefs}</span></div>` : ''}
      ${favRoasters ? `<div class="pub-profile-row"><span class="pub-profile-label">Fav roasters</span><span class="pub-profile-val">${favRoasters}</span></div>` : ''}
      ${!machine && !grinder && !coffeePrefs && !favRoasters ? `<div style="font-size:13px;color:var(--muted);text-align:center;padding:1rem 0;">This user hasn't filled in their profile yet.</div>` : ''}
    `;
  } catch (e) {
    document.getElementById('profile-sheet-content').innerHTML = '<div class="empty" style="padding:2rem;">Could not load profile.</div>';
  }
}

async function deleteCommunityShot(id) {
  if (!confirm('Remove this shot from the community?')) return;
  try {
    const { error } = await sb.from('community_shots').delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) throw error;
    communityShots = communityShots.filter(s => s.id !== id);
    _renderCommunityList();
  } catch (e) {
    console.error('Delete community shot failed:', e.message);
  }
}

function closeProfileSheet() {
  document.getElementById('profile-sheet-backdrop').classList.remove('open');
  document.getElementById('profile-sheet').classList.remove('open');
}
