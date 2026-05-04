import type { NoteListItem } from "../db/records";

type Props = {
  tableName: string;
  records: NoteListItem[];
};

export function RecordList({ tableName, records }: Props) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-gray-200 px-4 py-2">
        <h2 className="text-sm font-medium text-gray-900">{tableName}</h2>
        <p className="text-xs text-gray-500">{records.length} 件</p>
      </header>
      {records.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
          レコードがありません
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {records.map((r) => (
            <li
              key={r.id}
              className="border-b border-gray-100 px-4 py-2 hover:bg-gray-50"
            >
              <div className="truncate text-sm">{r.title}</div>
              <div className="text-xs text-gray-500">{r.updated_at}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
