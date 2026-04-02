// ─── Dialed — Auth ───
// Supabase authentication: sign in, sign up, sign out, session management.
// Loads after config.js, state.js, utils.js, db.js.

async function initAuth() {
  // Check if we're returning from an OAuth redirect (hash contains tokens)
  const isOAuthRedirect = window.location.hash && window.location.hash.includes('access_token');

  // Get current session
  const { data: { session } } = await sb.auth.getSession();

  // Clean up OAuth tokens from URL hash so they don't interfere with future sign-ins
  if (isOAuthRedirect) {
    history.replaceState(null, '', window.location.pathname);
  }

  if (session) {
    currentUser = session.user;
    await loadUserData();
    showApp();
  } else if (!isOAuthRedirect) {
    // Only show auth screen if we're NOT in the middle of an OAuth redirect.
    // If we are, onAuthStateChange will fire SIGNED_IN momentarily.
    showAuthScreen();
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await loadUserData();
      showApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      shots = [];
      roastLib = [];
      grinderLib = [];
      showAuthScreen();
    }
  });
}

function showAuthScreen() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'block';
  document.getElementById('main-app').style.display = 'none';
}

function showApp() {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
  const av = document.getElementById('user-avatar');
  if (currentUser?.user_metadata?.avatar_url) av.innerHTML = `<img src="${currentUser.user_metadata.avatar_url}" alt="">`;
  else av.textContent = (currentUser?.email || 'U')[0].toUpperCase();
  document.getElementById('drawer-user').textContent = currentUser?.email || '';
  loadProfile();
  initExtractionDate(); populateRoastDropdown(); populateGrinderDropdown();
  renderHome();
  setTimeout(computeAchievements, 1000);
}

async function signInWithGoogle() {
  showAuthMsg('Redirecting to Google…', 'info');
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
  if (error) showAuthMsg(error.message, 'error');
}

function toggleAuthMode() {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  document.getElementById('auth-submit-btn').textContent = authMode === 'signin' ? 'Sign in' : 'Create account';
  document.getElementById('auth-mode-toggle').innerHTML = authMode === 'signin'
    ? `Don't have an account? <a onclick="toggleAuthMode()">Create one</a>`
    : `Already have an account? <a onclick="toggleAuthMode()">Sign in</a>`;
  document.getElementById('confirm-group').style.display = authMode === 'signup' ? 'flex' : 'none';
  hideAuthMsg();
}

async function submitAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { showAuthMsg('Please enter your email and password.', 'error'); return; }
  const btn = document.getElementById('auth-submit-btn');
  btn.disabled = true;
  btn.textContent = '…';
  if (authMode === 'signup') {
    const confirm = document.getElementById('auth-confirm').value;
    if (password !== confirm) { showAuthMsg('Passwords do not match.', 'error'); btn.disabled = false; btn.textContent = 'Create account'; return; }
    const { error } = await sb.auth.signUp({ email, password });
    if (error) { showAuthMsg(error.message, 'error'); btn.disabled = false; btn.textContent = 'Create account'; }
    else showAuthMsg('Check your email to confirm your account, then sign in.', 'success');
  } else {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) { showAuthMsg(error.message, 'error'); btn.disabled = false; btn.textContent = 'Sign in'; }
  }
}

async function sendPasswordReset() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) { showAuthMsg('Enter your email above first.', 'error'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  if (error) showAuthMsg(error.message, 'error');
  else showAuthMsg('Password reset email sent.', 'success');
}

async function signOut() {
  await sb.auth.signOut();
}

function showAuthMsg(msg, type) {
  const el = document.getElementById('auth-msg');
  el.className = `auth-msg ${type}`;
  el.textContent = msg;
}

function hideAuthMsg() {
  const el = document.getElementById('auth-msg');
  el.className = 'auth-msg';
  el.textContent = '';
}
