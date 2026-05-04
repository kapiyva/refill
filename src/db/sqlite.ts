import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

type Sqlite3 = Awaited<ReturnType<typeof sqlite3InitModule>>;
export type Database = InstanceType<Sqlite3["oo1"]["DB"]>;

let sqlite3Promise: Promise<Sqlite3> | null = null;

export function initSqlite(): Promise<Sqlite3> {
  if (!sqlite3Promise) {
    sqlite3Promise = sqlite3InitModule();
  }
  return sqlite3Promise;
}

export async function loadDatabase(bytes: Uint8Array): Promise<Database> {
  const sqlite3 = await initSqlite();
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
  return db;
}
