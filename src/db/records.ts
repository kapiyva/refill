import type { Database } from "./sqlite";
import type { MultiValueProperty } from "../types";
import { syncSelectedPropertyIds } from "./property";

export type SqlValue = string | number | bigint | Uint8Array | null;
export type Record = { [column: string]: SqlValue };

export type NoteListItem = {
  id: string;
  title: string | null;
  body_head: string;
  updated_at: string;
};

/** Multi-value selections keyed by junction table name. */
export type MultiValueSelection = { [junctionTable: string]: string[] };

export function listNotes(db: Database, tableName: string): NoteListItem[] {
  const quoted = quoteIdent(tableName);
  return db.selectObjects(
    `SELECT id, title, substr(body, 1, 200) AS body_head, updated_at
     FROM ${quoted} ORDER BY updated_at DESC`,
  ) as NoteListItem[];
}

export function getRecord(
  db: Database,
  tableName: string,
  id: string,
): Record | undefined {
  const row = db.selectObject(
    `SELECT * FROM ${quoteIdent(tableName)} WHERE id = ?`,
    [id],
  );
  return row as Record | undefined;
}

/**
 * Inserts or updates a note and its multi-value properties in one
 * transaction. `id` is required in `data` when inserting.
 */
export function saveNote(
  db: Database,
  tableName: string,
  target: { kind: "new" } | { kind: "edit"; id: string },
  data: Record,
  multiValueProperties: MultiValueProperty[],
  selection: MultiValueSelection,
): string {
  return inTransaction(db, () => {
    let id: string;
    if (target.kind === "new") {
      insertRecord(db, tableName, data);
      id = String(data.id);
    } else {
      updateRecord(db, tableName, target.id, data);
      id = target.id;
    }
    for (const mv of multiValueProperties) {
      const ids = selection[mv.junctionTable];
      if (ids) syncSelectedPropertyIds(db, mv, id, ids);
    }
    return id;
  });
}

/** Deletes a note together with the junction rows that point to it. */
export function deleteNote(
  db: Database,
  tableName: string,
  id: string,
  multiValueProperties: MultiValueProperty[],
): void {
  inTransaction(db, () => {
    for (const mv of multiValueProperties) {
      db.exec({
        sql: `DELETE FROM ${quoteIdent(mv.junctionTable)} WHERE ${quoteIdent(mv.noteColumn)} = ?`,
        bind: [id],
      });
    }
    db.exec({
      sql: `DELETE FROM ${quoteIdent(tableName)} WHERE id = ?`,
      bind: [id],
    });
  });
}

function insertRecord(db: Database, tableName: string, data: Record): void {
  const cols = Object.keys(data);
  if (cols.length === 0) {
    throw new Error("insertRecord: empty data");
  }
  const colList = cols.map(quoteIdent).join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  db.exec({
    sql: `INSERT INTO ${quoteIdent(tableName)} (${colList}) VALUES (${placeholders})`,
    bind: cols.map((c) => data[c]),
  });
}

function updateRecord(
  db: Database,
  tableName: string,
  id: string,
  data: Record,
): void {
  const cols = Object.keys(data);
  if (cols.length === 0) return;
  const setClause = cols.map((c) => `${quoteIdent(c)} = ?`).join(", ");
  const bind: SqlValue[] = cols.map((c) => data[c]);
  bind.push(id);
  db.exec({
    sql: `UPDATE ${quoteIdent(tableName)} SET ${setClause} WHERE id = ?`,
    bind,
  });
}

function inTransaction<T>(db: Database, fn: () => T): T {
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // best effort: surface the original error
    }
    throw e;
  }
}

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
