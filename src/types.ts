export type PropertyTable = {
  name: string;
  fkColumn: string;
  columns: string[];
};

export type NoteTable = {
  name: string;
  columns: string[];
  propertyTables: PropertyTable[];
};

export type ViewInfo = {
  name: string;
};

export type DatabaseInspection = {
  noteTables: NoteTable[];
  views: ViewInfo[];
};

export const NOTE_TABLE_REQUIRED_COLUMNS = [
  "id",
  "title",
  "body",
  "created_at",
  "updated_at",
] as const;
