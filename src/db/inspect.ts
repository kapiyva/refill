import type { Database } from "./sqlite";
import {
  NOTE_TABLE_REQUIRED_COLUMNS,
  PROPERTY_TABLE_REQUIRED_COLUMNS,
  type ColumnInfo,
  type DatabaseInspection,
  type MultiValueProperty,
  type NoteTable,
  type SingleValueProperty,
  type ViewInfo,
} from "../types";

type MasterRow = { name: string; type: "table" | "view" };
type ColumnRow = { name: string; notnull: number; dflt_value: unknown };
type FkRow = { from: string; table: string; to: string | null };

/**
 * Detects note tables (Convention 1), property tables and their two reference
 * patterns (Convention 4) from the schema alone. Table names are never
 * pattern-matched for detection; the `<name>_id` naming rule is only used to
 * resolve a reference when the column carries no declared foreign key.
 */
export function inspectDatabase(db: Database): DatabaseInspection {
  const entries = db.selectObjects(
    `SELECT name, type FROM sqlite_master
     WHERE type IN ('table', 'view')
       AND name NOT LIKE 'sqlite_%'
     ORDER BY name`,
  ) as MasterRow[];

  const tableNames = entries.filter((e) => e.type === "table").map((e) => e.name);
  const views: ViewInfo[] = entries
    .filter((e) => e.type === "view")
    .map((e) => ({ name: e.name }));

  const columns = new Map<string, ColumnInfo[]>();
  for (const name of tableNames) columns.set(name, columnsOf(db, name));

  const has = (table: string, required: readonly string[]) => {
    const set = new Set(columns.get(table)!.map((c) => c.name));
    return required.every((c) => set.has(c));
  };
  const noteNames = new Set(
    tableNames.filter((t) => has(t, NOTE_TABLE_REQUIRED_COLUMNS)),
  );
  const propertyNames = new Set(
    tableNames.filter(
      (t) => !noteNames.has(t) && has(t, PROPERTY_TABLE_REQUIRED_COLUMNS),
    ),
  );

  const referenceTargets = new Set([...noteNames, ...propertyNames]);
  const references = new Map<string, Map<string, string>>();
  for (const name of tableNames) {
    references.set(
      name,
      resolveReferences(db, name, columns.get(name)!, referenceTargets),
    );
  }

  const noteTables: NoteTable[] = [...noteNames].map((name) => {
    const singleValueProperties: SingleValueProperty[] = [];
    for (const col of columns.get(name)!) {
      const target = references.get(name)!.get(col.name);
      if (target && propertyNames.has(target)) {
        singleValueProperties.push({
          column: col.name,
          nullable: !col.notNull,
          propertyTable: target,
        });
      }
    }
    return {
      name,
      columns: columns.get(name)!,
      singleValueProperties,
      multiValueProperties: [],
    };
  });

  // A junction table is neither a note table nor a property table and holds
  // exactly one reference to a note table and one to a property table.
  for (const name of tableNames) {
    if (noteNames.has(name) || propertyNames.has(name)) continue;
    const refs = [...references.get(name)!.entries()];
    const toNote = refs.filter(([, t]) => noteNames.has(t));
    const toProperty = refs.filter(([, t]) => propertyNames.has(t));
    if (toNote.length !== 1 || toProperty.length !== 1) continue;
    const mv: MultiValueProperty = {
      junctionTable: name,
      noteColumn: toNote[0][0],
      propertyColumn: toProperty[0][0],
      propertyTable: toProperty[0][1],
    };
    noteTables.find((n) => n.name === toNote[0][1])!.multiValueProperties.push(mv);
  }

  return {
    noteTables,
    propertyTables: [...propertyNames].map((name) => ({ name })),
    views,
  };
}

function columnsOf(db: Database, tableName: string): ColumnInfo[] {
  return (
    db.selectObjects(
      `SELECT name, "notnull", dflt_value FROM pragma_table_info(?)`,
      [tableName],
    ) as ColumnRow[]
  ).map((r) => ({
    name: r.name,
    notNull: r.notnull === 1,
    hasDefault: r.dflt_value !== null,
  }));
}

/**
 * Maps each `<name>_id` column of `table` to the note or property table it
 * refers to. A declared foreign key to `id` wins. Without one, the column
 * falls back to the Convention 4 naming rule: `<name>_id` refers to
 * `<prefix><name>` where `<prefix>` is a leading `..._` part of `table`'s own
 * name (the longest such match is taken).
 */
function resolveReferences(
  db: Database,
  table: string,
  cols: ColumnInfo[],
  targets: Set<string>,
): Map<string, string> {
  const result = new Map<string, string>();
  const fks = db.selectObjects(
    `SELECT "from", "table", "to" FROM pragma_foreign_key_list(?)`,
    [table],
  ) as FkRow[];
  const declared = new Map<string, string>();
  for (const fk of fks) {
    if (fk.to === null || fk.to === "id") declared.set(fk.from, fk.table);
  }

  const prefixes: string[] = [];
  for (let i = table.indexOf("_"); i !== -1; i = table.indexOf("_", i + 1)) {
    prefixes.push(table.slice(0, i + 1));
  }
  prefixes.reverse();

  for (const col of cols) {
    if (col.name === "id" || !col.name.endsWith("_id")) continue;
    const fkTarget = declared.get(col.name);
    if (fkTarget !== undefined) {
      if (targets.has(fkTarget)) result.set(col.name, fkTarget);
      continue;
    }
    const stem = col.name.slice(0, -"_id".length);
    const match = prefixes.map((p) => p + stem).find((t) => targets.has(t));
    if (match && match !== table) result.set(col.name, match);
  }
  return result;
}
