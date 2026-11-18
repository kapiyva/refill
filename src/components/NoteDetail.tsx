import { useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { PropertyPanel } from "./PropertyPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import { MultiValueField, SingleValueField } from "./PropertyFields";
import type { NoteTable } from "../types";
import { NOTE_TABLE_REQUIRED_COLUMNS } from "../types";
import type { MultiValueSelection, Record } from "../db/records";
import { listSelectedPropertyIds } from "../db/property";
import type { Database } from "../db/sqlite";

type Props = {
  db: Database;
  mode: "edit" | "new";
  noteTable: NoteTable;
  record: Record | null;
  onSave: (data: Record, selection: MultiValueSelection) => void;
  onDelete?: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onError: (message: string) => void;
};

const REQUIRED = new Set<string>(NOTE_TABLE_REQUIRED_COLUMNS);

type FormState = {
  title: string;
  body: string;
  /** Plain extra columns and single-value property columns. */
  properties: Record;
  multi: MultiValueSelection;
};

function initialForm(
  db: Database,
  noteTable: NoteTable,
  record: Record | null,
  propertyColumns: string[],
): FormState {
  const props: Record = {};
  for (const col of propertyColumns) {
    props[col] = record ? (record[col] ?? null) : null;
  }
  const multi: MultiValueSelection = {};
  for (const mv of noteTable.multiValueProperties) {
    multi[mv.junctionTable] = record
      ? listSelectedPropertyIds(db, mv, String(record.id))
      : [];
  }
  return {
    title: record ? String(record.title ?? "") : "",
    body: record ? String(record.body ?? "") : "",
    properties: props,
    multi,
  };
}

function sameSet(a: string[] = [], b: string[] = []): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((x) => set.has(x));
}

export function NoteDetail({
  db,
  mode,
  noteTable,
  record,
  onSave,
  onDelete,
  onDirtyChange,
  onError,
}: Props) {
  const singleColumns = useMemo(
    () => new Set(noteTable.singleValueProperties.map((p) => p.column)),
    [noteTable],
  );
  // Columns note.sql does not define and that are not property references:
  // edited as raw values.
  const plainColumns = useMemo(
    () =>
      noteTable.columns
        .map((c) => c.name)
        .filter((c) => !REQUIRED.has(c) && !singleColumns.has(c)),
    [noteTable, singleColumns],
  );
  const propertyColumns = useMemo(
    () => [...plainColumns, ...singleColumns],
    [plainColumns, singleColumns],
  );

  const initialRef = useRef<FormState>(
    initialForm(db, noteTable, record, propertyColumns),
  );
  const [form, setForm] = useState<FormState>(initialRef.current);
  const [previewMode, setPreviewMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset when target record changes
  useEffect(() => {
    const next = initialForm(db, noteTable, record, propertyColumns);
    initialRef.current = next;
    setForm(next);
    setPreviewMode(false);
    onDirtyChange(false);
    // intentionally exclude onDirtyChange to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record, mode, noteTable.name]);

  const dirty = useMemo(() => {
    const a = initialRef.current;
    if (a.title !== form.title || a.body !== form.body) return true;
    for (const c of propertyColumns) {
      if ((a.properties[c] ?? null) !== (form.properties[c] ?? null))
        return true;
    }
    for (const mv of noteTable.multiValueProperties) {
      if (!sameSet(a.multi[mv.junctionTable], form.multi[mv.junctionTable]))
        return true;
    }
    return false;
  }, [form, propertyColumns, noteTable]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  function handleSave() {
    const now = new Date().toISOString();
    // title is optional (Convention 1): an empty title is stored as NULL.
    // body is required, so an empty body is stored as "" rather than NULL.
    const title = form.title.trim() === "" ? null : form.title;
    if (mode === "new") {
      const data: Record = {
        id: crypto.randomUUID(),
        title,
        body: form.body,
        created_at: now,
        updated_at: now,
      };
      // include only non-null extras to let DB defaults apply (Convention 5)
      for (const c of propertyColumns) {
        const v = form.properties[c];
        if (v !== null && v !== undefined) data[c] = v;
      }
      onSave(data, form.multi);
    } else {
      const data: Record = { title, body: form.body, updated_at: now };
      for (const c of propertyColumns) {
        data[c] = form.properties[c] ?? null;
      }
      onSave(data, form.multi);
    }
  }

  const hasProperties =
    plainColumns.length > 0 ||
    noteTable.singleValueProperties.length > 0 ||
    noteTable.multiValueProperties.length > 0;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title (optional)"
          className="flex-1 rounded border border-transparent px-2 py-1 text-base font-medium hover:border-gray-200 focus:border-gray-300 focus:outline-none"
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            Save
          </button>
          {onDelete && mode === "edit" && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded border border-gray-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-1">
            <span className="text-xs uppercase tracking-wider text-gray-500">
              Body
            </span>
            <button
              type="button"
              onClick={() => setPreviewMode((p) => !p)}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              {previewMode ? "Edit" : "Preview"}
            </button>
          </div>
          {previewMode ? (
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <Markdown source={form.body} />
            </div>
          ) : (
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Markdown..."
              className="flex-1 resize-none px-4 py-2 font-mono text-sm focus:outline-none"
            />
          )}
        </div>

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Properties
          </div>
          {!hasProperties ? (
            <p className="text-xs text-gray-400">No additional properties</p>
          ) : (
            <div className="flex flex-col gap-3">
              {noteTable.singleValueProperties.map((p) => {
                const col = noteTable.columns.find((c) => c.name === p.column);
                return (
                  <SingleValueField
                    key={p.column}
                    db={db}
                    property={p}
                    value={
                      form.properties[p.column] === null ||
                      form.properties[p.column] === undefined
                        ? null
                        : String(form.properties[p.column])
                    }
                    allowEmpty={
                      p.nullable || (mode === "new" && !!col?.hasDefault)
                    }
                    onError={onError}
                    onChange={(v) =>
                      setForm({
                        ...form,
                        properties: { ...form.properties, [p.column]: v },
                      })
                    }
                  />
                );
              })}
              {noteTable.multiValueProperties.map((mv) => (
                <MultiValueField
                  key={mv.junctionTable}
                  db={db}
                  property={mv}
                  value={form.multi[mv.junctionTable] ?? []}
                  onError={onError}
                  onChange={(ids) =>
                    setForm({
                      ...form,
                      multi: { ...form.multi, [mv.junctionTable]: ids },
                    })
                  }
                />
              ))}
              <PropertyPanel
                columns={plainColumns}
                values={form.properties}
                onChange={(p) => setForm({ ...form, properties: p })}
              />
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this record?"
        message="This record and its property links will be deleted permanently."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete?.();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
