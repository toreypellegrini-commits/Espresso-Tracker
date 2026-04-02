// ─── Dialed — State ───
// All mutable app-wide state lives here.
// Loads after config.js.

let currentUser = null;
let shots = [], roastLib = [], grinderLib = [], communityShots = [];
let currentRating = 0, editingRoastId = null, editingGrinderId = null;
let chartInstances = {}, currentInsightView = 'overview', selectedBagId = null;
let finishedExpanded = false;
let currentPage = 'home', previousPage = 'home';
let currentDetailRoastId = null;
let authMode = 'signin';
let profileCache = {};
let toastTimeout = null;
let pendingDialedRoastId = null;
let userProfile = { username:'', location:'', machine:'', machine_other:'', grinder:'', coffee_prefs:'', fav_roasters:'', photo:null };
