import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

type Sqlite3 = Awaited<ReturnType<typeof sqlite3InitModule>>;
export type Database = InstanceType<Sqlite3["oo1"]["DB"]>;

// SQLite file format header offsets (see https://www.sqlite.org/fileformat.html).
// Both bytes carry the journal mode: 1 = rollback, 2 = WAL.
const HEADER_WRITE_VERSION_OFFSET = 18;
const HEADER_READ_VERSION_OFFSET = 19;
const JOURNAL_MODE_WAL = 2;
const JOURNAL_MODE_ROLLBACK = 1;

export type FileHeader = {
  writeVersion: number;
  readVersion: number;
};

export type LoadResult = {
  db: Database;
  originalHeader: FileHeader;
};

let sqlite3Promise: Promise<Sqlite3> | null = null;

export function initSqlite(): Promise<Sqlite3> {
  if (!sqlite3Promise) {
    sqlite3Promise = sqlite3InitModule();
  }
  return sqlite3Promise;
}

export async function loadDatabase(bytes: Uint8Array): Promise<LoadResult> {
  const sqlite3 = await initSqlite();

  // WAL を示すバイトはロールバックに倒してから deserialize に渡す。
  // sqlite-wasm の memdb VFS には WAL サイドカーを置く場所がなく、
  // WAL のままだと open 時に SQLITE_CANTOPEN になるため。元の値は
  // originalHeader に控えて export 時に復元する。
  const originalHeader: FileHeader = {
    writeVersion: bytes[HEADER_WRITE_VERSION_OFFSET],
    readVersion: bytes[HEADER_READ_VERSION_OFFSET],
  };
  if (bytes[HEADER_WRITE_VERSION_OFFSET] === JOURNAL_MODE_WAL) {
    bytes[HEADER_WRITE_VERSION_OFFSET] = JOURNAL_MODE_ROLLBACK;
  }
  if (bytes[HEADER_READ_VERSION_OFFSET] === JOURNAL_MODE_WAL) {
    bytes[HEADER_READ_VERSION_OFFSET] = JOURNAL_MODE_ROLLBACK;
  }

  const db = new sqlite3.oo1.DB(":memory:", "c");
  const ptr = sqlite3.wasm.allocFromTypedArray(bytes);
  const flags =
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
    sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE;
  const rc = sqlite3.capi.sqlite3_deserialize(
    db,
    "main",
    ptr,
    bytes.byteLength,
    bytes.byteLength,
    flags,
  );
  if (rc !== 0) {
    db.close();
    throw new Error(`sqlite3_deserialize failed: rc=${rc}`);
  }
  return { db, originalHeader };
}

export async function createEmptyDatabase(): Promise<Database> {
  const sqlite3 = await initSqlite();
  return new sqlite3.oo1.DB(":memory:", "c");
}

export async function exportDatabase(
  db: Database,
  originalHeader?: FileHeader,
): Promise<Uint8Array> {
  const sqlite3 = await initSqlite();
  const bytes = sqlite3.capi.sqlite3_js_db_export(db);
  if (originalHeader) {
    bytes[HEADER_WRITE_VERSION_OFFSET] = originalHeader.writeVersion;
    bytes[HEADER_READ_VERSION_OFFSET] = originalHeader.readVersion;
  }
  return bytes;
}
