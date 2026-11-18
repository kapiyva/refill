-- Seed script for manual verification against the current note.sql conventions.
-- Builds a SQLite file with:
--   * memo_note       — note table (title optional, body required)
--   * memo_status     — property table, referenced as a single value via
--                       memo_note.status_id (declared FK)
--   * memo_tag        — property table, referenced as multiple values via the
--                       junction table memo_note_tag (no declared FKs: resolved
--                       by the Convention 4 naming rule)
--   * memo_meta       — version declaration (Convention 7); not a note or property table
--   * memo_recent_view — a view (must appear in the view section)
--
-- Generate with:
--   sqlite3 fixtures/test.db < fixtures/seed.sql

CREATE TABLE memo_status (
    id    TEXT PRIMARY KEY,
    label TEXT NOT NULL UNIQUE
);

CREATE TABLE memo_note (
    id         TEXT PRIMARY KEY,
    title      TEXT,
    body       TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    status_id  TEXT REFERENCES memo_status(id),
    source_url TEXT
);

CREATE TABLE memo_tag (
    id    TEXT PRIMARY KEY,
    label TEXT NOT NULL UNIQUE
);

CREATE TABLE memo_note_tag (
    note_id TEXT NOT NULL,
    tag_id  TEXT NOT NULL,
    PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE memo_meta (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL
);

CREATE VIEW memo_recent_view AS
    SELECT id, title, updated_at
    FROM memo_note
    ORDER BY updated_at DESC
    LIMIT 10;

INSERT INTO memo_meta (id, schema_version) VALUES (1, 1);

INSERT INTO memo_status (id, label) VALUES
    ('draft', 'Draft'),
    ('done',  'Done');

INSERT INTO memo_tag (id, label) VALUES
    ('t-design', 'design'),
    ('t-idea',   'idea');

INSERT INTO memo_note (id, title, body, created_at, updated_at, status_id, source_url) VALUES
    ('11111111-1111-1111-1111-111111111111', '最初のメモ', 'はじめての本文', '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z', 'draft', NULL),
    ('22222222-2222-2222-2222-222222222222', NULL, '見出しのない走り書き。' || char(10) || '二行目。', '2026-02-15T12:30:00Z', '2026-04-20T18:45:00Z', NULL, NULL),
    ('33333333-3333-3333-3333-333333333333', 'refill 設計メモ', '# 見出し' || char(10) || char(10) || '本文。', '2026-03-01T07:20:00Z', '2026-05-03T22:10:00Z', 'done', 'https://github.com/kapiyva/refill');

INSERT INTO memo_note_tag (note_id, tag_id) VALUES
    ('33333333-3333-3333-3333-333333333333', 't-design'),
    ('33333333-3333-3333-3333-333333333333', 't-idea'),
    ('11111111-1111-1111-1111-111111111111', 't-idea');
