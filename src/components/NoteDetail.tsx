import { useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { PropertyPanel } from "./PropertyPanel";
import { ConfirmDialog } from "./ConfirmDialog";
import { RelatedSection } from "./RelatedSection";
import type { NoteTable } from "../types";
import { NOTE_TABLE_REQUIRED_COLUMNS } from "../types";
import type { Record } from "../db/records";
import type { Database } from "../db/sqlite";

type Props = {
  db: Database;
  mode: "edit" | "new";
  noteTable: NoteTable;
  record: Record | null;
  onSave: (data: Record) => void;
  onDelete?: () => void;
  onDirtyChange: (dirty: boolean) => void;
};

const REQUIRED = new Set<string>(NOTE_TABLE_REQUIRED_COLUMNS);

type FormState = {
  title: string;
  body: string;
  properties: Record;
};

function initialForm(record: Record | null, extraColumns: string[]): FormState {
  const props: Record = {};
  for (const col of extraColumns) {
    props[col] = record ? (record[col] ?? null) : null;
  }
  return {
    title: record ? String(record.title ?? "") : "",
    body: record ? String(record.body ?? "") : "",
    properties: props,
  };
}

export function NoteDetail({
  db,
  mode,
  noteTable,
  record,
  onSave,
  onDelete,
  onDirtyChange,
}: Props) {
  const extraColumns = useMemo(
    () => noteTable.columns.filter((c) => !REQUIRED.has(c)),
    [noteTable],
  );

  const initialRef = useRef<FormState>(initialForm(record, extraColumns));
  const [form, setForm] = useState<FormState>(initialRef.current);
  const [previewMode, setPreviewMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset when target record changes
  useEffect(() => {
    const next = initialForm(record, extraColumns);
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
    for (const c of extraColumns) {
      if ((a.properties[c] ?? null) !== (form.properties[c] ?? null))
        return true;
    }
    return false;
  }, [form, extraColumns]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const titleEmpty = form.title.trim() === "";

  function handleSave() {
    const now = new Date().toISOString();
    if (mode === "new") {
      const data: Record = {
        id: crypto.randomUUID(),
        title: form.title,
        body: form.body === "" ? null : form.body,
        created_at: now,
        updated_at: now,
      };
      // include only non-null extras to let DB defaults apply where possible
      for (const c of extraColumns) {
        const v = form.properties[c];
        if (v !== null && v !== undefined) data[c] = v;
      }
      onSave(data);
    } else {
      const data: Record = {
        title: form.title,
        body: form.body === "" ? null : form.body,
        updated_at: now,
      };
      for (const c of extraColumns) {
        data[c] = form.properties[c] ?? null;
      }
      onSave(data);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Title (required)"
          className="flex-1 rounded border border-transparent px-2 py-1 text-base font-medium hover:border-gray-200 focus:border-gray-300 focus:outline-none"
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={titleEmpty}
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
          <PropertyPanel
            columns={extraColumns}
            values={form.properties}
            onChange={(p) => setForm({ ...form, properties: p })}
          />
          {mode === "edit" && record && (
            <div className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-xs text-gray-500">
              <div>
                <span className="font-medium">id:</span>{" "}
                <span className="break-all font-mono">{String(record.id)}</span>
              </div>
              <div>
                <span className="font-medium">created_at:</span>{" "}
                {String(record.created_at)}
              </div>
              <div>
                <span className="font-medium">updated_at:</span>{" "}
                {String(record.updated_at)}
              </div>
            </div>
          )}

          <RelatedSection
            db={db}
            relatedTables={noteTable.relatedTables}
            noteId={
              mode === "edit" && record ? String(record.id) : null
            }
          />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this record?"
        message="This record will be deleted permanently."
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
