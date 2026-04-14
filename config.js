/**
 * config.js
 * Supabase credentials, book theme presets, and app STATE.
 * No seed data lives here anymore — it's all in Supabase.
 */

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://uoeeoxcljahnnbyxrcwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZWVveGNsamFobm5ieXhyY3dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjU0NTAsImV4cCI6MjA5MTUwMTQ1MH0.w4prk2E1q5wZ3giTvTiIYF4R2tOWLuWLmHpe9Rzc4AE';

// Supabase JS client (loaded via CDN in index.html)
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── BOOK THEME PRESETS ────────────────────────────────────────────────────────
const BOOK_THEME_PRESETS = {
  colonels_daughter: {
    name: "The Colonel's Daughter",
    bg:'#F5F0E8', text:'#3A3020', cream:'#6A5A40', cream2:'#5A4A30', cream3:'#8A7A60',
    gold2:'#B8860B', border:'#D4C8A8', border2:'#C4B898',
    bg2:'#EDE8D8', bg3:'#E8E0CC', bg4:'#F0EAD8',
    nodeAccent:'#B8860B'
  },
  senators_wife: {
    name: "The Senator's Wife",
    bg:'#1C1610', text:'#E8DFC8', cream:'#C8B898', cream2:'#C8B898', cream3:'#A09070',
    gold2:'#C8A84B', border:'#3A2E18', border2:'#5A4A28',
    bg2:'#231A0E', bg3:'#2A1E10', bg4:'#160E08',
    nodeAccent:'#C8A84B'
  },
  caught_sleeping: {
    name: 'Caught Sleeping',
    bg:'#1A1C28', text:'#D8D4E8', cream:'#B8B4CC', cream2:'#C8C4DC', cream3:'#8884A0',
    gold2:'#9090C0', border:'#2A2C40', border2:'#3A3C58',
    bg2:'#20223A', bg3:'#262840', bg4:'#161828',
    nodeAccent:'#9090C0'
  },
  the_whistleblower: {
    name: 'The Whistleblower',
    bg:'#1A1E22', text:'#D8DDE2', cream:'#B0B8C0', cream2:'#C8CDD2', cream3:'#808890',
    gold2:'#A0B0B8', border:'#2A3038', border2:'#3A4048',
    bg2:'#20262C', bg3:'#262C34', bg4:'#161C22',
    nodeAccent:'#A0B0B8'
  }
};

// ── APP STATE ─────────────────────────────────────────────────────────────────
// Populated at runtime by api.js loadAll()
const STATE = {
  // Site settings
  siteTitle:     '✦   The Senator\'s Wife Archives   ✦',
  siteSub:       "A Living Narrative Map for The Senator's Wife Series",
  siteAuthor:    'by Jen Lyon',
  introTitle:    'You only think you know the whole story.',
  introText:     '',
  footerText:    'Join us on Patreon to uncover the truth.',
  footerUrl:     'https://www.patreon.com/cw/JenLyonAuthor',
  bgColor:       '#1C1610',
  week:          1,
  totalWeeks:    6,
  lastUpdated:   '',
  adminPassword: 'archive2024',

  // Collections (filled by loadAll)
  books:     [],
  locations: [],   // each location has .fragments[] and .witnesses[] attached
  timeline:  [],   // each stop has .detailFragments[] attached

  // UI state
  adminMode:            false,
  currentView:          'map',   // 'map' | 'location' | 'timeline' | 'timeline-detail'
  currentLocation:      null,
  currentTimelineStop:  null,
};
