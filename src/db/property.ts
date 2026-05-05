import type { Database } from "./sqlite";
import type { Record, SqlValue } from "./records";

export type PropertyRow = Record & { rowid: number };

export function listPropertyRows(
  db: Database,
  tableName: string,
  fkColumn: string,
  noteId: string,
): PropertyRow[] {
  const rows = db.selectObjects(
    `SELECT rowid, * FROM ${quoteIdent(tableName)} WHERE ${quoteIdent(fkColumn)} = ? ORDER BY rowid`,
    [noteId],
  );
  return rows as PropertyRow[];
}

export function insertPropertyRow(
  db: Database,
  tableName: string,
  data: Record,
): void {
  const cols = Object.keys(data);
  if (cols.length === 0) {
    throw new Error("insertPropertyRow: empty data");
  }
  const colList = cols.map(quoteIdent).join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  db.exec({
    sql: `INSERT INTO ${quoteIdent(tableName)} (${colList}) VALUES (${placeholders})`,
    bind: cols.map((c) => data[c]),
  });
}

export function updatePropertyRow(
  db: Database,
  tableName: string,
  rowid: number,
  data: Record,
): void {
  const cols = Object.keys(data);
  if (cols.length === 0) return;
  const setClause = cols.map((c) => `${quoteIdent(c)} = ?`).join(", ");
  const bind: SqlValue[] = cols.map((c) => data[c]);
  bind.push(rowid);
  db.exec({
    sql: `UPDATE ${quoteIdent(tableName)} SET ${setClause} WHERE rowid = ?`,
    bind,
  });
}

export function deletePropertyRow(
  db: Database,
  tableName: string,
  rowid: number,
): void {
  db.exec({
    sql: `DELETE FROM ${quoteIdent(tableName)} WHERE rowid = ?`,
    bind: [rowid],
  });
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
