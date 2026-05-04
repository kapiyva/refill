import { useRef, useState } from "react";

type Props = {
  onOpen: (file: File) => void;
};

export function FileOpener({ onOpen }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onOpen(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex h-screen flex-col items-center justify-center gap-4 ${
        dragging ? "bg-blue-50" : ""
      }`}
    >
      <div className="text-2xl font-semibold">refill</div>
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
  );
}
