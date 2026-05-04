-- Seed script for manual verification (Phase 1).
-- Builds a SQLite file with:
--   * basic_v1_notes — note table with a few rows (verifies detection + listing)
--   * basic_v1_tags  — non-note table (must NOT appear in the note section)
--   * basic_v1_v_recent — a view (must appear in the view section, non-clickable)
--
-- Generate with:
--   sqlite3 fixtures/test.db < fixtures/seed.sql

CREATE TABLE basic_v1_notes (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    body       TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE basic_v1_tags (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE VIEW basic_v1_v_recent AS
    SELECT id, title, updated_at
    FROM basic_v1_notes
    ORDER BY updated_at DESC
    LIMIT 10;

INSERT INTO basic_v1_notes (id, title, body, created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-111111111111', '最初のメモ',     'はじめての本文', '2026-01-10T09:00:00Z', '2026-01-10T09:00:00Z'),
    ('22222222-2222-2222-2222-222222222222', 'note.db について', NULL,           '2026-02-15T12:30:00Z', '2026-04-20T18:45:00Z'),
    ('33333333-3333-3333-3333-333333333333', 'refill 設計メモ', '# 見出し\n\n本文。', '2026-03-01T07:20:00Z', '2026-05-03T22:10:00Z');

INSERT INTO basic_v1_tags (name) VALUES ('design'), ('phase1');
