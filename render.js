/**
 * render.js
 * Navigation helpers and all view render functions:
 *   render()            — top-level shell (header, nav, week bar, footer)
 *   renderMapView()     — archive map grid + stats
 *   renderLocationView()— location detail: fragments + witnesses
 *   renderTimelineView()— S-curve timeline grouped by book
 *   renderDetailView()  — timeline stop detail panel
 *
 * Depends on: config.js, api.js, admin.js
 */

// ── NAVIGATION ────────────────────────────────────────────────────────────────
function goToLocation(locId) {
  if (locId === 'tbd' && !STATE.adminMode) return;
  STATE.currentView     = 'location';
  STATE.currentLocation = locId;
  applyTheme(null);
  render();
  window.scrollTo(0, 0);
}

function goToMap() {
  STATE.currentView          = 'map';
  STATE.currentLocation      = null;
  STATE.currentTimelineStop  = null;
  applyTheme(null);
  render();
  window.scrollTo(0, 0);
}

function goToTimeline() {
  STATE.currentView          = 'timeline';
  STATE.currentLocation      = null;
  STATE.currentTimelineStop  = null;
  render();
  window.scrollTo(0, 0);
}

function goToTimelineDetail(stopId) {
  STATE.currentView         = 'timeline-detail';
  STATE.currentTimelineStop = stopId;
  const stop = STATE.timeline.find(t => t.id === stopId);
  if (stop) {
    const book = STATE.books.find(b => b.id === stop.bookId);
    if (book) applyTheme(book.themeKey);
  }
  render();
  window.scrollTo(0, 0);
}

function handleNodeClick(stopId) {
  const stop = STATE.timeline.find(t => t.id === stopId);
  if (!stop) return;
  const hasDetails = stop.detailFragments && stop.detailFragments.length > 0;
  if (hasDetails) {
    goToTimelineDetail(stopId);
  } else if (stop.locationId) {
    goToLocation(stop.locationId);
  } else {
    goToTimelineDetail(stopId);
  }
}

// ── TOP-LEVEL RENDER ──────────────────────────────────────────────────────────
function render() {
  // Header
  document.getElementById('site-title-el').innerHTML  = STATE.siteTitle;
  document.getElementById('site-sub-el').textContent  = STATE.siteSub;
  document.getElementById('author-display').textContent= STATE.siteAuthor;
  document.getElementById('lastUpdated').textContent   = 'Last updated: ' + STATE.lastUpdated;

  // Footer
  const fl = document.getElementById('footer-link');
  fl.textContent = STATE.footerText;
  fl.href        = STATE.footerUrl;

  // Week pips
  const pips = document.getElementById('weekPips');
  pips.innerHTML = '';
  for (let i = 1; i <= STATE.totalWeeks; i++) {
    const p = document.createElement('div');
    p.className = 'week-pip' + (i < STATE.week ? ' done' : i === STATE.week ? ' current' : '');
    pips.appendChild(p);
  }
  document.getElementById('weekDisplay').textContent = 'Week ' + STATE.week + ' of ' + STATE.totalWeeks;

  // Nav
  const nav = document.getElementById('navStrip');
  nav.innerHTML = '';

  const mapBtn = document.createElement('button');
  mapBtn.className = 'nav-btn' + (STATE.currentView === 'map' ? ' active' : '');
  mapBtn.textContent = 'Archive Map';
  mapBtn.onclick = goToMap;
  nav.appendChild(mapBtn);

  const tlBtn = document.createElement('button');
  tlBtn.className = 'nav-btn' + (['timeline','timeline-detail'].includes(STATE.currentView) ? ' active' : '');
  tlBtn.textContent = 'Timeline';
  tlBtn.onclick = goToTimeline;
  nav.appendChild(tlBtn);

  STATE.locations.forEach(loc => {
    const b = document.createElement('button');
    b.className    = 'nav-btn' + (STATE.currentView === 'location' && STATE.currentLocation === loc.id ? ' active' : '');
    b.textContent  = loc.name;
    b.onclick      = () => goToLocation(loc.id);
    nav.appendChild(b);
  });

  // View outlet
  const views = document.getElementById('views');
  views.innerHTML = '';

  if (STATE.currentView === 'map') {
    views.appendChild(renderMapView());
  } else if (STATE.currentView === 'timeline') {
    views.appendChild(renderTimelineView());
  } else if (STATE.currentView === 'timeline-detail') {
    views.appendChild(renderDetailView());
  } else if (STATE.currentView === 'location' && STATE.currentLocation) {
    const loc = STATE.locations.find(l => l.id === STATE.currentLocation);
    if (loc) views.appendChild(renderLocationView(loc));
  }
}

// ── MAP VIEW ──────────────────────────────────────────────────────────────────
function renderMapView() {
  applyTheme(null);
  const div = document.createElement('div');
  div.className = 'map-wrap';

  // Intro
  const intro = document.createElement('div');
  intro.className = 'map-intro';
  intro.innerHTML = `
    <button class="map-intro-edit" onclick="openIntroEditor()">Edit intro</button>
    <div class="map-intro-title">${STATE.introTitle}</div>
    ${STATE.introText ? `<div class="map-intro-text">${STATE.introText}</div>` : ''}
  `;
  div.appendChild(intro);

  // Location cards
  const grid = document.createElement('div');
  grid.className = 'node-grid';
  STATE.locations.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'node-card' + (loc.type === 'locked' ? ' locked' : '');
    card.innerHTML = `
      <div class="node-icon-wrap">${loc.icon}</div>
      <div class="node-name">${loc.name}</div>
      <div class="node-role" style="display:none;">${loc.role}</div>
      <div class="node-count">${loc.fragments.filter(f => !f.locked).length} fragment${loc.fragments.filter(f => !f.locked).length !== 1 ? 's' : ''} revealed</div>
    `;
    card.onclick = () => goToLocation(loc.id);
    if (STATE.adminMode) {
      const eb = document.createElement('button');
      eb.style.cssText = 'margin-top:8px;background:none;border:0.5px solid #5A4A28;color:#A09070;font-size:9px;font-family:Arial,sans-serif;padding:3px 8px;border-radius:2px;cursor:pointer;display:block;width:100%;';
      eb.textContent = 'Edit location';
      eb.onclick = e => { e.stopPropagation(); editLocation(loc.id); };
      card.appendChild(eb);
    }
    grid.appendChild(card);
  });
  div.appendChild(grid);

  // Stats
  const totalFrags = STATE.locations.reduce((a, l) => a + l.fragments.length, 0);
  const revealed   = STATE.locations.reduce((a, l) => a + l.fragments.filter(f => !f.locked).length, 0);
  const witnesses  = STATE.locations.reduce((a, l) => a + l.witnesses.length, 0);
  const stats = document.createElement('div');
  stats.className = 'map-stats';
  stats.innerHTML = `
    <div class="stat-card"><div class="stat-num">${revealed}</div><div class="stat-label">Fragments revealed</div></div>
    <div class="stat-card"><div class="stat-num">${totalFrags - revealed}</div><div class="stat-label">Fragments locked</div></div>
    <div class="stat-card"><div class="stat-num">${witnesses}</div><div class="stat-label">Witness theories</div></div>
  `;
  div.appendChild(stats);
  return div;
}

// ── LOCATION VIEW ─────────────────────────────────────────────────────────────
function renderLocationView(loc) {
  const wrap = document.createElement('div');
  wrap.className = 'loc-wrap';

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'loc-header';
  hdr.style.background = loc.headerColor;
  hdr.innerHTML = `
    <div>
      <button class="loc-back" onclick="goToMap()">&#8592; Back to Archive</button>
      <div class="loc-title">${loc.name}</div>
    </div>
  `;
  if (STATE.adminMode) {
    const eb = document.createElement('button');
    eb.style.cssText = 'background:none;border:0.5px solid #5A4A28;color:#A09070;font-family:Arial,sans-serif;font-size:10px;padding:5px 10px;border-radius:3px;cursor:pointer;align-self:flex-start;';
    eb.textContent = 'Edit location';
    eb.onclick = () => editLocation(loc.id);
    hdr.appendChild(eb);
  }
  wrap.appendChild(hdr);

  // Body: fragments + witnesses
  const body    = document.createElement('div');
  body.className = 'loc-body';

  // — Fragments column —
  const fragCol = document.createElement('div');
  fragCol.className = 'frag-col';
  fragCol.innerHTML = '<div class="frag-col-title">Fragments</div>';
  const fragGrid = document.createElement('div');
  fragGrid.className = 'frag-grid';

  loc.fragments.forEach((f, idx) => {
    const card = document.createElement('div');
    card.className = 'frag-card' + (f.locked ? ' locked-card' : '');
    let imgHTML = '';
    if (f.img) {
      imgHTML = `<img src="${f.img}" alt="Fragment ${f.num}">`;
    } else if (STATE.adminMode && !f.locked) {
      imgHTML = `<div class="frag-upload-hint">Click to upload image</div>
                 <input type="file" accept="image/*" style="display:none"
                        onchange="handleImageUpload('${loc.id}',${idx},this)"
                        id="fimg_${loc.id}_${idx}">`;
    } else {
      imgHTML = `<div class="frag-upload-hint">${f.locked ? 'Locked' : 'Fragment image'}</div>`;
    }
    card.innerHTML = `
      <div class="frag-num">Fragment ${f.num}</div>
      <div class="frag-img-zone ${f.img ? 'has-img' : ''}"
           onclick="${STATE.adminMode && !f.locked ? `document.getElementById('fimg_${loc.id}_${idx}').click()` : ''}">
        ${imgHTML}
      </div>
      <div class="frag-title-text">${f.title}</div>
      <div class="frag-desc-text">${f.desc}</div>
      ${STATE.adminMode ? `<button class="frag-edit-btn" onclick="editFragment('${loc.id}',${idx})">Edit fragment</button>` : ''}
    `;
    fragGrid.appendChild(card);
  });

  if (loc.fragments.length === 0 && !STATE.adminMode) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:12px;font-style:italic;color:var(--cream3);padding:20px 0;';
    empty.textContent = 'No fragments at this location yet.';
    fragGrid.appendChild(empty);
  }
  if (STATE.adminMode) {
    const addBtn = document.createElement('button');
    addBtn.className   = 'add-frag-btn';
    addBtn.textContent = '+ Add fragment';
    addBtn.onclick     = () => addFragment(loc.id);
    fragGrid.appendChild(addBtn);
  }
  fragCol.appendChild(fragGrid);
  body.appendChild(fragCol);

  // — Witnesses column —
  const witCol = document.createElement('div');
  witCol.className = 'witness-col';
  witCol.innerHTML = '<div class="witness-col-title">Witness Theories</div>';

  if (loc.witnesses.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:11px;font-style:italic;color:#5A4838;padding:8px 0;';
    empty.textContent = 'No theories yet.';
    witCol.appendChild(empty);
  }

  loc.witnesses.forEach((w, wIdx) => {
    const entry = document.createElement('div');
    entry.className = 'witness-entry';
    entry.innerHTML = `
      <div class="witness-handle">${w.handle}</div>
      <div class="witness-theory">${w.theory}</div>
      ${w.record ? '<div class="witness-badge-wr">&#10022; Witness of Record</div>' : ''}
      ${STATE.adminMode ? `<button style="margin-top:5px;background:none;border:0.5px solid #3A2E18;color:#7A6A3E;font-size:9px;font-family:Arial,sans-serif;padding:2px 6px;border-radius:2px;cursor:pointer;" onclick="editWitness('${loc.id}',${wIdx})">Edit</button>` : ''}
    `;
    witCol.appendChild(entry);
  });

  const addWBtn = document.createElement('button');
  addWBtn.className   = 'add-witness-btn';
  addWBtn.textContent = '+ Add witness theory';
  addWBtn.onclick     = () => addWitness(loc.id);
  witCol.appendChild(addWBtn);

  body.appendChild(witCol);
  wrap.appendChild(body);

  // Patreon banner
  const patreon = document.createElement('div');
  patreon.className = 'loc-patreon';
  patreon.innerHTML = `<a href="${STATE.footerUrl}" target="_blank" rel="noopener">Malcom, the Patreon please.</a>`;
  wrap.appendChild(patreon);

  // Status bar
  const statusBar = document.createElement('div');
  statusBar.className = 'status-bar';
  statusBar.innerHTML = `
    <div class="status-item"><div class="status-dot"></div>${loc.status}</div>
    <div class="status-item">Updated: ${loc.updated}</div>
    <div class="status-item">${loc.witnesses.length} witness theor${loc.witnesses.length !== 1 ? 'ies' : 'y'}</div>
  `;
  wrap.appendChild(statusBar);
  return wrap;
}

// ── TIMELINE VIEW (S-CURVE) ───────────────────────────────────────────────────
function renderTimelineView() {
  const page = document.createElement('div');
  page.className = 'timeline-page';

  const hdr = document.createElement('div');
  hdr.className = 'timeline-page-header';
  hdr.innerHTML = `
    <div class="timeline-page-title">Story World Timeline</div>
    <div class="timeline-page-sub">The events, in order. Or as close to order as the truth allows.</div>
  `;
  const addBtn = document.createElement('button');
  addBtn.className   = 'tl-add-btn';
  addBtn.textContent = '+ Add stop';
  addBtn.onclick     = addTimelineStop;
  hdr.appendChild(addBtn);
  page.appendChild(hdr);

  const books           = STATE.books || [];
  const stopsWithoutBook = STATE.timeline.filter(t => !t.bookId);

  books.forEach(book => {
    const bookStops = STATE.timeline.filter(t => t.bookId === book.id);
    if (bookStops.length === 0 && !STATE.adminMode) return;

    const section  = document.createElement('div');
    section.className = 'book-section';
    const divider  = document.createElement('div');
    divider.className = 'book-divider';
    divider.innerHTML = `
      <div class="book-divider-rule" style="background:${book.color};"></div>
      <div class="book-divider-title" style="color:${book.color};">${book.subtitle}</div>
      <div class="book-divider-subtitle">${book.title}</div>
      ${STATE.adminMode ? `<button class="book-edit-btn" onclick="editBook('${book.id}')">Edit book</button>` : ''}
    `;
    section.appendChild(divider);

    const track = document.createElement('div');
    track.className = 'tl-track';

    bookStops.forEach((stop, idx) => {
      const isRight    = idx % 2 === 1;
      const theme      = BOOK_THEME_PRESETS[book.themeKey] || BOOK_THEME_PRESETS.senators_wife;
      const hasDetails = stop.detailFragments && stop.detailFragments.length > 0;

      const row = document.createElement('div');
      row.className = 'tl-row ' + (isRight ? 'right' : 'left');
      row.style.background = `linear-gradient(${isRight ? 'to left' : 'to right'}, ${theme.bg}00 0%, ${theme.bg}22 40%, ${theme.bg}44 100%)`;

      const connector = document.createElement('div');
      connector.className = 'tl-connector';
      connector.style.background = theme.border2 || '#5A4A28';
      row.appendChild(connector);

      const nodeWrap = document.createElement('div');
      nodeWrap.className = 'tl-node-wrap';
      const node = document.createElement('div');
      node.className   = 'tl-node' + (hasDetails ? ' has-detail' : '');
      node.style.background   = theme.bg2    || '#231A0E';
      node.style.borderColor  = hasDetails ? (theme.gold2 || '#C8A84B') : (theme.border2 || '#5A4A28');
      node.innerHTML   = stop.icon || '✦';
      node.style.color = theme.gold2 || '#C8A84B';
      node.onclick     = () => handleNodeClick(stop.id);
      nodeWrap.appendChild(node);
      row.appendChild(nodeWrap);

      const contentWrap = document.createElement('div');
      contentWrap.className = 'tl-content-wrap';
      contentWrap.innerHTML = `
        <div class="tl-stop-date"   style="color:${theme.gold2  || '#C8A84B'};">${stop.date}</div>
        <div class="tl-stop-title"  style="color:${theme.text   || '#E8DFC8'};">${stop.title}</div>
        <div class="tl-stop-desc"   style="color:${theme.cream3 || '#A09070'};">${stop.desc}</div>
        ${stop.locationName ? `<span class="tl-stop-loc" style="color:${theme.cream3||'#A09070'};border-color:${theme.border2||'#5A4A28'};">${stop.locationName}</span>` : ''}
        ${hasDetails ? `<span class="tl-stop-detail-badge" style="color:${theme.gold2||'#C8A84B'};background:${theme.gold2||'#C8A84B'}1a;border-color:${theme.border2||'#5A4A28'};">${stop.detailFragments.length} detail${stop.detailFragments.length !== 1 ? 's' : ''}</span>` : ''}
        ${STATE.adminMode ? `<br><button class="tl-edit-btn" onclick="editTimelineStop('${stop.id}')">Edit stop</button>` : ''}
      `;
      row.appendChild(contentWrap);
      track.appendChild(row);

      // S-curve SVG bridge between rows (not after last)
      if (idx < bookStops.length - 1) {
        const svgWrap = document.createElement('div');
        svgWrap.style.cssText = 'width:100%;height:60px;overflow:hidden;position:relative;';
        const curveColor = theme.border2 || '#5A4A28';
        const fromRight  = isRight;
        svgWrap.innerHTML = `
          <svg viewBox="0 0 900 60" preserveAspectRatio="none" width="100%" height="60" xmlns="http://www.w3.org/2000/svg">
            <path d="${fromRight ? 'M 836 0 C 836 30, 64 30, 64 60' : 'M 64 0 C 64 30, 836 30, 836 60'}"
                  fill="none" stroke="${curveColor}" stroke-width="1"/>
          </svg>`;
        track.appendChild(svgWrap);
      }
    });

    section.appendChild(track);
    page.appendChild(section);
  });

  // Unassigned stops
  if (stopsWithoutBook.length > 0) {
    const track = document.createElement('div');
    track.className = 'tl-track';
    stopsWithoutBook.forEach((stop, idx) => {
      const isRight    = idx % 2 === 1;
      const row        = document.createElement('div');
      row.className    = 'tl-row ' + (isRight ? 'right' : 'left');
      const nodeWrap   = document.createElement('div'); nodeWrap.className = 'tl-node-wrap';
      const node       = document.createElement('div'); node.className = 'tl-node';
      node.innerHTML   = stop.icon || '✦';
      node.onclick     = () => handleNodeClick(stop.id);
      nodeWrap.appendChild(node); row.appendChild(nodeWrap);
      const contentWrap = document.createElement('div'); contentWrap.className = 'tl-content-wrap';
      contentWrap.innerHTML = `
        <div class="tl-stop-date">${stop.date}</div>
        <div class="tl-stop-title">${stop.title}</div>
        <div class="tl-stop-desc">${stop.desc}</div>
        ${STATE.adminMode ? `<button class="tl-edit-btn" onclick="editTimelineStop('${stop.id}')">Edit stop</button>` : ''}
      `;
      row.appendChild(contentWrap);
      track.appendChild(row);
    });
    page.appendChild(track);
  }

  return page;
}

// ── TIMELINE DETAIL VIEW ──────────────────────────────────────────────────────
function renderDetailView() {
  const stop = STATE.timeline.find(t => t.id === STATE.currentTimelineStop);
  if (!stop) { goToTimeline(); return document.createElement('div'); }

  const book = STATE.books.find(b => b.id === stop.bookId);
  if (book) applyTheme(book.themeKey);

  const wrap = document.createElement('div');
  wrap.className = 'detail-panel';

  const backBtn = document.createElement('button');
  backBtn.className = 'detail-back';
  backBtn.innerHTML = '&#8592; Back to Timeline';
  backBtn.onclick   = goToTimeline;
  wrap.appendChild(backBtn);

  const hdr = document.createElement('div');
  hdr.className = 'detail-header';
  hdr.innerHTML = `
    ${book ? `<div class="detail-book-label" style="color:${book.color};">${book.subtitle}: ${book.title}</div>` : ''}
    <div class="detail-title">${stop.title}</div>
    <div class="detail-date">${stop.date}</div>
    ${stop.locationName ? `<span class="detail-loc-tag">${stop.locationName}</span>` : ''}
  `;
  wrap.appendChild(hdr);

  const divider = document.createElement('div');
  divider.className = 'detail-divider';
  wrap.appendChild(divider);

  const desc = document.createElement('div');
  desc.className   = 'detail-desc';
  desc.textContent = stop.desc;
  wrap.appendChild(desc);

  const details = stop.detailFragments || [];
  if (details.length > 0) {
    const secLabel = document.createElement('div');
    secLabel.className   = 'detail-section-label';
    secLabel.textContent = 'Details';
    wrap.appendChild(secLabel);

    const grid = document.createElement('div');
    grid.className = 'detail-grid';
    details.forEach((d, dIdx) => {
      const card = document.createElement('div');
      card.className = 'frag-card';
      card.innerHTML = `
        ${d.num  ? `<div class="frag-num">${d.num}</div>` : ''}
        ${d.img  ? `<div class="frag-img-zone has-img"><img src="${d.img}" alt="${d.title}"></div>` : ''}
        <div class="frag-title-text">${d.title}</div>
        <div class="frag-desc-text">${d.desc}</div>
        ${STATE.adminMode ? `<button class="frag-edit-btn" onclick="editDetailFragment('${stop.id}',${dIdx})">Edit detail</button>` : ''}
      `;
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
  } else {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:12px;font-style:italic;color:var(--cream3);padding:20px 0;';
    empty.textContent   = 'No details attached to this event yet.';
    wrap.appendChild(empty);
  }

  // Link back to location page if attached
  if (stop.locationId) {
    const locLink = document.createElement('div');
    locLink.style.cssText = 'margin-top:28px;padding-top:20px;border-top:0.5px solid var(--border);text-align:center;';
    locLink.innerHTML = `<button onclick="goToLocation('${stop.locationId}')" style="background:none;border:0.5px solid var(--border2);color:var(--cream3);font-family:Arial,sans-serif;font-size:11px;padding:7px 16px;border-radius:3px;cursor:pointer;">View ${stop.locationName} location page &#8594;</button>`;
    wrap.appendChild(locLink);
  }

  if (STATE.adminMode) {
    const editBtn = document.createElement('div');
    editBtn.style.cssText = 'margin-top:12px;text-align:center;';
    editBtn.innerHTML = `<button class="tl-edit-btn" style="display:inline-block;" onclick="editTimelineStop('${stop.id}')">Edit this stop</button>`;
    wrap.appendChild(editBtn);
  }

  return wrap;
}
