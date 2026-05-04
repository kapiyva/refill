import type { Record, SqlValue } from "../db/records";

type Props = {
  columns: string[];
  values: Record;
  onChange: (next: Record) => void;
};

export function PropertyPanel({ columns, values, onChange }: Props) {
  if (columns.length === 0) {
    return (
      <div className="text-xs text-gray-400">追加プロパティはありません</div>
    );
  }

  function update(col: string, next: SqlValue) {
    onChange({ ...values, [col]: next });
  }

  return (
    <div className="flex flex-col gap-2">
      {columns.map((col) => {
        const value = values[col];
        const isNull = value === null || value === undefined;
        const text = isNull ? "" : String(value);
        return (
          <div key={col} className="flex items-center gap-2">
            <label
              className="w-32 shrink-0 text-xs font-medium text-gray-600"
              title={col}
            >
              {col}
            </label>
            <div className="relative flex-1">
              <input
                type="text"
                value={text}
                onChange={(e) => update(col, e.target.value)}
                placeholder={isNull ? "null" : ""}
                className="w-full rounded border border-gray-300 px-2 py-1 pr-7 text-sm placeholder:italic placeholder:text-gray-400"
              />
              {!isNull && (
                <button
                  type="button"
                  onClick={() => update(col, null)}
                  title="NULL に設定"
                  className="absolute top-1/2 right-1 -translate-y-1/2 px-1 text-gray-400 hover:text-gray-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
