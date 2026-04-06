// ─── Dialed — Profile ───
// Profile load, save, avatar, form population.
// Loads after router.js.

// ─── PROFILE ───

async function loadProfile() {
  if (!currentUser) return;
  try {
    const { data, error } = await sb.from('profiles').select('*').eq('id', currentUser.id).single();
    if (data) {
      userProfile = {
        username: data.username||'',
        location: data.location||'',
        machine: data.machine||'',
        machine_other: '',
        grinder: data.grinder||'',
        coffee_prefs: data.coffee_prefs||'',
        fav_roasters: data.favorite_roasters||'',
        photo: data.photo_url||null
      };
      // Update community shots display name
      updateAvatarDisplay();
      // Re-render onboarding and greeting now that profile data is available
      if (typeof renderOnboarding === 'function') renderOnboarding();
      if (typeof renderHome === 'function' && currentPage === 'home') {
        const greetingEl = document.getElementById('home-greeting');
        if (greetingEl && userProfile.username) {
          const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
          const day = days[new Date().getDay()];
          const name = userProfile.username.charAt(0).toUpperCase() + userProfile.username.slice(1);
          greetingEl.innerHTML = `Welcome back, <em>${name}</em> — ${getTimeGreeting(day).toLowerCase()}`;
        }
      }
    }
  } catch(e) { /* no profile yet, fine */ }
}

function updateAvatarDisplay() {
  const av = document.getElementById('user-avatar');
  const lav = document.getElementById('profile-avatar-large');
  if (userProfile.photo) {
    if (av) av.innerHTML = `<img src="${userProfile.photo}" alt="">`;
    if (lav) lav.innerHTML = `<img src="${userProfile.photo}" alt="">`;
  } else {
    const initial = userProfile.username ? userProfile.username[0].toUpperCase() : (currentUser?.email||'U')[0].toUpperCase();
    if (av) av.textContent = initial;
    if (lav) lav.textContent = initial;
  }
}

function populateProfileForm() {
  setField('p-username', userProfile.username);
  setField('p-location', userProfile.location);
  setField('p-coffee-prefs', userProfile.coffee_prefs);
  setField('p-fav-roasters', userProfile.fav_roasters);
  // Machine
  const machSel = document.getElementById('p-machine');
  const knownMachines = Array.from(machSel.options).map(o=>o.value);
  if (userProfile.machine && !knownMachines.includes(userProfile.machine)) {
    machSel.value = '__other__';
    setField('p-machine-other', userProfile.machine);
    document.getElementById('machine-other-field').style.display = 'flex';
  } else {
    machSel.value = userProfile.machine||'';
  }
  // Grinder display — show all grinders from grinderLib
  const gDisplay = document.getElementById('p-grinder-display');
  if (gDisplay) {
    if (grinderLib.length) {
      gDisplay.innerHTML = grinderLib.map(gr => `<span class="chip">${gr.name}</span>`).join(' ') +
        ` <a href="#" onclick="event.preventDefault();navTo('grinders');" style="font-size:12px;color:var(--accent);margin-left:4px;">Manage</a>`;
    } else {
      gDisplay.innerHTML = `<span style="color:var(--muted);font-size:13px;">None added yet.</span> <a href="#" onclick="event.preventDefault();navTo('grinders');" style="font-size:12px;color:var(--accent);">Add grinder</a>`;
    }
  }
  updateAvatarDisplay();
}

document.getElementById('p-machine').addEventListener('change', function() {
  document.getElementById('machine-other-field').style.display = this.value==='__other__' ? 'flex' : 'none';
});

function handleProfilePhoto(input) {
  const file = input.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    userProfile.photo = e.target.result;
    updateAvatarDisplay();
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  const btn = document.getElementById('profile-save-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  const machSel = document.getElementById('p-machine');
  const machine = machSel.value === '__other__' ? g('p-machine-other') : machSel.value;
  const username = g('p-username')||null;
  const location = g('p-location')||null;
  // Grinder is managed on the grinders page — save the first grinder name for profile display
  const grinderName = grinderLib.length ? grinderLib[0].name : (userProfile.grinder || null);
  const fields = {
    location,
    machine: machine||null,
    grinder: grinderName||null,
    coffee_prefs: g('p-coffee-prefs')||null,
    favorite_roasters: g('p-fav-roasters')||null,
    photo_url: userProfile.photo||null,
    updated_at: new Date().toISOString()
  };
  if (username) fields.username = username;
  try {
    // Check if row already exists
    const { data: existing } = await sb.from('profiles').select('id').eq('id', currentUser.id).maybeSingle();
    let res;
    if (existing) {
      res = await sb.from('profiles').update(fields).eq('id', currentUser.id);
    } else {
      res = await sb.from('profiles').insert({ id: currentUser.id, ...fields });
    }
    if (res.error) {
      console.error('Profile save error:', res.error);
      flash('profile-save-msg', 'Error: ' + (res.error.message || res.error.code || 'unknown'), 'danger');
    } else {
      userProfile.username = username||'';
      userProfile.location = location||'';
      userProfile.machine = machine||'';
      userProfile.grinder = grinderName||'';
      userProfile.coffee_prefs = fields.coffee_prefs||'';
      userProfile.fav_roasters = fields.favorite_roasters||'';
      updateAvatarDisplay();
      flash('profile-save-msg', 'Profile saved!', 'success');
    }
  } catch(e) {
    console.error('Profile save exception:', e);
    flash('profile-save-msg', 'Error: ' + (e.message||'unknown'), 'danger');
  }
  btn.disabled = false; btn.textContent = 'Save profile';
}



