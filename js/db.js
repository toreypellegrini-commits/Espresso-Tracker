// ─── Dialed — Database Layer ───
// Supabase CRUD helpers and data loading.
// Loads after config.js, state.js, utils.js.

async function loadUserData() {
  setDbStatus('saving', 'Loading…');
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
  try {
    const [sR, rR, gR] = await Promise.race([
      Promise.all([
        sb.from('shots').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        sb.from('roast_library').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
        sb.from('grinders').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true })
      ]),
      timeout.then(() => { throw new Error('timeout'); })
    ]);
    shots = (sR.data || []).map(r => ({ ...r.data, _db_id: r.id }));
    roastLib = (rR.data || []).map(r => ({ ...r.data, _db_id: r.id }));
    grinderLib = (gR.data || []).map(r => ({ ...r.data, _db_id: r.id }));
    setDbStatus('ok', 'Saved');
    // Sync shot count to profile for public visibility
    syncShotCount();
  } catch (e) {
    if (e.message === 'timeout') {
      setDbStatus('error', 'Tap to retry');
      const dbLabel = document.getElementById('db-label');
      if (dbLabel) {
        dbLabel.style.cursor = 'pointer';
        dbLabel.onclick = async () => {
          dbLabel.style.cursor = '';
          dbLabel.onclick = null;
          await revalidateAndLoad();
        };
      }
    } else {
      setDbStatus('error', 'Load error');
    }
  }
}

// Re-validates the Supabase session then reloads data
// Called on visibility change (return from background) and pull-to-refresh
async function revalidateAndLoad() {
  setDbStatus('saving', 'Reconnecting…');
  try {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error || !session) {
      setDbStatus('error', 'Session expired');
      setTimeout(() => sb.auth.signOut(), 1500);
      return false;
    }
    currentUser = session.user;
    await loadUserData();
    return true;
  } catch (e) {
    setDbStatus('error', 'No connection');
    return false;
  }
}

async function dbInsert(table, data) {
  const { data: row, error } = await sb.from(table).insert({ user_id: currentUser.id, data }).select().single();
  if (error) throw error;
  return row;
}

async function dbUpdate(table, dbId, data) {
  const { error } = await sb.from(table).update({ data }).eq('id', dbId).eq('user_id', currentUser.id);
  if (error) throw error;
}

async function dbDelete(table, dbId) {
  const { error } = await sb.from(table).delete().eq('id', dbId).eq('user_id', currentUser.id);
  if (error) throw error;
}

function setDbStatus(state, label) {
  const dot = document.getElementById('db-dot');
  if (dot) {
    dot.className = 'db-dot ' + state;
    document.getElementById('db-label').textContent = label;
  }
}

// Sync shot count to profiles table so other users can see accurate rank
async function syncShotCount() {
  if (!currentUser) return;
  try {
    await sb.from('profiles').upsert(
      { id: currentUser.id, shot_count: shots.length, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  } catch (e) {
    // Non-critical — don't surface this error to the user
    console.log('Shot count sync failed:', e.message);
  }
}
