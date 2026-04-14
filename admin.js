/**
 * admin.js
 * Admin toggle, modal system, and all CRUD editor functions.
 * All writes go to Supabase via api.js helpers, then reload STATE.
 * Depends on: config.js, api.js
 */

// ── ADMIN TOGGLE ──────────────────────────────────────────────────────────────
function toggleAdmin() {
  if (STATE.adminMode) {
    STATE.adminMode = false;
    document.getElementById('app').classList.remove('admin-mode');
    document.getElementById('adminBar').classList.remove('show');
    render();
    return;
  }
  const pw = prompt('Enter admin password:');
  if (pw === STATE.adminPassword) {
    STATE.adminMode = true;
    document.getElementById('app').classList.add('admin-mode');
    document.getElementById('adminBar').classList.add('show');
    render();
  } else if (pw !== null) {
    alert('Incorrect password.');
  }
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function openModal(title, bodyHTML, actions) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML    = bodyHTML;
  document.getElementById('modalActions').innerHTML = '';
  actions.forEach(a => {
    const b = document.createElement('button');
    b.className   = a.cls || 'btn-save';
    b.textContent = a.label;
    b.onclick     = a.fn;
    document.getElementById('modalActions').appendChild(b);
  });
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ── SELECT HELPERS ────────────────────────────────────────────────────────────
function locationOptions(selectedId = '') {
  return STATE.locations
    .map(l => `<option value="${l.id}" ${l.id === selectedId ? 'selected' : ''}>${l.name}</option>`)
    .join('');
}
function bookOptions(selectedId = '') {
  return STATE.books
    .map(b => `<option value="${b.id}" ${b.id === selectedId ? 'selected' : ''}>${b.subtitle}: ${b.title}</option>`)
    .join('');
}
function themeOptions(selectedKey = '') {
  return Object.entries(BOOK_THEME_PRESETS)
    .map(([k, v]) => `<option value="${k}" ${k === selectedKey ? 'selected' : ''}>${v.name}</option>`)
    .join('');
}

// ── SITE EDITOR ───────────────────────────────────────────────────────────────
function openSiteEditor() {
  openModal('Edit site information', `
    <label>Site title</label>
    <input id="se_title" value="${STATE.siteTitle}">
    <label>Subtitle</label>
    <input id="se_sub" value="${STATE.siteSub}">
    <label>Author byline</label>
    <input id="se_author" value="${STATE.siteAuthor}">
    <label>Admin password (blank = keep current)</label>
    <input type="password" id="se_pw">
    <label>Last updated</label>
    <input id="se_date" value="${STATE.lastUpdated}">
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      STATE.siteTitle   = document.getElementById('se_title').value;
      STATE.siteSub     = document.getElementById('se_sub').value;
      STATE.siteAuthor  = document.getElementById('se_author').value;
      STATE.lastUpdated = document.getElementById('se_date').value;
      const pw = document.getElementById('se_pw').value;
      if (pw) STATE.adminPassword = pw;
      closeModal();
      showToast('Saving…');
      try { await saveSiteSettings(); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function openWeekEditor() {
  openModal('Update week & progress', `
    <label>Current week</label>
    <input type="number" id="wk_num" min="1" max="52" value="${STATE.week}">
    <label>Total weeks</label>
    <input type="number" id="wk_total" min="1" max="52" value="${STATE.totalWeeks}">
    <label>Last updated text</label>
    <input id="wk_date" value="${STATE.lastUpdated}">
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      STATE.week        = parseInt(document.getElementById('wk_num').value)   || 1;
      STATE.totalWeeks  = parseInt(document.getElementById('wk_total').value) || 6;
      STATE.lastUpdated = document.getElementById('wk_date').value;
      closeModal();
      showToast('Saving…');
      try { await saveSiteSettings(); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function openIntroEditor() {
  openModal('Edit map intro text', `
    <label>Headline</label>
    <input id="ie_title" value="${STATE.introTitle}">
    <label>Subtext (leave blank to hide)</label>
    <textarea id="ie_text">${STATE.introText}</textarea>
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      STATE.introTitle = document.getElementById('ie_title').value;
      STATE.introText  = document.getElementById('ie_text').value;
      closeModal();
      showToast('Saving…');
      try { await saveSiteSettings(); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function openBgEditor() {
  openModal('Edit background color', `
    <label>Background color (hex)</label>
    <input id="bg_color" value="${STATE.bgColor || '#1C1610'}">
    <p class="modal-hint">Timeline sections use their book theme colors automatically.</p>
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      STATE.bgColor = document.getElementById('bg_color').value || '#1C1610';
      closeModal();
      showToast('Saving…');
      try { await saveSiteSettings(); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function openFooterEditor() {
  openModal('Edit footer', `
    <label>Footer link text</label>
    <input id="fe_text" value="${STATE.footerText}">
    <label>Patreon URL</label>
    <input id="fe_url" value="${STATE.footerUrl}">
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      STATE.footerText = document.getElementById('fe_text').value;
      STATE.footerUrl  = document.getElementById('fe_url').value;
      closeModal();
      showToast('Saving…');
      try { await saveSiteSettings(); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

// ── BOOK EDITORS ──────────────────────────────────────────────────────────────
function addBook() {
  openModal('Add book / series entry', `
    <label>Book title</label>
    <input id="ab_title" placeholder="e.g. The Colonel's Daughter">
    <label>Subtitle / label</label>
    <input id="ab_sub" placeholder="e.g. Prequel">
    <label>Theme preset</label>
    <select id="ab_theme">${themeOptions()}</select>
    <label>Accent color (hex)</label>
    <input id="ab_color" value="#C8A84B">
    <p class="modal-hint">Theme presets control the palette shown on the timeline while in this book's section.</p>
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Add book', fn: async () => {
      const book = {
        id:       'b_' + Date.now(),
        title:    document.getElementById('ab_title').value,
        subtitle: document.getElementById('ab_sub').value,
        themeKey: document.getElementById('ab_theme').value,
        color:    document.getElementById('ab_color').value || '#C8A84B',
      };
      closeModal(); showToast('Saving…');
      try { await dbAddBook(book); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function editBook(bookId) {
  const b = STATE.books.find(x => x.id === bookId);
  openModal('Edit book: ' + b.title, `
    <label>Book title</label>
    <input id="eb_title" value="${b.title}">
    <label>Subtitle / label</label>
    <input id="eb_sub" value="${b.subtitle}">
    <label>Theme preset</label>
    <select id="eb_theme">${themeOptions(b.themeKey)}</select>
    <label>Accent color (hex)</label>
    <input id="eb_color" value="${b.color}">
  `, [
    { label: 'Delete book', cls: 'btn-danger', fn: async () => {
      if (!confirm('Delete this book? Timeline stops assigned to it will become unassigned.')) return;
      closeModal(); showToast('Deleting…');
      try { await dbDeleteBook(bookId); await saveAndRender(); }
      catch(e) { showToast('Delete failed', true); }
    }},
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      b.title    = document.getElementById('eb_title').value;
      b.subtitle = document.getElementById('eb_sub').value;
      b.themeKey = document.getElementById('eb_theme').value;
      b.color    = document.getElementById('eb_color').value;
      closeModal(); showToast('Saving…');
      try { await dbUpdateBook(b); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

// ── LOCATION EDITORS ──────────────────────────────────────────────────────────
function addLocation() {
  openModal('Add new location', `
    <label>Location name</label>
    <input id="al_name" placeholder="e.g. Oxford">
    <label>Icon</label>
    <input id="al_icon" placeholder="e.g. ✦" maxlength="2">
    <label>Type</label>
    <select id="al_type">
      <option value="mask">The Mask</option>
      <option value="truth">The Truth</option>
      <option value="locked">Locked / TBD</option>
    </select>
    <label>Role label</label>
    <input id="al_role" placeholder="e.g. The Mask">
    <label>Header background color (hex)</label>
    <input id="al_color" value="#1A1410">
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Add location', fn: async () => {
      const name = document.getElementById('al_name').value.trim();
      if (!name) return;
      const type    = document.getElementById('al_type').value;
      const roleVal = document.getElementById('al_role').value.trim();
      const loc = {
        id:          name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
        name,
        icon:        document.getElementById('al_icon').value || '+',
        type,
        role:        roleVal || (type === 'mask' ? 'The Mask' : type === 'truth' ? 'The Truth' : 'Locked'),
        category:    type === 'mask' ? 'THE MASK' : type === 'truth' ? 'THE TRUTH' : 'THE HORIZON',
        headerColor: document.getElementById('al_color').value || '#1A1410',
        status:      '0 of 6 revealed',
        updated:     '',
      };
      closeModal(); showToast('Saving…');
      try { await dbAddLocation(loc); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function editLocation(locId) {
  const loc = STATE.locations.find(l => l.id === locId);
  openModal('Edit location: ' + loc.name, `
    <label>Location name</label>
    <input id="el_name" value="${loc.name}">
    <label>Icon</label>
    <input id="el_icon" value="${loc.icon}" maxlength="2">
    <label>Type</label>
    <select id="el_type">
      <option value="mask"   ${loc.type==='mask'  ?'selected':''}>The Mask</option>
      <option value="truth"  ${loc.type==='truth' ?'selected':''}>The Truth</option>
      <option value="locked" ${loc.type==='locked'?'selected':''}>Locked / TBD</option>
    </select>
    <label>Role label</label>
    <input id="el_role" value="${loc.role}">
    <label>Category badge</label>
    <input id="el_cat" value="${loc.category}">
    <label>Header background color (hex)</label>
    <input id="el_color" value="${loc.headerColor}">
    <label>Status text</label>
    <input id="el_status" value="${loc.status}">
    <label>Last updated text</label>
    <input id="el_updated" value="${loc.updated}">
  `, [
    { label: 'Delete', cls: 'btn-danger', fn: async () => {
      if (!confirm('Delete this location? All its fragments and witnesses will also be deleted.')) return;
      closeModal(); showToast('Deleting…');
      try {
        await dbDeleteLocation(locId);
        STATE.currentView = 'map';
        await saveAndRender();
      } catch(e) { showToast('Delete failed', true); }
    }},
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      loc.name        = document.getElementById('el_name').value;
      loc.icon        = document.getElementById('el_icon').value;
      loc.type        = document.getElementById('el_type').value;
      loc.role        = document.getElementById('el_role').value;
      loc.category    = document.getElementById('el_cat').value;
      loc.headerColor = document.getElementById('el_color').value;
      loc.status      = document.getElementById('el_status').value;
      loc.updated     = document.getElementById('el_updated').value;
      closeModal(); showToast('Saving…');
      try { await dbUpdateLocation(loc); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

// ── FRAGMENT EDITORS ──────────────────────────────────────────────────────────
function addFragment(locId) {
  openModal('Add fragment', `
    <label>Fragment number / label</label>
    <input id="af_num" placeholder="e.g. 010">
    <label>Title</label>
    <input id="af_title" placeholder="e.g. The torn letter">
    <label>Description</label>
    <textarea id="af_desc"></textarea>
    <label>Status</label>
    <select id="af_locked">
      <option value="false">Revealed</option>
      <option value="true">Locked</option>
    </select>
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Add fragment', fn: async () => {
      const frag = {
        num:    document.getElementById('af_num').value   || '—',
        title:  document.getElementById('af_title').value,
        desc:   document.getElementById('af_desc').value,
        locked: document.getElementById('af_locked').value === 'true',
        img:    null,
      };
      closeModal(); showToast('Saving…');
      try { await dbAddFragment(locId, frag); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function editFragment(locId, fragIdx) {
  const loc  = STATE.locations.find(l => l.id === locId);
  const frag = loc.fragments[fragIdx];
  openModal('Edit fragment ' + frag.num, `
    <label>Fragment number</label>
    <input id="ef_num" value="${frag.num}">
    <label>Title</label>
    <input id="ef_title" value="${frag.title}">
    <label>Description</label>
    <textarea id="ef_desc">${frag.desc}</textarea>
    <label>Status</label>
    <select id="ef_locked">
      <option value="false" ${!frag.locked?'selected':''}>Revealed</option>
      <option value="true"  ${ frag.locked?'selected':''}>Locked</option>
    </select>
    <label>Clear image?</label>
    <select id="ef_clearimg">
      <option value="false">Keep image</option>
      <option value="true">Clear image</option>
    </select>
    <label>Promote to Timeline Detail</label>
    <select id="ef_promote">
      <option value="">— Do not promote —</option>
      ${STATE.timeline.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
    </select>
    <p class="modal-hint">Promoting moves this fragment to a timeline stop as a "detail."</p>
  `, [
    { label: 'Delete',  cls: 'btn-danger',  fn: async () => {
      closeModal(); showToast('Deleting…');
      try { await dbDeleteFragment(frag._id); await saveAndRender(); }
      catch(e) { showToast('Delete failed', true); }
    }},
    { label: 'Cancel',  cls: 'btn-cancel',  fn: closeModal },
    { label: 'Save', fn: async () => {
      const promoteToId = document.getElementById('ef_promote').value;
      const updated = {
        ...frag,
        num:    document.getElementById('ef_num').value,
        title:  document.getElementById('ef_title').value,
        desc:   document.getElementById('ef_desc').value,
        locked: document.getElementById('ef_locked').value === 'true',
        img:    document.getElementById('ef_clearimg').value === 'true' ? null : frag.img,
      };
      closeModal(); showToast('Saving…');
      try {
        if (promoteToId) {
          // Add as timeline detail then delete from fragments
          await dbAddTimelineDetail(promoteToId, updated);
          await dbDeleteFragment(frag._id);
        } else {
          await dbUpdateFragment(updated);
        }
        await saveAndRender();
      } catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function handleImageUpload(locId, fragIdx, input) {
  const file = input.files[0];
  if (!file) return;
  // Convert to base64 data URL (stored as img_url in Supabase)
  // For production, consider uploading to Supabase Storage instead
  const reader = new FileReader();
  reader.onload = async e => {
    const loc  = STATE.locations.find(l => l.id === locId);
    const frag = loc.fragments[fragIdx];
    const updated = { ...frag, img: e.target.result };
    showToast('Uploading image…');
    try { await dbUpdateFragment(updated); await saveAndRender(); }
    catch(err) { showToast('Upload failed', true); }
  };
  reader.readAsDataURL(file);
}

// ── WITNESS EDITORS ───────────────────────────────────────────────────────────
function addWitness(locId) {
  openModal('Add witness theory', `
    <label>Witness handle</label>
    <input id="aw_handle" placeholder="@username">
    <label>Theory</label>
    <textarea id="aw_theory" placeholder="Their theory in quotes..."></textarea>
    <label>Witness of Record?</label>
    <select id="aw_record">
      <option value="false">No</option>
      <option value="true">Yes</option>
    </select>
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Add theory', fn: async () => {
      const w = {
        handle: document.getElementById('aw_handle').value,
        theory: document.getElementById('aw_theory').value,
        record: document.getElementById('aw_record').value === 'true',
      };
      closeModal(); showToast('Saving…');
      try { await dbAddWitness(locId, w); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function editWitness(locId, wIdx) {
  const loc = STATE.locations.find(l => l.id === locId);
  const w   = loc.witnesses[wIdx];
  openModal('Edit witness theory', `
    <label>Handle</label>
    <input id="ew_handle" value="${w.handle}">
    <label>Theory</label>
    <textarea id="ew_theory">${w.theory}</textarea>
    <label>Witness of Record?</label>
    <select id="ew_record">
      <option value="false" ${!w.record?'selected':''}>No</option>
      <option value="true"  ${ w.record?'selected':''}>Yes</option>
    </select>
  `, [
    { label: 'Delete',  cls: 'btn-danger', fn: async () => {
      closeModal(); showToast('Deleting…');
      try { await dbDeleteWitness(w._id); await saveAndRender(); }
      catch(e) { showToast('Delete failed', true); }
    }},
    { label: 'Cancel',  cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      const updated = {
        ...w,
        handle: document.getElementById('ew_handle').value,
        theory: document.getElementById('ew_theory').value,
        record: document.getElementById('ew_record').value === 'true',
      };
      closeModal(); showToast('Saving…');
      try { await dbUpdateWitness(updated); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

// ── TIMELINE EDITORS ──────────────────────────────────────────────────────────
function addTimelineStop() {
  openModal('Add timeline stop', `
    <label>Book / series section</label>
    <select id="ts_book">${bookOptions()}</select>
    <label>Date / time label</label>
    <input id="ts_date" placeholder="e.g. Oxford, Michaelmas term">
    <label>Title</label>
    <input id="ts_title" placeholder="e.g. The first letter arrives">
    <label>Description</label>
    <textarea id="ts_desc"></textarea>
    <label>Icon (emoji or symbol)</label>
    <input id="ts_icon" placeholder="✦" maxlength="2">
    <label>Attached location (optional)</label>
    <select id="ts_loc"><option value="">— None —</option>${locationOptions()}</select>
    <label>Location name override (if no location selected)</label>
    <input id="ts_locname" placeholder="e.g. Oxford">
  `, [
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Add stop', fn: async () => {
      const locId = document.getElementById('ts_loc').value;
      const loc   = STATE.locations.find(l => l.id === locId);
      const stop  = {
        id:           'tl_' + Date.now(),
        bookId:       document.getElementById('ts_book').value,
        date:         document.getElementById('ts_date').value,
        title:        document.getElementById('ts_title').value,
        desc:         document.getElementById('ts_desc').value,
        icon:         document.getElementById('ts_icon').value || '✦',
        locationId:   locId,
        locationName: loc ? loc.name : document.getElementById('ts_locname').value,
      };
      closeModal(); showToast('Saving…');
      try { await dbAddTimelineStop(stop); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function editTimelineStop(stopId) {
  const s           = STATE.timeline.find(t => t.id === stopId);
  const detailCount = s.detailFragments ? s.detailFragments.length : 0;
  openModal('Edit timeline stop', `
    <label>Book / series section</label>
    <select id="es_book">${bookOptions(s.bookId)}</select>
    <label>Date / time label</label>
    <input id="es_date" value="${s.date}">
    <label>Title</label>
    <input id="es_title" value="${s.title}">
    <label>Description</label>
    <textarea id="es_desc">${s.desc}</textarea>
    <label>Icon</label>
    <input id="es_icon" value="${s.icon || '✦'}" maxlength="2">
    <label>Attached location</label>
    <select id="es_loc"><option value="">— None —</option>${locationOptions(s.locationId)}</select>
    <label>Location name override</label>
    <input id="es_locname" value="${s.locationName || ''}">
    <p class="modal-hint">${detailCount} detail fragment${detailCount !== 1 ? 's' : ''} attached to this stop.</p>
  `, [
    { label: 'Delete stop', cls: 'btn-danger', fn: async () => {
      if (!confirm('Delete this stop? Attached details will also be deleted.')) return;
      closeModal(); showToast('Deleting…');
      try { await dbDeleteTimelineStop(stopId); await saveAndRender(); }
      catch(e) { showToast('Delete failed', true); }
    }},
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      const locId = document.getElementById('es_loc').value;
      const loc   = STATE.locations.find(l => l.id === locId);
      const updated = {
        ...s,
        bookId:       document.getElementById('es_book').value,
        date:         document.getElementById('es_date').value,
        title:        document.getElementById('es_title').value,
        desc:         document.getElementById('es_desc').value,
        icon:         document.getElementById('es_icon').value || '✦',
        locationId:   locId,
        locationName: loc ? loc.name : document.getElementById('es_locname').value,
      };
      closeModal(); showToast('Saving…');
      try { await dbUpdateTimelineStop(updated); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}

function editDetailFragment(stopId, dIdx) {
  const stop   = STATE.timeline.find(t => t.id === stopId);
  const detail = stop.detailFragments[dIdx];
  openModal('Edit detail: ' + detail.title, `
    <label>Title</label>
    <input id="dd_title" value="${detail.title}">
    <label>Description</label>
    <textarea id="dd_desc">${detail.desc}</textarea>
    <label>Label / number</label>
    <input id="dd_num" value="${detail.num || ''}">
  `, [
    { label: 'Remove detail', cls: 'btn-danger', fn: async () => {
      closeModal(); showToast('Deleting…');
      try { await dbDeleteTimelineDetail(detail._id); await saveAndRender(); }
      catch(e) { showToast('Delete failed', true); }
    }},
    { label: 'Cancel', cls: 'btn-cancel', fn: closeModal },
    { label: 'Save', fn: async () => {
      const updated = {
        ...detail,
        title: document.getElementById('dd_title').value,
        desc:  document.getElementById('dd_desc').value,
        num:   document.getElementById('dd_num').value,
      };
      closeModal(); showToast('Saving…');
      try { await dbUpdateTimelineDetail(updated); await saveAndRender(); }
      catch(e) { showToast('Save failed', true); }
    }}
  ]);
}
