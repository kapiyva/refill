# refill

A plain, self-contained editor for [note.sql](https://github.com/kapiyva/note.sql) SQLite files.

English | [日本語](README.ja.md)

## Overview

refill reads and writes any SQLite file that follows the note.sql conventions, entirely in the browser.
Its purpose is to guarantee that a note.sql file can always be opened, read and edited, anywhere.

- **One file** — [`refill.html`](refill.html) is the whole program. No build step, no install, no server.
- **Works offline, even from disk** — The official SQLite WebAssembly build and Preact are embedded. Nothing is fetched, and nothing leaves the page.
- **Format-agnostic** — Works with any note.sql–conforming format, from the schema alone. No format-specific code.
- **A reference implementation** — Plain code, meant to show how the note.sql conventions translate into a working tool.

## Use it

- **On the web** — open the hosted copy (GitHub Pages) and pick a file. It can be installed as an app (PWA); on Chromium-based browsers the installed app can also open `.db` / `.sqlite` files from the OS.
- **Offline, without this site** — download `refill.html` once and keep it with your notes. Double-click it to open it in any modern browser.

Saving writes back to the opened file on Chromium-based browsers (File System Access API). Other browsers save by downloading a copy.

## Features

- Open a SQLite file (file picker or drag & drop)
- Start a new file, or add a format to an open one, from a `format.sql` (local file or GitHub URL)
- Auto-detection of note tables (Convention 1), property tables and their references (Convention 4), and views
- Notes: list, read, write, create, delete. `title` is optional; untitled notes are listed by their first body line
- Properties per Convention 4: single-value references as a label picker, multi-value references (junction tables) as label toggles, and adding new labels to a vocabulary. Other columns are edited as raw values, NULL included
- Read-only display of views
- WAL-mode files are opened and saved without changing their journal mode. They are always saved as a download, never over the original, because a `-wal` file next to it could otherwise be replayed onto the new contents

## Development

Edit `refill.html` directly and reload the page. There is nothing to build.

Node is only needed to refresh the embedded libraries at the end of `refill.html`:

```bash
npm install      # pinned versions in package.json
npm run vendor   # rewrites the vendor blocks in refill.html
```

A verification fixture can be generated with:

```bash
sqlite3 fixtures/test.db < fixtures/seed.sql
```

`pwa/` holds the files that make the hosted copy installable and available offline (manifest, service worker, icons). `refill.html` works without them.

## Embedded libraries

- [@sqlite.org/sqlite-wasm](https://sqlite.org/wasm) — the official SQLite WebAssembly build, embedded unmodified (Apache-2.0 wrapper; SQLite itself is public domain)
- [htm](https://github.com/developit/htm) with [Preact](https://preactjs.com/) — UI without a build step (Apache-2.0 / MIT)

## License

[MIT](LICENSE)

## See also

- [note.sql](https://github.com/kapiyva/note.sql) — the conventions refill targets
