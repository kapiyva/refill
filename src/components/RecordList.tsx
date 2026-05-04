import type { NoteListItem } from "../db/records";

type Props = {
  tableName: string;
  records: NoteListItem[];
  selectedId: string | null;
  onSelectRecord: (id: string) => void;
  onNewRecord: () => void;
};

export function RecordList({
  tableName,
  records,
  selectedId,
  onSelectRecord,
  onNewRecord,
}: Props) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <div>
          <h2 className="text-sm font-medium text-gray-900">{tableName}</h2>
          <p className="text-xs text-gray-500">{records.length} 件</p>
        </div>
        <button
          type="button"
          onClick={onNewRecord}
          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
        >
          ＋ 新規
        </button>
      </header>
      {records.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          レコードがありません
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {records.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelectRecord(r.id)}
                className={`block w-full border-b border-gray-100 px-4 py-2 text-left ${
                  r.id === selectedId ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="truncate text-sm">{r.title}</div>
                <div className="text-xs text-gray-500">
                  {formatTimestamp(r.updated_at)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTimestamp(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}
