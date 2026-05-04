// ─── Dialed — Config ───
// Supabase credentials and app-wide constants.
// This file must load before all other JS modules.

const SUPABASE_URL = 'https://oxrskeieeveyxrjnkqyg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cnNrZWllZXZleXhyam5rcXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjUxNTQsImV4cCI6MjA4OTk0MTE1NH0.OmToaFedMTQ7YX4vhj0ElHGIIY0_bf9DZtf_6a2aZm4';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SHARE_MIN_RATING = 4;
const APP_NAME = 'Dialed';
const CURRENT_VERSION = '1.2.0';

const CHANGELOG = [
  {
    version: '1.2.0',
    date: 'May 2026',
    title: 'Filters, Temperature & More',
    changes: [
      'New search + filter modal replacing dropdown selects on My Shots and Community pages',
      'Origin and varietal added as filter options',
      'Temperature unit toggle (Celsius / Fahrenheit) in profile settings',
      'Custom rest days per roast with auto-defaults by roast level',
      'Ultra-light roast level added',
      'Redesigned active bags sort \u2014 prioritizes bags with shots and proximity to peak',
      'Active bags limited to 2 on home screen for a cleaner layout',
      'Bag card chips split into two rows for consistency',
      'Achievement persistence in database \u2014 no more recompute on login',
      'Community shots lazy-loaded on tab visit for faster startup',
      'Expanded grinder and machine dropdown lists',
      'New espresso tips based on extraction research and best practices',
      'Updated greeting messages',
      'Insights page layout fixes',
    ],
  },
  {
    version: '1.1.0',
    date: 'April 2026',
    title: 'UI Improvements + Optimizations',
    changes: [
      'Pagination for my shots & community pages',
      'Improvements to active bags section on home page',
      'Machine and grinder dropdown list expansions',
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
  'Tip: Change one variable at a time. Otherwise you\u2019re guessing, not dialing.',
  'Tip: Think in ratios, not time. Time is a symptom \u2014 ratio is the lever.',
  'Tip: To increase extraction, the #1 move is more water through the coffee.',
  'Tip: Grind coarser than you think. You get comparable extraction with less channeling and more consistency.',
  'Tip: Grinding too fine can actually decrease extraction \u2014 fines clog the puck and create uneven flow.',
  'Tip: Darker roasts: shorter ratios, lower temps, coarser grinds. They extract easily.',
  'Tip: Lighter roasts: longer ratios, higher temps, finer grinds. They resist extraction.',
  'Tip: Heavily processed coffees need less extraction \u2014 the interesting notes live in the process, not the terroir.',
  'Tip: Acidity comes out early in the shot; bitterness comes out late. Taste accordingly.',
  'Tip: If your shot tastes both sour and bitter, you likely have channeling \u2014 try grinding coarser, not finer.',
  'Tip: Reducing your dose by a gram or two can increase extraction yield without changing grind or ratio.',
  'Tip: Consistency in prep matters more than any single variable. Weigh your dose, weigh your output.',
  'Tip: A longer pre-infusion can help even out extraction, especially on light roasts.',
  'Tip: Quality of coffee and water matters more than anything else you do at the machine.',
];

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
