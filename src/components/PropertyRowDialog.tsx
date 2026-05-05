import { useEffect, useState } from "react";
import { PropertyPanel } from "./PropertyPanel";
import type { Record } from "../db/records";

type Props = {
  open: boolean;
  mode: "edit" | "new";
  tableName: string;
  editableColumns: string[];
  initial: Record;
  onSave: (data: Record) => void;
  onCancel: () => void;
};

export function PropertyRowDialog({
  open,
  mode,
  tableName,
  editableColumns,
  initial,
  onSave,
  onCancel,
}: Props) {
  const [values, setValues] = useState<Record>(initial);

  useEffect(() => {
    if (open) setValues(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-[28rem] rounded bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-sm font-semibold">
          {mode === "new" ? "Add new" : "Edit"}
        </h3>
        <p className="mb-3 text-xs text-gray-500">{tableName}</p>
        {editableColumns.length === 0 ? (
          <p className="mb-3 text-xs text-gray-400">
            No editable columns
          </p>
        ) : (
          <PropertyPanel
            columns={editableColumns}
            values={values}
            onChange={setValues}
          />
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(values)}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
