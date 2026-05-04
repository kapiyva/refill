import type { Database } from "./sqlite";

export type SqlValue = string | number | bigint | Uint8Array | null;
export type Record = { [column: string]: SqlValue };

export type NoteListItem = {
  id: string;
  title: string;
  updated_at: string;
};

export function listNotes(db: Database, tableName: string): NoteListItem[] {
  const quoted = quoteIdent(tableName);
  return db.selectObjects(
    `SELECT id, title, updated_at FROM ${quoted} ORDER BY updated_at DESC`,
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

export function insertRecord(
  db: Database,
  tableName: string,
  data: Record,
): void {
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

export function updateRecord(
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

export function deleteRecord(
  db: Database,
  tableName: string,
  id: string,
): void {
  db.exec({
    sql: `DELETE FROM ${quoteIdent(tableName)} WHERE id = ?`,
    bind: [id],
  });
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
