-- ═══════════════════════════════════════════════════════════════════
--  THE SENATOR'S WIFE ARCHIVES — Supabase Schema
--  Run this entire file in your Supabase SQL Editor (once).
-- ═══════════════════════════════════════════════════════════════════

-- ── SITE SETTINGS (single-row config table) ──────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforces single row
  site_title    TEXT    NOT NULL DEFAULT '✦   The Senator''s Wife Archives   ✦',
  site_sub      TEXT    NOT NULL DEFAULT 'A Living Narrative Map for The Senator''s Wife Series',
  site_author   TEXT    NOT NULL DEFAULT 'by Jen Lyon',
  intro_title   TEXT    NOT NULL DEFAULT 'You only think you know the whole story.',
  intro_text    TEXT             DEFAULT '',
  footer_text   TEXT    NOT NULL DEFAULT 'Join us on Patreon to uncover the truth.',
  footer_url    TEXT    NOT NULL DEFAULT 'https://www.patreon.com/cw/JenLyonAuthor',
  bg_color      TEXT    NOT NULL DEFAULT '#1C1610',
  week          INTEGER NOT NULL DEFAULT 1,
  total_weeks   INTEGER NOT NULL DEFAULT 6,
  last_updated  TEXT    NOT NULL DEFAULT 'Oct 18, 2024',
  admin_password TEXT   NOT NULL DEFAULT 'archive2024'
);

-- Seed the single settings row
INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;


-- ── BOOKS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id         TEXT PRIMARY KEY,               -- e.g. 'b1'
  title      TEXT    NOT NULL,
  subtitle   TEXT    NOT NULL DEFAULT '',
  theme_key  TEXT    NOT NULL DEFAULT 'senators_wife',
  color      TEXT    NOT NULL DEFAULT '#C8A84B',
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO books (id, title, subtitle, theme_key, color, sort_order) VALUES
  ('b1', 'The Colonel''s Daughter', 'Prequel',     'colonels_daughter',  '#B8860B', 1),
  ('b2', 'The Senator''s Wife',     'Book One',    'senators_wife',      '#C8A84B', 2),
  ('b3', 'Caught Sleeping',         'Book Two',    'caught_sleeping',    '#9090C0', 3),
  ('b4', 'The Whistleblower',       'Book Three',  'the_whistleblower',  '#A0B0B8', 4)
ON CONFLICT (id) DO NOTHING;


-- ── LOCATIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id           TEXT PRIMARY KEY,             -- e.g. 'dc', 'sf'
  name         TEXT    NOT NULL,
  icon         TEXT    NOT NULL DEFAULT '+',
  type         TEXT    NOT NULL DEFAULT 'locked' CHECK (type IN ('mask','truth','locked')),
  role         TEXT    NOT NULL DEFAULT 'Locked',
  category     TEXT    NOT NULL DEFAULT '',
  header_color TEXT    NOT NULL DEFAULT '#1A1410',
  status       TEXT    NOT NULL DEFAULT '0 of 6 revealed',
  updated      TEXT    NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0
);

INSERT INTO locations (id, name, icon, type, role, category, header_color, status, updated, sort_order) VALUES
  ('dc',        'Washington D.C.',  '☗', 'mask',   'The Mask',  'THE MASK',  '#1E0E0A', '1 of 6 revealed',    'Fri Oct 18', 1),
  ('sf',        'San Francisco',    '⛏', 'truth',  'The Truth', 'THE TRUTH', '#0E1A10', '2 of 6 revealed',    'Fri Oct 18', 2),
  ('london',    'London',           '⏰', 'mask',   'The Mask',  'THE MASK',  '#1A1410', '0 of 6 revealed',    'Coming Tue Oct 22', 3),
  ('daufuskie', 'Daufuskie Island', '✿', 'truth',  'The Truth', 'THE TRUTH', '#101A10', 'Locked',             'Week 3', 4),
  ('tbd',       'Location TBD',     '+', 'locked', 'Locked',    '',          '#1A1A1A', 'Locked',             '', 5)
ON CONFLICT (id) DO NOTHING;


-- ── FRAGMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fragments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT    NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  num         TEXT    NOT NULL DEFAULT '—',
  title       TEXT    NOT NULL DEFAULT '',
  description TEXT    NOT NULL DEFAULT '',
  locked      BOOLEAN NOT NULL DEFAULT false,
  img_url     TEXT             DEFAULT NULL,  -- public URL (Supabase Storage or external)
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO fragments (location_id, num, title, description, locked, sort_order) VALUES
  ('dc',  '001', 'The soiled napkin',      'A white cloth napkin, folded once. A faint cognac ring in the lower right corner. A single thread pulled loose from the monogrammed crest.', false, 1),
  ('dc',  '003', 'Drops Tuesday, Oct 22',  'Awaiting release.',  false, 2),
  ('dc',  '005', 'Unrevealed',             '',                   true,  3),
  ('sf',  '002', 'The boarding pass',      'Washington Dulles to San Francisco International. Name redacted. Departure 8:47 PM — during the gala.', false, 1),
  ('sf',  '007', 'The sketchbook margin',  'A torn notebook page covered in doodles — arcs, ellipses, spirals. A set of coordinates, crossed out twice.', false, 2),
  ('london', '004', 'The gala program',    'An engraved event program — ivory cardstock. One name underlined in pencil.', false, 1),
  ('daufuskie', '—', 'Fragments arriving Week 3', '', true, 1);


-- ── WITNESSES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS witnesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id TEXT    NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  handle      TEXT    NOT NULL,
  theory      TEXT    NOT NULL DEFAULT '',
  is_record   BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

INSERT INTO witnesses (location_id, handle, theory, is_record, sort_order) VALUES
  ('dc', '@archivistmiranda', '"She sent a decoy. The name in the program is a plant — look at the font kerning."',            true,  1),
  ('dc', '@redactionhunter',  '"The gold seal is from a printer in Georgetown. Cross-ref with Fragment 002."',                  false, 2),
  ('dc', '@truthlinejen',     '"CAT. Her initials. The three letters are CAT — Catharine A. something."',                       false, 3),
  ('sf', '@fogcityreader',    '"SFO. The letters are S-F-O — she wrote her destination."',                                     true,  1);


-- ── TIMELINE STOPS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timeline_stops (
  id            TEXT PRIMARY KEY,             -- e.g. 'tl1'
  book_id       TEXT             REFERENCES books(id) ON DELETE SET NULL,
  date_label    TEXT    NOT NULL DEFAULT '',
  title         TEXT    NOT NULL DEFAULT '',
  description   TEXT    NOT NULL DEFAULT '',
  icon          TEXT    NOT NULL DEFAULT '✦',
  location_id   TEXT             REFERENCES locations(id) ON DELETE SET NULL,
  location_name TEXT    NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0
);

INSERT INTO timeline_stops (id, book_id, date_label, title, description, icon, location_id, location_name, sort_order) VALUES
  ('tl1', 'b1', 'Oxford, Michaelmas term', 'The first letter arrives',
   'It comes in a cream envelope, Oxford postmark. She reads it twice and burns it. The second letter she keeps.',
   '✦', NULL, 'Oxford', 1),
  ('tl2', 'b2', 'Six years ago', 'The announcement rally',
   'Catharine stands beside her husband at the podium. She is photographed smiling. She is not smiling.',
   '⚖', 'dc', 'Washington D.C.', 2),
  ('tl3', 'b2', 'Four years ago', 'The dinner in Georgetown',
   'A private dinner. Three attendees. Only two are named in the record. The third signed in under a different name.',
   '⚙', 'dc', 'Washington D.C.', 3),
  ('tl4', 'b2', 'Eighteen months ago', 'The San Francisco conference',
   'She travels alone. The itinerary lists three meetings. The hotel log shows a fourth.',
   '⛿', 'sf', 'San Francisco', 4)
ON CONFLICT (id) DO NOTHING;


-- ── TIMELINE DETAIL FRAGMENTS ────────────────────────────────────
-- These are fragments attached directly to a timeline stop
-- (promoted from location fragments or created directly)
CREATE TABLE IF NOT EXISTS timeline_details (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id    TEXT    NOT NULL REFERENCES timeline_stops(id) ON DELETE CASCADE,
  num        TEXT             DEFAULT '',
  title      TEXT    NOT NULL DEFAULT '',
  description TEXT   NOT NULL DEFAULT '',
  img_url    TEXT             DEFAULT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);


-- ═══════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
--  Public can READ everything.
--  Writes are gated by the app (admin password check client-side).
--  For stronger security, add a Supabase Edge Function or service key.
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE site_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE books            ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE witnesses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_stops   ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_details ENABLE ROW LEVEL SECURITY;

-- Allow public reads on all tables
CREATE POLICY "public read site_settings"    ON site_settings    FOR SELECT USING (true);
CREATE POLICY "public read books"            ON books            FOR SELECT USING (true);
CREATE POLICY "public read locations"        ON locations        FOR SELECT USING (true);
CREATE POLICY "public read fragments"        ON fragments        FOR SELECT USING (true);
CREATE POLICY "public read witnesses"        ON witnesses        FOR SELECT USING (true);
CREATE POLICY "public read timeline_stops"   ON timeline_stops   FOR SELECT USING (true);
CREATE POLICY "public read timeline_details" ON timeline_details FOR SELECT USING (true);

-- Allow anon to write (admin password enforced client-side)
CREATE POLICY "anon write site_settings"    ON site_settings    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon write books"            ON books            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon write locations"        ON locations        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon write fragments"        ON fragments        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon write witnesses"        ON witnesses        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon write timeline_stops"   ON timeline_stops   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon write timeline_details" ON timeline_details FOR ALL USING (true) WITH CHECK (true);
