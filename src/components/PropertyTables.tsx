import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { PropertyRowDialog } from "./PropertyRowDialog";
import {
  deletePropertyRow,
  insertPropertyRow,
  listPropertyRows,
  updatePropertyRow,
  type PropertyRow,
} from "../db/property";
import type { Database } from "../db/sqlite";
import type { PropertyTable } from "../types";
import type { Record } from "../db/records";

type DialogState =
  | { kind: "new" }
  | { kind: "edit"; row: PropertyRow }
  | null;

const HIDDEN_COLUMNS = new Set([
  "rowid",
  "created_at",
  "updated_at",
]);

type Props = {
  db: Database;
  propertyTables: PropertyTable[];
  noteId: string | null;
};

export function PropertyTables({ db, propertyTables, noteId }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirmDeleteRowid, setConfirmDeleteRowid] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PropertyRow[]>([]);

  const active = propertyTables[activeIdx] ?? null;

  const editableColumns = useMemo(() => {
    if (!active) return [];
    return active.columns.filter(
      (c) => c !== active.fkColumn && !HIDDEN_COLUMNS.has(c),
    );
  }, [active]);

  useEffect(() => {
    if (!active || !noteId) {
      setRows([]);
      return;
    }
    try {
      setRows(listPropertyRows(db, active.name, active.fkColumn, noteId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [db, active, noteId, refreshTick]);

  if (propertyTables.length === 0) return null;

  if (!noteId) {
    return (
      <Wrapper>
        <p className="text-xs text-gray-400">
          Save the note before adding property rows.
        </p>
      </Wrapper>
    );
  }

  function handleDialogSave(values: Record) {
    if (!active || !noteId || !dialog) return;
    setError(null);
    const now = new Date().toISOString();
    try {
      if (dialog.kind === "new") {
        insertPropertyRow(db, active.name, {
          [active.fkColumn]: noteId,
          ...values,
          created_at: now,
          updated_at: now,
        });
      } else {
        updatePropertyRow(db, active.name, dialog.row.rowid, {
          ...values,
          updated_at: now,
        });
      }
      setDialog(null);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDelete(rowid: number) {
    if (!active) return;
    setError(null);
    try {
      deletePropertyRow(db, active.name, rowid);
      setConfirmDeleteRowid(null);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function rowSummary(row: PropertyRow): string {
    return String(row.label ?? "");
  }

  function newRecordInitial(): Record {
    const init: Record = {};
    for (const col of editableColumns) init[col] = null;
    return init;
  }

  function editRecordInitial(row: PropertyRow): Record {
    const init: Record = {};
    for (const col of editableColumns) init[col] = row[col] ?? null;
    return init;
  }

  return (
    <Wrapper>
      {propertyTables.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {propertyTables.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`truncate rounded px-2 py-0.5 text-xs ${
                i === activeIdx
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
              title={t.name}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      {active && (
        <div>
          {propertyTables.length === 1 && (
            <div
              className="mb-1 truncate text-xs text-gray-500"
              title={active.name}
            >
              {active.name}
            </div>
          )}
          <ul className="mb-2 flex flex-col">
            {rows.map((row) => (
              <li
                key={row.rowid}
                className="group flex items-center gap-1 rounded text-xs hover:bg-gray-200"
              >
                <button
                  type="button"
                  onClick={() => setDialog({ kind: "edit", row })}
                  className="flex-1 truncate px-2 py-1 text-left"
                  title={rowSummary(row)}
                >
                  {rowSummary(row)}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteRowid(row.rowid)}
                  className="px-2 py-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
                  title="Delete"
                >
                  ×
                </button>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-2 py-1 text-xs text-gray-400">None</li>
            )}
          </ul>
          <button
            type="button"
            onClick={() => setDialog({ kind: "new" })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
          >
            + Add
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
          {error}
        </div>
      )}

      {dialog && active && (
        <PropertyRowDialog
          open
          mode={dialog.kind === "new" ? "new" : "edit"}
          tableName={active.name}
          editableColumns={editableColumns}
          initial={
            dialog.kind === "new"
              ? newRecordInitial()
              : editRecordInitial(dialog.row)
          }
          onSave={handleDialogSave}
          onCancel={() => setDialog(null)}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteRowid !== null}
        title="Delete this row?"
        message="This property row will be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          confirmDeleteRowid !== null && handleDelete(confirmDeleteRowid)
        }
        onCancel={() => setConfirmDeleteRowid(null)}
      />
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="mt-3">{children}</div>;
}
