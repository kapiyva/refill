import { useRef, useState } from "react";

type Props = {
  onOpen: (file: File) => void;
  onApplyUrl: (url: string) => void;
};

export function FileOpener({ onOpen, onApplyUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onOpen(file);
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onApplyUrl(trimmed);
    setUrl("");
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex h-screen flex-col items-center justify-center gap-6 ${
        dragging ? "bg-blue-50" : ""
      }`}
    >
      <div className="text-2xl font-semibold">refill</div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-gray-500">
          SQLite ファイルを選択するか、ここにドロップしてください
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          ファイルを選択
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onOpen(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <p className="text-sm text-gray-500">
          または GitHub の format.sql の URL から取り込む
        </p>
        <form onSubmit={handleUrlSubmit} className="flex w-full gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/blob/main/path/to/format.sql"
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            取り込む
          </button>
        </form>
      </div>
    </div>
  );
}
