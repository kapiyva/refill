import type { Database } from "./sqlite";

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

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
