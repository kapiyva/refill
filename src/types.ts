export type ColumnInfo = {
  name: string;
  notNull: boolean;
  hasDefault: boolean;
};

/** Convention 4: a vocabulary table with at least `id` and `label`. */
export type PropertyTable = {
  name: string;
};

/** Convention 4, single value: the note table holds a reference column to a property table. */
export type SingleValueProperty = {
  column: string;
  nullable: boolean;
  propertyTable: string;
};

/**
 * Convention 4, multi value: a junction table holds one reference to the
 * note table and one reference to a property table.
 */
export type MultiValueProperty = {
  junctionTable: string;
  noteColumn: string;
  propertyColumn: string;
  propertyTable: string;
};

export type NoteTable = {
  name: string;
  columns: ColumnInfo[];
  singleValueProperties: SingleValueProperty[];
  multiValueProperties: MultiValueProperty[];
};

export type ViewInfo = {
  name: string;
};

export type DatabaseInspection = {
  noteTables: NoteTable[];
  propertyTables: PropertyTable[];
  views: ViewInfo[];
};

export const NOTE_TABLE_REQUIRED_COLUMNS = [
  "id",
  "title",
  "body",
  "created_at",
  "updated_at",
] as const;

export const PROPERTY_TABLE_REQUIRED_COLUMNS = ["id", "label"] as const;
