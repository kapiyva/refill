import type { Database } from "./sqlite";
import type { Record } from "./records";

export type ViewData = {
  columns: string[];
  rows: Record[];
};

export function listViewRows(db: Database, viewName: string): ViewData {
  const columns = db
    .selectObjects(`SELECT name FROM pragma_table_info(?)`, [viewName])
    .map((r) => r.name as string);
  const rows = db.selectObjects(
    `SELECT * FROM ${quoteIdent(viewName)}`,
  ) as Record[];
  return { columns, rows };
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}
