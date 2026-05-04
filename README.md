# refill

A browser-native client for [note.db](https://github.com/kapiyva/notedb) SQLite files.

English | [日本語](README.ja.md)

## Overview

refill reads and writes any SQLite file that follows the note.db conventions, entirely in the browser.

- **Fully client-side** — WASM SQLite runs in the browser. Nothing leaves the page.
- **Statically hostable** — Deployable to GitHub Pages, Cloudflare Pages, or any static host.
- **Format-agnostic** — Works with any note.db–conforming format. No format-specific code.
- **A reference implementation** — Minimal dependencies and plain code, intended to show how note.db conventions translate into a working tool.

## Features

- Open a local SQLite file (file picker or drag & drop)
- Apply a format from a GitHub URL pointing to `format.sql`
- Auto-detection of note tables, related tables, and views
- CRUD on note records — Markdown editor + property panel (with NULL representation)
- Sub-form editor for related tables (per Convention 5: `note_id` + `label`)
- Read-only display of views
- Save the modified database back to disk (download)

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173/. Drop a SQLite file, or paste a GitHub URL pointing to a `format.sql`.

A minimal verification fixture can be generated:

```bash
sqlite3 fixtures/test.db < fixtures/seed.sql
```

## Stack

- React 18 + Vite 6 + TypeScript
- Tailwind CSS v4
- [`@sqlite.org/sqlite-wasm`](https://github.com/sqlite/sqlite-wasm) — official WASM SQLite
- [`marked`](https://github.com/markedjs/marked) + [`dompurify`](https://github.com/cure53/DOMPurify) — Markdown rendering with sanitization

## License

[MIT](LICENSE)

## See also

- [note.db](https://github.com/kapiyva/notedb) — the conventions refill targets
