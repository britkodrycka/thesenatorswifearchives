/**
 * api.js
 * All Supabase read/write operations + theme switching + toast.
 * Depends on: config.js (db, STATE, BOOK_THEME_PRESETS)
 */

// ── THEME APPLICATION ─────────────────────────────────────────────────────────
function applyTheme(themeKey) {
  const t    = themeKey && BOOK_THEME_PRESETS[themeKey] ? BOOK_THEME_PRESETS[themeKey] : null;
  const root = document.documentElement;
  if (t) {
    root.style.setProperty('--bg',     t.bg);
    root.style.setProperty('--bg2',    t.bg2);
    root.style.setProperty('--bg3',    t.bg3);
    root.style.setProperty('--bg4',    t.bg4);
    root.style.setProperty('--cream',  t.text);
    root.style.setProperty('--cream2', t.cream2);
    root.style.setProperty('--cream3', t.cream3);
    root.style.setProperty('--gold2',  t.gold2);
    root.style.setProperty('--border', t.border);
    root.style.setProperty('--border2',t.border2);
    document.body.style.background = t.bg;
  } else {
    const bg = STATE.bgColor || '#1C1610';
    root.style.setProperty('--bg',     bg);
    root.style.setProperty('--bg2',    '#231A0E');
    root.style.setProperty('--bg3',    '#2A1E10');
    root.style.setProperty('--bg4',    '#160E08');
    root.style.setProperty('--cream',  '#E8DFC8');
    root.style.setProperty('--cream2', '#C8B898');
    root.style.setProperty('--cream3', '#A09070');
    root.style.setProperty('--gold2',  '#C8A84B');
    root.style.setProperty('--border', '#3A2E18');
    root.style.setProperty('--border2','#5A4A28');
    document.body.style.background = bg;
  }
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const t = document.getElementById('saveToast');
  t.textContent = msg;
  t.className   = 'save-toast show' + (isError ? ' error' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'save-toast'; }, 2500);
}

// ── LOAD ALL DATA ─────────────────────────────────────────────────────────────
async function loadAll() {
  try {
    // Fetch all tables in parallel
    const [
      { data: settings },
      { data: books },
      { data: locations },
      { data: fragments },
      { data: witnesses },
      { data: timelineStops },
      { data: timelineDetails },
    ] = await Promise.all([
      db.from('site_settings').select('*').eq('id', 1).single(),
      db.from('books').select('*').order('sort_order'),
      db.from('locations').select('*').order('sort_order'),
      db.from('fragments').select('*').order('sort_order'),
      db.from('witnesses').select('*').order('sort_order'),
      db.from('timeline_stops').select('*').order('sort_order'),
      db.from('timeline_details').select('*').order('sort_order'),
    ]);

    // Apply site settings to STATE
    if (settings) {
      STATE.siteTitle     = settings.site_title;
      STATE.siteSub       = settings.site_sub;
      STATE.siteAuthor    = settings.site_author;
      STATE.introTitle    = settings.intro_title;
      STATE.introText     = settings.intro_text   || '';
      STATE.footerText    = settings.footer_text;
      STATE.footerUrl     = settings.footer_url;
      STATE.bgColor       = settings.bg_color;
      STATE.week          = settings.week;
      STATE.totalWeeks    = settings.total_weeks;
      STATE.lastUpdated   = settings.last_updated;
      STATE.adminPassword = settings.admin_password;
    }

    // Books
    STATE.books = (books || []).map(b => ({
      id:       b.id,
      title:    b.title,
      subtitle: b.subtitle,
      themeKey: b.theme_key,
      color:    b.color,
    }));

    // Locations — attach fragments and witnesses
    STATE.locations = (locations || []).map(loc => ({
      id:          loc.id,
      name:        loc.name,
      icon:        loc.icon,
      type:        loc.type,
      role:        loc.role,
      category:    loc.category,
      headerColor: loc.header_color,
      status:      loc.status,
      updated:     loc.updated,
      fragments:   (fragments || [])
        .filter(f => f.location_id === loc.id)
        .map(f => ({
          _id:    f.id,          // UUID — needed for updates/deletes
          num:    f.num,
          title:  f.title,
          desc:   f.description,
          locked: f.locked,
          img:    f.img_url,
        })),
      witnesses:  (witnesses || [])
        .filter(w => w.location_id === loc.id)
        .map(w => ({
          _id:    w.id,
          handle: w.handle,
          theory: w.theory,
          record: w.is_record,
        })),
    }));

    // Timeline — attach detail fragments
    STATE.timeline = (timelineStops || []).map(s => ({
      id:           s.id,
      bookId:       s.book_id,
      date:         s.date_label,
      title:        s.title,
      desc:         s.description,
      icon:         s.icon,
      locationId:   s.location_id,
      locationName: s.location_name,
      detailFragments: (timelineDetails || [])
        .filter(d => d.stop_id === s.id)
        .map(d => ({
          _id:   d.id,
          num:   d.num,
          title: d.title,
          desc:  d.description,
          img:   d.img_url,
        })),
    }));

  } catch (err) {
    console.error('loadAll failed:', err);
    showToast('Failed to load data', true);
  }

  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('app').style.display = 'block';
  render();
}

// ── SITE SETTINGS ─────────────────────────────────────────────────────────────
async function saveSiteSettings() {
  showToast('Saving…');
  const { error } = await db.from('site_settings').update({
    site_title:     STATE.siteTitle,
    site_sub:       STATE.siteSub,
    site_author:    STATE.siteAuthor,
    intro_title:    STATE.introTitle,
    intro_text:     STATE.introText,
    footer_text:    STATE.footerText,
    footer_url:     STATE.footerUrl,
    bg_color:       STATE.bgColor,
    week:           STATE.week,
    total_weeks:    STATE.totalWeeks,
    last_updated:   STATE.lastUpdated,
    admin_password: STATE.adminPassword,
  }).eq('id', 1);
  if (error) { showToast('Save failed', true); throw error; }
  showToast('✦ Saved');
}

// ── BOOKS ─────────────────────────────────────────────────────────────────────
async function dbAddBook(book) {
  const { data, error } = await db.from('books').insert({
    id:         book.id,
    title:      book.title,
    subtitle:   book.subtitle,
    theme_key:  book.themeKey,
    color:      book.color,
    sort_order: STATE.books.length + 1,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateBook(book) {
  const { error } = await db.from('books').update({
    title:     book.title,
    subtitle:  book.subtitle,
    theme_key: book.themeKey,
    color:     book.color,
  }).eq('id', book.id);
  if (error) throw error;
}

async function dbDeleteBook(bookId) {
  const { error } = await db.from('books').delete().eq('id', bookId);
  if (error) throw error;
}

// ── LOCATIONS ─────────────────────────────────────────────────────────────────
async function dbAddLocation(loc) {
  const { data, error } = await db.from('locations').insert({
    id:           loc.id,
    name:         loc.name,
    icon:         loc.icon,
    type:         loc.type,
    role:         loc.role,
    category:     loc.category,
    header_color: loc.headerColor,
    status:       loc.status,
    updated:      loc.updated,
    sort_order:   STATE.locations.length + 1,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateLocation(loc) {
  const { error } = await db.from('locations').update({
    name:         loc.name,
    icon:         loc.icon,
    type:         loc.type,
    role:         loc.role,
    category:     loc.category,
    header_color: loc.headerColor,
    status:       loc.status,
    updated:      loc.updated,
  }).eq('id', loc.id);
  if (error) throw error;
}

async function dbDeleteLocation(locId) {
  const { error } = await db.from('locations').delete().eq('id', locId);
  if (error) throw error;
}

// ── FRAGMENTS ─────────────────────────────────────────────────────────────────
async function dbAddFragment(locId, frag) {
  const loc      = STATE.locations.find(l => l.id === locId);
  const { data, error } = await db.from('fragments').insert({
    location_id: locId,
    num:         frag.num,
    title:       frag.title,
    description: frag.desc,
    locked:      frag.locked,
    img_url:     frag.img || null,
    sort_order:  (loc ? loc.fragments.length : 0) + 1,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateFragment(frag) {
  const { error } = await db.from('fragments').update({
    num:         frag.num,
    title:       frag.title,
    description: frag.desc,
    locked:      frag.locked,
    img_url:     frag.img || null,
  }).eq('id', frag._id);
  if (error) throw error;
}

async function dbDeleteFragment(fragId) {
  const { error } = await db.from('fragments').delete().eq('id', fragId);
  if (error) throw error;
}

// ── WITNESSES ─────────────────────────────────────────────────────────────────
async function dbAddWitness(locId, w) {
  const loc = STATE.locations.find(l => l.id === locId);
  const { data, error } = await db.from('witnesses').insert({
    location_id: locId,
    handle:      w.handle,
    theory:      w.theory,
    is_record:   w.record,
    sort_order:  (loc ? loc.witnesses.length : 0) + 1,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateWitness(w) {
  const { error } = await db.from('witnesses').update({
    handle:    w.handle,
    theory:    w.theory,
    is_record: w.record,
  }).eq('id', w._id);
  if (error) throw error;
}

async function dbDeleteWitness(witnessId) {
  const { error } = await db.from('witnesses').delete().eq('id', witnessId);
  if (error) throw error;
}

// ── TIMELINE STOPS ────────────────────────────────────────────────────────────
async function dbAddTimelineStop(stop) {
  const { data, error } = await db.from('timeline_stops').insert({
    id:            stop.id,
    book_id:       stop.bookId   || null,
    date_label:    stop.date,
    title:         stop.title,
    description:   stop.desc,
    icon:          stop.icon,
    location_id:   stop.locationId   || null,
    location_name: stop.locationName || '',
    sort_order:    STATE.timeline.length + 1,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateTimelineStop(stop) {
  const { error } = await db.from('timeline_stops').update({
    book_id:       stop.bookId       || null,
    date_label:    stop.date,
    title:         stop.title,
    description:   stop.desc,
    icon:          stop.icon,
    location_id:   stop.locationId   || null,
    location_name: stop.locationName || '',
  }).eq('id', stop.id);
  if (error) throw error;
}

async function dbDeleteTimelineStop(stopId) {
  const { error } = await db.from('timeline_stops').delete().eq('id', stopId);
  if (error) throw error;
}

// ── TIMELINE DETAILS ──────────────────────────────────────────────────────────
async function dbAddTimelineDetail(stopId, detail) {
  const stop = STATE.timeline.find(t => t.id === stopId);
  const { data, error } = await db.from('timeline_details').insert({
    stop_id:     stopId,
    num:         detail.num   || '',
    title:       detail.title,
    description: detail.desc,
    img_url:     detail.img   || null,
    sort_order:  (stop ? stop.detailFragments.length : 0) + 1,
  }).select().single();
  if (error) throw error;
  return data;
}

async function dbUpdateTimelineDetail(detail) {
  const { error } = await db.from('timeline_details').update({
    num:         detail.num   || '',
    title:       detail.title,
    description: detail.desc,
  }).eq('id', detail._id);
  if (error) throw error;
}

async function dbDeleteTimelineDetail(detailId) {
  const { error } = await db.from('timeline_details').delete().eq('id', detailId);
  if (error) throw error;
}

// ── CONVENIENCE: reload from DB then re-render ────────────────────────────────
async function saveAndRender() {
  await loadAll();
}
