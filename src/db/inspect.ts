import type { Database } from "./sqlite";
import {
  NOTE_TABLE_REQUIRED_COLUMNS,
  type DatabaseInspection,
  type NoteTable,
  type ViewInfo,
} from "../types";

type MasterRow = { name: string; type: "table" | "view" };

export function inspectDatabase(db: Database): DatabaseInspection {
  const entries = db.selectObjects(
    `SELECT name, type FROM sqlite_master
     WHERE type IN ('table', 'view')
       AND name NOT LIKE 'sqlite_%'
     ORDER BY name`,
  ) as MasterRow[];

  const noteTables: NoteTable[] = [];
  const views: ViewInfo[] = [];

  for (const entry of entries) {
    if (entry.type === "view") {
      views.push({ name: entry.name });
      continue;
    }
    const columns = db
      .selectObjects(`SELECT name FROM pragma_table_info(?)`, [entry.name])
      .map((row) => row.name as string);
    if (isNoteTable(columns)) {
      noteTables.push({ name: entry.name, columns });
    }
  }

  return { noteTables, views };
}

function isNoteTable(columns: string[]): boolean {
  const set = new Set(columns);
  return NOTE_TABLE_REQUIRED_COLUMNS.every((c) => set.has(c));
}
