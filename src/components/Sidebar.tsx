import { useState } from "react";
import type { DatabaseInspection } from "../types";

type Props = {
  inspection: DatabaseInspection;
  selectedTable: string | null;
  selectedView: string | null;
  onSelectTable: (name: string) => void;
  onSelectView: (name: string) => void;
  source: string;
  onClose: () => void;
  onApplyUrl: (url: string) => void;
  onDownload: () => void;
};

export function Sidebar({
  inspection,
  selectedTable,
  selectedView,
  onSelectTable,
  onSelectView,
  source,
  onClose,
  onApplyUrl,
  onDownload,
}: Props) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="truncate text-sm font-medium" title={source}>
          {source}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onDownload}
            className="text-xs text-gray-500 hover:text-gray-900"
            title="Download database"
          >
            ⬇
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-900"
            title="Close file"
          >
            ✕
          </button>
        </div>
      </header>

      <nav className="flex-1 overflow-y-auto p-2 text-sm">
        <Section title="Notes">
          {inspection.noteTables.length === 0 ? (
            <Empty>No note tables</Empty>
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

        <Section title="Views">
          {inspection.views.length === 0 ? (
            <Empty>No views</Empty>
          ) : (
            inspection.views.map((v) => (
              <Item
                key={v.name}
                selected={v.name === selectedView}
                onClick={() => onSelectView(v.name)}
              >
                {v.name}
              </Item>
            ))
          )}
        </Section>
      </nav>

      <ApplyUrlPanel onApplyUrl={onApplyUrl} />
    </aside>
  );
}

function ApplyUrlPanel({ onApplyUrl }: { onApplyUrl: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onApplyUrl(trimmed);
    setUrl("");
    setOpen(false);
  }

  return (
    <div className="border-t border-gray-200 p-2">
      {open ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <input
            type="url"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="GitHub URL of format.sql"
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setUrl("");
              }}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded px-2 py-1 text-left text-xs text-gray-600 hover:bg-gray-200"
        >
          + Apply format from URL
        </button>
      )}
    </div>
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
