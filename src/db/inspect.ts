import type { Database } from "./sqlite";
import {
  NOTE_TABLE_REQUIRED_COLUMNS,
  type DatabaseInspection,
  type NoteTable,
  type RelatedTable,
  type ViewInfo,
} from "../types";

type MasterRow = { name: string; type: "table" | "view" };
type FkRow = { from: string; table: string; to: string };

export function inspectDatabase(db: Database): DatabaseInspection {
  const entries = db.selectObjects(
    `SELECT name, type FROM sqlite_master
     WHERE type IN ('table', 'view')
       AND name NOT LIKE 'sqlite_%'
     ORDER BY name`,
  ) as MasterRow[];

  const tables = entries.filter((e) => e.type === "table");
  const views: ViewInfo[] = entries
    .filter((e) => e.type === "view")
    .map((e) => ({ name: e.name }));

  const allTableColumns = new Map<string, string[]>();
  for (const t of tables) {
    allTableColumns.set(t.name, columnsOf(db, t.name));
  }

  const noteTableNames = new Set(
    [...allTableColumns.entries()]
      .filter(([, cols]) => isNoteTable(cols))
      .map(([name]) => name),
  );

  const relatedByNoteTable = new Map<string, RelatedTable[]>();
  for (const noteName of noteTableNames) {
    relatedByNoteTable.set(noteName, []);
  }

  for (const [tableName, columns] of allTableColumns) {
    if (!columns.includes("note_id") || !columns.includes("label")) continue;
    const fks = db.selectObjects(
      `SELECT "from", "table", "to" FROM pragma_foreign_key_list(?)`,
      [tableName],
    ) as FkRow[];
    for (const fk of fks) {
      if (
        fk.from === "note_id" &&
        fk.to === "id" &&
        noteTableNames.has(fk.table)
      ) {
        relatedByNoteTable.get(fk.table)!.push({
          name: tableName,
          fkColumn: "note_id",
          columns,
        });
        break;
      }
    }
  }

  const noteTables: NoteTable[] = [];
  for (const [name, columns] of allTableColumns) {
    if (!noteTableNames.has(name)) continue;
    noteTables.push({
      name,
      columns,
      relatedTables: relatedByNoteTable.get(name) ?? [],
    });
  }

  return { noteTables, views };
}

function columnsOf(db: Database, tableName: string): string[] {
  return db
    .selectObjects(`SELECT name FROM pragma_table_info(?)`, [tableName])
    .map((row) => row.name as string);
}

function isNoteTable(columns: string[]): boolean {
  const set = new Set(columns);
  return NOTE_TABLE_REQUIRED_COLUMNS.every((c) => set.has(c));
}
