import { useMemo, useState } from "react";
import {
  insertPropertyOption,
  listPropertyOptions,
  type PropertyOption,
} from "../db/property";
import type { Database } from "../db/sqlite";
import type { MultiValueProperty, SingleValueProperty } from "../types";

function useOptions(db: Database, propertyTable: string) {
  const [tick, setTick] = useState(0);
  const options = useMemo(
    () => listPropertyOptions(db, propertyTable),
    // tick re-reads the vocabulary after a new label is added
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, propertyTable, tick],
  );
  function add(label: string): PropertyOption {
    const option = insertPropertyOption(db, propertyTable, label);
    setTick((n) => n + 1);
    return option;
  }
  return { options, add };
}

function AddLabel({
  onAdd,
}: {
  onAdd: (label: string) => void;
}) {
  const [text, setText] = useState("");
  function submit() {
    const label = text.trim();
    if (label === "") return;
    onAdd(label);
    setText("");
  }
  return (
    <input
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      }}
      placeholder="+ new label (Enter)"
      className="mt-1 w-full rounded border border-gray-200 px-2 py-0.5 text-xs placeholder:text-gray-400"
    />
  );
}

type SingleProps = {
  db: Database;
  property: SingleValueProperty;
  value: string | null;
  allowEmpty: boolean;
  onError: (message: string) => void;
  onChange: (next: string | null) => void;
};

/** Convention 4 single value: pick at most one label from the vocabulary. */
export function SingleValueField({
  db,
  property,
  value,
  allowEmpty,
  onError,
  onChange,
}: SingleProps) {
  const { options, add } = useOptions(db, property.propertyTable);
  const known = value === null || options.some((o) => o.id === value);
  return (
    <div>
      <FieldLabel name={property.column} detail={property.propertyTable} />
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
      >
        {(allowEmpty || value === null) && <option value="">—</option>}
        {!known && <option value={value!}>{value} (unknown id)</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <AddLabel
        onAdd={(label) => {
          try {
            onChange(add(label).id);
          } catch (e) {
            onError(e instanceof Error ? e.message : String(e));
          }
        }}
      />
    </div>
  );
}

type MultiProps = {
  db: Database;
  property: MultiValueProperty;
  value: string[];
  onError: (message: string) => void;
  onChange: (next: string[]) => void;
};

/** Convention 4 multi value: toggle any number of labels from the vocabulary. */
export function MultiValueField({
  db,
  property,
  value,
  onError,
  onChange,
}: MultiProps) {
  const { options, add } = useOptions(db, property.propertyTable);
  const selected = new Set(value);
  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }
  return (
    <div>
      <FieldLabel
        name={property.propertyTable}
        detail={`via ${property.junctionTable}`}
      />
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            aria-pressed={selected.has(o.id)}
            className={`rounded border px-2 py-0.5 text-xs ${
              selected.has(o.id)
                ? "border-blue-300 bg-blue-100 text-blue-900"
                : "border-gray-300 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {o.label}
          </button>
        ))}
        {options.length === 0 && (
          <span className="text-xs text-gray-400">No labels yet</span>
        )}
      </div>
      <AddLabel
        onAdd={(label) => {
          try {
            onChange([...selected, add(label).id]);
          } catch (e) {
            onError(e instanceof Error ? e.message : String(e));
          }
        }}
      />
    </div>
  );
}

function FieldLabel({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-2">
      <span className="truncate text-xs font-medium text-gray-600" title={name}>
        {name}
      </span>
      <span className="truncate text-[10px] text-gray-400" title={detail}>
        {detail}
      </span>
    </div>
  );
}
