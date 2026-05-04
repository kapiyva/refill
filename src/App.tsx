import { useEffect, useMemo, useState } from "react";
import { FileOpener } from "./components/FileOpener";
import { Sidebar } from "./components/Sidebar";
import { RecordList } from "./components/RecordList";
import { loadDatabase, type Database } from "./db/sqlite";
import { inspectDatabase } from "./db/inspect";
import { listNotes, type NoteListItem } from "./db/records";
import type { DatabaseInspection } from "./types";

type LoadedDb = {
  db: Database;
  fileName: string;
  inspection: DatabaseInspection;
};

export default function App() {
  const [loaded, setLoaded] = useState<LoadedDb | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [records, setRecords] = useState<NoteListItem[]>([]);

  useEffect(() => {
    if (!loaded || !selectedTable) {
      setRecords([]);
      return;
    }
    try {
      setRecords(listNotes(loaded.db, selectedTable));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [loaded, selectedTable]);

  const firstNoteTable = useMemo(
    () => loaded?.inspection.noteTables[0]?.name ?? null,
    [loaded],
  );
  useEffect(() => {
    if (loaded && !selectedTable && firstNoteTable) {
      setSelectedTable(firstNoteTable);
    }
  }, [loaded, selectedTable, firstNoteTable]);

  async function handleOpen(file: File) {
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const db = await loadDatabase(bytes);
      const inspection = inspectDatabase(db);
      loaded?.db.close();
      setLoaded({ db, fileName: file.name, inspection });
      setSelectedTable(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleClose() {
    loaded?.db.close();
    setLoaded(null);
    setSelectedTable(null);
    setRecords([]);
  }

  if (!loaded) {
    return (
      <>
        <FileOpener onOpen={handleOpen} />
        {error && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-red-100 px-4 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        inspection={loaded.inspection}
        selectedTable={selectedTable}
        onSelectTable={setSelectedTable}
        fileName={loaded.fileName}
        onClose={handleClose}
      />
      <main className="flex-1 overflow-hidden">
        {selectedTable ? (
          <RecordList tableName={selectedTable} records={records} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            ノートテーブルを選択してください
          </div>
        )}
      </main>
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-red-100 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
