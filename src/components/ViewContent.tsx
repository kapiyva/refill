import { useEffect, useState } from "react";
import { listViewRows, type ViewData } from "../db/views";
import type { Database } from "../db/sqlite";
import type { SqlValue } from "../db/records";

type Props = {
  db: Database;
  viewName: string;
};

export function ViewContent({ db, viewName }: Props) {
  const [data, setData] = useState<ViewData>({ columns: [], rows: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setData(listViewRows(db, viewName));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [db, viewName]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 px-4 py-2">
        <h2 className="text-sm font-medium text-gray-900">{viewName}</h2>
        <p className="text-xs text-gray-500">
          {data.rows.length} {data.rows.length === 1 ? "row" : "rows"} (read-only)
        </p>
      </header>
      {error ? (
        <div className="p-4 text-sm text-red-600">{error}</div>
      ) : data.rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          No rows
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                {data.columns.map((col) => (
                  <th
                    key={col}
                    className="border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {data.columns.map((col) => (
                    <td
                      key={col}
                      className="border-b border-gray-100 px-3 py-1.5 align-top"
                    >
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatCell(v: SqlValue | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
