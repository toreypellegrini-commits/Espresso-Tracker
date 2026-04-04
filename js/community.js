// ─── Dialed — Community ───
// Community shots: publish, load, render, filters, public profile sheet.
// Loads after router.js.

// ─── COMMUNITY SHOTS ───
async function publishCommunityShot(shot,grinderName){
  if(!shot||!grinderName||shot.rating<SHARE_MIN_RATING)return;
  try{
    await sb.from('community_shots').insert({
      user_id:currentUser.id,grinder_name:grinderName,
      coffee:[shot.roaster,shot.origin,shot.varietal].filter(Boolean).join(' · '),
      process:shot.process||null,roast:shot.roast||null,
      days_off_roast:shot.daysOffRoast!=null?parseInt(shot.daysOffRoast):null,
      grind:shot.grind||null,
      dose:shot.dose?parseFloat(shot.dose):null,
      yield_g:shot.yield?parseFloat(shot.yield):null,
      ratio:shot.ratio?parseFloat(shot.ratio):null,
      temp:shot.temp||null,time_s:shot.time||null,
      rating:parseInt(shot.rating),
      extraction_date:shot.date?.slice(0,10)||todayStr()
    });
    console.log('Community shot published successfully');
  }catch(e){console.error('Community shot publish failed:',e.message,e);}
}

// Cache of user_id → profile data for username display

async function loadCommunityShots(){
  try{
    const{data,error}=await sb.from('community_shots').select('*').order('created_at',{ascending:false}).limit(500);
    if(error)throw error;
    communityShots=data||[];
    // Fetch usernames for all unique user_ids
    const userIds=[...new Set(communityShots.map(s=>s.user_id).filter(Boolean))];
    if(userIds.length){
      const{data:profiles}=await sb.from('profiles').select('id,username,photo_url').in('id',userIds);
      (profiles||[]).forEach(p=>{ profileCache[p.id]={username:p.username||'',photo:p.photo_url||null}; });
    }
  }
  catch(e){communityShots=[];}
}

// ─── COMMUNITY SHOTS ───
function populateCommunityGrinderFilter(){const sel=document.getElementById('cf-grinder');const grinders=[...new Set(communityShots.map(s=>s.grinder_name).filter(Boolean))].sort();sel.innerHTML='<option value="">All grinders</option>'+grinders.map(g=>`<option value="${g}">${g}</option>`).join('');}

function renderCommunity(){
  const search=document.getElementById('cf-search').value.toLowerCase();
  const grinder=document.getElementById('cf-grinder').value;
  const process=document.getElementById('cf-process').value;
  const roast=document.getElementById('cf-roast').value;
  const minRating=+document.getElementById('cf-rating').value||0;
  const sortVal=document.getElementById('cf-sort').value;
  let filtered=communityShots.filter(s=>{
    const text=(s.coffee||'').toLowerCase();
    if(search&&!text.includes(search))return false;
    if(grinder&&s.grinder_name!==grinder)return false;
    if(process&&s.process!==process)return false;
    if(roast&&s.roast!==roast)return false;
    if(minRating&&(s.rating||0)<minRating)return false;
    return true;
  });
  if(sortVal==='date-desc')filtered.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  else if(sortVal==='date-asc')filtered.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
  else if(sortVal==='rating-desc')filtered.sort((a,b)=>(b.rating||0)-(a.rating||0));
  const el=document.getElementById('community-list');
  if(!filtered.length){el.innerHTML='<div class="empty">No community shots match these filters.</div>';return;}
  el.innerHTML=filtered.map(s=>{
    const isMe=s.user_id===currentUser?.id;
    const profile=profileCache[s.user_id]||{};
    const username=isMe?(userProfile.username||profile.username||''):profile.username||'';
    const params=[s.grind?`Grind ${s.grind}`:null,s.ratio?`1:${parseFloat(s.ratio).toFixed(2)}`:(s.dose&&s.yield_g?`1:${(s.yield_g/s.dose).toFixed(2)}`:null),s.temp?`${s.temp}°C`:null,s.time_s?`${s.time_s}s`:null,s.days_off_roast!=null?`${s.days_off_roast}d off roast`:null].filter(Boolean).join(' · ');
    const usernameTag=username
      ? `<span class="chip ${isMe?'mine':''}" style="font-size:10px;padding:2px 8px;cursor:pointer;-webkit-tap-highlight-color:transparent;" onclick="openProfileSheet('${s.user_id}')">${isMe?'you · ':''}@${username}</span>`
      : (isMe?`<span class="chip mine" style="font-size:10px;padding:2px 8px;">you</span>`:'');
    return`<div class="comm-card">
      <div class="comm-card-header">
        <div class="comm-coffee">${s.coffee||'Unknown coffee'}</div>
        <div class="comm-meta" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          ${s.rating?`<span class="rating-stars-sm">${'★'.repeat(s.rating)}</span>`:''}
          ${s.extraction_date?`<span>${fmtDate(s.extraction_date+'T12:00:00')}</span>`:''}
          ${usernameTag}
          ${isMe?`<button class="delete-btn" onclick="deleteCommunityShot('${s.id}')" title="Remove from community">✕</button>`:''}
        </div>
      </div>
      <div style="font-size:12px;color:var(--muted);">${s.grinder_name}${[s.process,s.roast].filter(Boolean).length?' · '+[s.process,s.roast].filter(Boolean).join(' · '):''}</div>
      <div class="comm-params" style="color:var(--muted);">${params}</div>
    </div>`;
  }).join('');
}

// ─── PUBLIC PROFILE SHEET ───
async function openProfileSheet(userId) {
  // Open sheet immediately with loading state
  document.getElementById('profile-sheet-backdrop').classList.add('open');
  document.getElementById('profile-sheet').classList.add('open');
  document.getElementById('profile-sheet-content').innerHTML = '<div class="empty" style="padding:2rem;">Loading…</div>';

  try {
    // Fetch profile
    const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();

    // Count their community shots
    const { count: communityCount } = await sb.from('community_shots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total shot count from their profile (publicly visible)
    const isMe = userId === currentUser?.id;
    const totalShots = isMe ? shots.length : (profile?.shot_count || 0);

    // Build profile display
    const p = profile || {};
    const username = isMe ? (userProfile.username || p.username || '') : (p.username || '');
    const photo = isMe ? (userProfile.photo || p.photo_url) : p.photo_url;
    const machine = isMe ? (userProfile.machine || p.machine || '') : (p.machine || '');
    const grinder = isMe ? (userProfile.grinder || p.grinder || '') : (p.grinder || '');
    const coffeePrefs = isMe ? (userProfile.coffee_prefs || p.coffee_prefs || '') : (p.coffee_prefs || '');
    const favRoasters = isMe ? (userProfile.fav_roasters || p.favorite_roasters || '') : (p.favorite_roasters || '');
    const memberSince = p.updated_at ? new Date(p.updated_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}) : null;

    // Avatar
    const avatarInitial = username ? username[0].toUpperCase() : '?';
    const avatarHTML = photo
      ? `<div class="pub-profile-avatar"><img src="${photo}" alt="${username}"></div>`
      : `<div class="pub-profile-avatar">${avatarInitial}</div>`;

    // Compute fav roaster/origin from community shots for this user
    const userShots = communityShots.filter(s => s.user_id === userId);
    const roasterCounts = {};
    userShots.forEach(s => {
      const parts = (s.coffee||'').split(' · ');
      if(parts[0]) roasterCounts[parts[0]] = (roasterCounts[parts[0]]||0) + 1;
    });
    const favRoaster = Object.entries(roasterCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

    const pubRank = getRank(totalShots);
    document.getElementById('profile-sheet-content').innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:1.25rem;">
        ${avatarHTML}
        <div>
          <div class="pub-profile-username">${username ? '@'+username : 'Anonymous'}</div>
          ${memberSince ? `<div style="font-size:12px;color:var(--muted);margin-top:3px;">Member since ${memberSince}</div>` : ''}
        </div>
        ${isMe ? `<button class="btn" style="margin-left:auto;font-size:12px;padding:6px 12px;" onclick="closeProfileSheet();navTo('profile');">Edit profile</button>` : ''}
      </div>
      <div id="pub-profile-rank" style="text-align:center;margin-bottom:1rem;"></div>
      <div style="text-align:center;margin-bottom:1rem;"><span class="rank-badge"><span class="rank-badge-icon">${pubRank.icon}</span>${pubRank.name}</span></div>
      <div class="pub-stat-row">
        <div class="pub-stat">
          <div class="pub-stat-val">${communityCount||0}</div>
          <div class="pub-stat-lbl">Shared shots</div>
        </div>
        <div class="pub-stat"><div class="pub-stat-val">${totalShots}</div><div class="pub-stat-lbl">Total shots</div></div>
        ${favRoaster ? `<div class="pub-stat"><div class="pub-stat-val" style="font-size:13px;padding-top:4px;">${favRoaster}</div><div class="pub-stat-lbl">Top roaster</div></div>` : ''}
      </div>
      ${machine||grinder ? `<div class="pub-profile-row"><span class="pub-profile-label">Setup</span><span class="pub-profile-val">${[machine,grinder].filter(Boolean).join(' · ')}</span></div>` : ''}
      ${coffeePrefs ? `<div class="pub-profile-row"><span class="pub-profile-label">Preferences</span><span class="pub-profile-val">${coffeePrefs}</span></div>` : ''}
      ${favRoasters ? `<div class="pub-profile-row"><span class="pub-profile-label">Fav roasters</span><span class="pub-profile-val">${favRoasters}</span></div>` : ''}
      ${!machine&&!grinder&&!coffeePrefs&&!favRoasters ? `<div style="font-size:13px;color:var(--muted);text-align:center;padding:1rem 0;">This user hasn't filled in their profile yet.</div>` : ''}
    `;
  } catch(e) {
    document.getElementById('profile-sheet-content').innerHTML = '<div class="empty" style="padding:2rem;">Could not load profile.</div>';
  }
}

async function deleteCommunityShot(id) {
  if (!confirm('Remove this shot from the community?')) return;
  try {
    const { error } = await sb.from('community_shots').delete().eq('id', id).eq('user_id', currentUser.id);
    if (error) throw error;
    communityShots = communityShots.filter(s => s.id !== id);
    renderCommunity();
  } catch (e) {
    console.error('Delete community shot failed:', e.message);
  }
}

function closeProfileSheet() {
  document.getElementById('profile-sheet-backdrop').classList.remove('open');
  document.getElementById('profile-sheet').classList.remove('open');
}


