import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { RelatedRecordDialog } from "./RelatedRecordDialog";
import {
  deleteRelated,
  insertRelated,
  listRelated,
  updateRelated,
  type RelatedRow,
} from "../db/related";
import type { Database } from "../db/sqlite";
import type { RelatedTable } from "../types";
import type { Record } from "../db/records";

type DialogState =
  | { kind: "new" }
  | { kind: "edit"; row: RelatedRow }
  | null;

type Props = {
  db: Database;
  relatedTables: RelatedTable[];
  noteId: string | null;
};

export function RelatedSection({ db, relatedTables, noteId }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [confirmDeleteRowid, setConfirmDeleteRowid] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RelatedRow[]>([]);

  const active = relatedTables[activeIdx] ?? null;

  const editableColumns = useMemo(() => {
    if (!active) return [];
    return active.columns.filter(
      (c) => c !== active.fkColumn && c !== "rowid",
    );
  }, [active]);

  useEffect(() => {
    if (!active || !noteId) {
      setRows([]);
      return;
    }
    try {
      setRows(listRelated(db, active.name, active.fkColumn, noteId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [db, active, noteId, refreshTick]);

  if (relatedTables.length === 0) return null;

  if (!noteId) {
    return (
      <Section>
        <p className="text-xs text-gray-400">
          ノートを保存してから追加できます
        </p>
      </Section>
    );
  }

  function handleDialogSave(values: Record) {
    if (!active || !noteId || !dialog) return;
    setError(null);
    try {
      if (dialog.kind === "new") {
        insertRelated(db, active.name, {
          [active.fkColumn]: noteId,
          ...values,
        });
      } else {
        updateRelated(db, active.name, dialog.row.rowid, values);
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
      deleteRelated(db, active.name, rowid);
      setConfirmDeleteRowid(null);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function rowSummary(row: RelatedRow): string {
    return String(row.label ?? "");
  }

  function newRecordInitial(): Record {
    const init: Record = {};
    for (const col of editableColumns) init[col] = null;
    return init;
  }

  function editRecordInitial(row: RelatedRow): Record {
    const init: Record = {};
    for (const col of editableColumns) init[col] = row[col] ?? null;
    return init;
  }

  return (
    <Section>
      {relatedTables.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {relatedTables.map((t, i) => (
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
          {relatedTables.length === 1 && (
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
                  title="削除"
                >
                  ×
                </button>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="px-2 py-1 text-xs text-gray-400">なし</li>
            )}
          </ul>
          <button
            type="button"
            onClick={() => setDialog({ kind: "new" })}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
          >
            ＋ 追加
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded bg-red-100 px-2 py-1 text-xs text-red-700">
          {error}
        </div>
      )}

      {dialog && active && (
        <RelatedRecordDialog
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
        title="削除しますか？"
        message="この関連レコードを削除します。"
        confirmLabel="削除"
        destructive
        onConfirm={() =>
          confirmDeleteRowid !== null && handleDelete(confirmDeleteRowid)
        }
        onCancel={() => setConfirmDeleteRowid(null)}
      />
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-gray-200 pt-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        関連
      </div>
      {children}
    </div>
  );
}
