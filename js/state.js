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
let earnedAchievements = {};   // { achievement_id: "date_earned", ... } — loaded from profiles table
let myCommunityCount = 0;      // count of current user's community shots — avoids loading all community data
let userProfile = { username:'', location:'', machine:'', machine_other:'', grinder:'', coffee_prefs:'', fav_roasters:'', photo:null, temp_unit:'C' };
