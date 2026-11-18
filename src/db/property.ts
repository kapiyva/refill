import type { Database } from "./sqlite";
import type { MultiValueProperty } from "../types";
import { quoteIdent } from "./records";

export type PropertyOption = { id: string; label: string };

/** All vocabulary rows of a property table, ordered by label. */
export function listPropertyOptions(
  db: Database,
  propertyTable: string,
): PropertyOption[] {
  return (
    db.selectObjects(
      `SELECT id, label FROM ${quoteIdent(propertyTable)} ORDER BY label, id`,
    ) as { id: unknown; label: unknown }[]
  ).map((r) => ({ id: String(r.id), label: String(r.label ?? "") }));
}

/**
 * Adds a vocabulary row with only the columns note.sql defines; Convention 5
 * guarantees every other column is nullable or has a default.
 */
export function insertPropertyOption(
  db: Database,
  propertyTable: string,
  label: string,
): PropertyOption {
  const id = crypto.randomUUID();
  db.exec({
    sql: `INSERT INTO ${quoteIdent(propertyTable)} (id, label) VALUES (?, ?)`,
    bind: [id, label],
  });
  return { id, label };
}

/** Property ids a note currently holds through a junction table. */
export function listSelectedPropertyIds(
  db: Database,
  mv: MultiValueProperty,
  noteId: string,
): string[] {
  return (
    db.selectObjects(
      `SELECT ${quoteIdent(mv.propertyColumn)} AS pid
       FROM ${quoteIdent(mv.junctionTable)}
       WHERE ${quoteIdent(mv.noteColumn)} = ?`,
      [noteId],
    ) as { pid: unknown }[]
  ).map((r) => String(r.pid));
}

/** Makes the junction rows for `noteId` match `propertyIds` exactly. */
export function syncSelectedPropertyIds(
  db: Database,
  mv: MultiValueProperty,
  noteId: string,
  propertyIds: string[],
): void {
  const current = new Set(listSelectedPropertyIds(db, mv, noteId));
  const next = new Set(propertyIds);
  const table = quoteIdent(mv.junctionTable);
  const noteCol = quoteIdent(mv.noteColumn);
  const propCol = quoteIdent(mv.propertyColumn);
  for (const id of current) {
    if (next.has(id)) continue;
    db.exec({
      sql: `DELETE FROM ${table} WHERE ${noteCol} = ? AND ${propCol} = ?`,
      bind: [noteId, id],
    });
  }
  for (const id of next) {
    if (current.has(id)) continue;
    db.exec({
      sql: `INSERT INTO ${table} (${noteCol}, ${propCol}) VALUES (?, ?)`,
      bind: [noteId, id],
    });
  }
}
