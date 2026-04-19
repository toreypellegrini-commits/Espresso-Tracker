// ─── Dialed — Config ───
// Supabase credentials and app-wide constants.
// This file must load before all other JS modules.

const SUPABASE_URL = 'https://oxrskeieeveyxrjnkqyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cnNrZWllZXZleXhyam5rcXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjUxNTQsImV4cCI6MjA4OTk0MTE1NH0.OmToaFedMTQ7YX4vhj0ElHGIIY0_bf9DZtf_6a2aZm4';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SHARE_MIN_RATING = 4;
const APP_NAME = 'Dialed';
const CURRENT_VERSION = '1.1.2';

const CHANGELOG = [
  {
    version: '1.1.2',
    date: 'April 18, 2026',
    title: 'Temp Unit Toggle Feature + Optimizations',
    changes: [
      'Temperature unit toggle (C/F)',
      'Added ultra-light roast level',
      'Auto-default rest days by roast level',
      'Machine and grinder dropdown list expansions',
      'Pagination for my shots & community pages',
      'Improvements to active bags section on home page',
      'Startup optimizations',
      'Improved achievement persistence',
    ],
  },
];

const RANKS = [
  { min: 0,   max: 0,   icon: '☕', name: 'Coffee Butler' },
  { min: 1,   max: 9,   icon: '☕', name: 'Coffee Butler' },
  { min: 10,  max: 24,  icon: '☕☕', name: 'Starbucks Barista' },
  { min: 25,  max: 49,  icon: '☕☕☕', name: 'Home Barista' },
  { min: 50,  max: 99,  icon: '🏅', name: 'Spro Pro' },
  { min: 100, max: 249, icon: '🏆', name: 'Espresso God' },
  { min: 250, max: Infinity, icon: '👑', name: 'Lance Hedrick' },
];

const ACHIEVEMENTS = [
  { id:'first_pull',       icon:'☕', name:'First Pull',          desc:'Log your first shot' },
  { id:'turbo_time',       icon:'⚡', name:"It's Turbo Time",     desc:'Log a shot with ratio 1:3 or higher' },
  { id:'turbo_charged',    icon:'🚀', name:'Turbo Mode',          desc:'Log 10 shots with ratio 1:3+' },
  { id:'perfectionist',    icon:'⭐', name:'Perfectionist',       desc:'Log a 5★ shot' },
  { id:'high_five',        icon:'🖐', name:'High Five',           desc:'Log 5 consecutive 5★ shots' },
  { id:'dedicated',        icon:'📅', name:'The Dedicated',       desc:'Log shots 7 days in a row' },
  { id:'dialed_in',        icon:'🎯', name:'Dialed In',           desc:'Dial your first bag' },
  { id:'espresso_nerd',    icon:'🤓', name:'Espresso Nerd',       desc:'Dial 10 different bags' },
  { id:'won_the_game',     icon:'🥇', name:'Grandmaster',         desc:'Dial 100 different bags' },
  { id:'completionist',    icon:'✅', name:'Completionist',       desc:'Finish a bag' },
  { id:'bag_whisperer',    icon:'👜', name:'Bag Whisperer',       desc:'Finish 10 bags' },
  { id:'caffeine_junkie',  icon:'😬', name:'Caffeine Junkie',     desc:'Log 3 shots in one day' },
  { id:'certifiable',      icon:'🤪', name:'Certifiable',         desc:'Log 5 shots in one day' },
  { id:'contributor',      icon:'🌍', name:'Community Contributor', desc:'Share your first community shot' },
  { id:'comm_regular',     icon:'🌎', name:'Community Regular',    desc:'Share 10 community shots' },
  { id:'comm_pillar',      icon:'🏛', name:'Community Pillar',    desc:'Share 100 community shots' },
  { id:'ooey_gooey',       icon:'🍯', name:'Ristretto',           desc:'Log a shot with ratio under 1:1.5' },
  { id:'buonissimo',       icon:'🤌', name:'Buonissimo',          desc:'Log 10 ristretto shots' },
  { id:'roaster_loyalist', icon:'❤️', name:'Roaster Loyalist',    desc:'Finish 10 bags from the same roaster' },
  { id:'century_pull',     icon:'💯', name:'Century Pull',        desc:'Log 100 shots' },
];

const TIPS = [
  'Tip: Try dropping your dose 0.5g and see if clarity improves.',
  'Tip: Grind finer if your shot is running fast and tasting sour.',
  'Tip: Letting a new bag rest 7–10 days off roast often hits the sweet spot.',
  'Tip: A longer pre-infusion can help even out extraction on light roasts.',
  'Tip: If your shot tastes bitter, try a slightly coarser grind or lower temp.',
  'Tip: Consistency in tamping pressure matters more than the pressure amount.',
];

// Default rest days by roast level.
// Auto-populates the rest days field when a roast level is selected.
const REST_DAYS_BY_ROAST = {
  'Ultra-light': 28,
  'Light': 14,
  'Light-medium': 14,
  'Medium': 7,
  'Medium-dark': 7,
  'Dark': 7,
};

const GRINDERS = {
  'Flat Burr Electric': [
    'DF54', 'DF64', 'DF83', 'Eureka Atom 75', 'Eureka Mignon Specialita', 'Eureka Mignon XL', 'Eureka Oro Single Dose',
    'Fellow Ode', 'Lagom P64', 'Lagom P100',
    'Mahlkönig X54', 'Mazzer Mini', 'Mazzer Philos', 'Timemore Sculptor', 'Weber EG-1', 'Zerno Z1',
  ],
  'Conical Burr Electric': [
    'Baratza Encore ESP', 'Baratza Sette 270', 'Baratza Vario', 'Breville Smart Grinder Pro',
    'Ceado E5P', 'Eureka Mignon Crono', 'Eureka Mignon Zero', 'Fiorenzato AllGround',
    'Niche Duo', 'Niche Zero',
  ],
  'Hand Grinders': [
    '1Zpresso J-Max', '1Zpresso JX-Pro', '1Zpresso K-Max', '1Zpresso K-Ultra',
    'Comandante C40', 'Kinu M47', 'Timemore Chestnut X',
  ],
};
