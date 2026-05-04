import type { DatabaseInspection } from "../types";

type Props = {
  inspection: DatabaseInspection;
  selectedTable: string | null;
  onSelectTable: (name: string) => void;
  fileName: string;
  onClose: () => void;
};

export function Sidebar({
  inspection,
  selectedTable,
  onSelectTable,
  fileName,
  onClose,
}: Props) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="truncate text-sm font-medium" title={fileName}>
          {fileName}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-900"
          title="ファイルを閉じる"
        >
          ✕
        </button>
      </header>

      <nav className="flex-1 overflow-y-auto p-2 text-sm">
        <Section title="ノート">
          {inspection.noteTables.length === 0 ? (
            <Empty>ノートテーブルなし</Empty>
          ) : (
            inspection.noteTables.map((t) => (
              <Item
                key={t.name}
                selected={t.name === selectedTable}
                onClick={() => onSelectTable(t.name)}
              >
                {t.name}
              </Item>
            ))
          )}
        </Section>

        <Section title="ビュー">
          {inspection.views.length === 0 ? (
            <Empty>ビューなし</Empty>
          ) : (
            inspection.views.map((v) => (
              <div
                key={v.name}
                className="cursor-not-allowed rounded px-2 py-1 text-gray-400"
                title="Phase 4 で対応予定"
              >
                {v.name}
              </div>
            ))
          )}
        </Section>
      </nav>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Item({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full truncate rounded px-2 py-1 text-left ${
        selected
          ? "bg-blue-100 text-blue-900"
          : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1 text-xs text-gray-400">{children}</div>;
}
