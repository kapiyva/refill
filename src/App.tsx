import { useCallback, useEffect, useMemo, useState } from "react";
import { FileOpener } from "./components/FileOpener";
import { Sidebar } from "./components/Sidebar";
import { RecordList } from "./components/RecordList";
import { NoteDetail } from "./components/NoteDetail";
import { ViewContent } from "./components/ViewContent";
import {
  createEmptyDatabase,
  exportDatabase,
  loadDatabase,
  type Database,
  type FileHeader,
} from "./db/sqlite";
import { inspectDatabase } from "./db/inspect";
import {
  applyFormatSql,
  fetchFormatSql,
  formatUrlDisplayName,
  normalizeFormatUrl,
} from "./db/format";
import {
  deleteRecord,
  getRecord,
  insertRecord,
  listNotes,
  updateRecord,
  type NoteListItem,
  type Record,
} from "./db/records";
import type { DatabaseInspection, NoteTable } from "./types";

type LoadedDb = {
  db: Database;
  source: string;
  inspection: DatabaseInspection;
  originalHeader: FileHeader | null;
};

type SelectedRecord =
  | { kind: "edit"; id: string }
  | { kind: "new" }
  | null;

export default function App() {
  const [loaded, setLoaded] = useState<LoadedDb | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord>(null);
  const [records, setRecords] = useState<NoteListItem[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [dirty, setDirty] = useState(false);

  const noteTable: NoteTable | null = useMemo(() => {
    if (!loaded || !selectedTable) return null;
    return (
      loaded.inspection.noteTables.find((t) => t.name === selectedTable) ?? null
    );
  }, [loaded, selectedTable]);

  const editingRecord: Record | null = useMemo(() => {
    if (!loaded || !selectedTable) return null;
    if (!selectedRecord || selectedRecord.kind !== "edit") return null;
    try {
      return getRecord(loaded.db, selectedTable, selectedRecord.id) ?? null;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
    // refreshTick triggers re-fetch after save
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, selectedTable, selectedRecord, refreshTick]);

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
  }, [loaded, selectedTable, refreshTick]);

  const firstNoteTable = useMemo(
    () => loaded?.inspection.noteTables[0]?.name ?? null,
    [loaded],
  );
  useEffect(() => {
    if (loaded && !selectedTable && !selectedView && firstNoteTable) {
      setSelectedTable(firstNoteTable);
    }
  }, [loaded, selectedTable, selectedView, firstNoteTable]);

  const confirmDiscardIfDirty = useCallback((): boolean => {
    if (!dirty) return true;
    return window.confirm("You have unsaved changes. Discard them?");
  }, [dirty]);

  async function handleOpen(file: File) {
    if (!confirmDiscardIfDirty()) return;
    setError(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { db, originalHeader } = await loadDatabase(bytes);
      const inspection = inspectDatabase(db);
      loaded?.db.close();
      setLoaded({ db, source: file.name, inspection, originalHeader });
      setSelectedTable(null);
      setSelectedView(null);
      setSelectedRecord(null);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleApplyUrl(rawInput: string) {
    if (loaded && !confirmDiscardIfDirty()) return;
    setError(null);
    try {
      const url = normalizeFormatUrl(rawInput);
      const sql = await fetchFormatSql(url);
      if (loaded) {
        applyFormatSql(loaded.db, sql);
        const inspection = inspectDatabase(loaded.db);
        setLoaded({ ...loaded, inspection });
      } else {
        const db = await createEmptyDatabase();
        try {
          applyFormatSql(db, sql);
        } catch (e) {
          db.close();
          throw e;
        }
        const inspection = inspectDatabase(db);
        setLoaded({
          db,
          source: formatUrlDisplayName(url),
          inspection,
          originalHeader: null,
        });
        setSelectedTable(null);
        setSelectedView(null);
        setSelectedRecord(null);
        setDirty(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleClose() {
    if (!confirmDiscardIfDirty()) return;
    loaded?.db.close();
    setLoaded(null);
    setSelectedTable(null);
    setSelectedView(null);
    setSelectedRecord(null);
    setRecords([]);
    setDirty(false);
  }

  function handleSelectTable(name: string) {
    if (!confirmDiscardIfDirty()) return;
    setSelectedTable(name);
    setSelectedView(null);
    setSelectedRecord(null);
    setDirty(false);
  }

  function handleSelectView(name: string) {
    if (!confirmDiscardIfDirty()) return;
    setSelectedView(name);
    setSelectedTable(null);
    setSelectedRecord(null);
    setDirty(false);
  }

  function handleSelectRecord(id: string) {
    if (!confirmDiscardIfDirty()) return;
    setSelectedRecord({ kind: "edit", id });
    setDirty(false);
  }

  function handleNewRecord() {
    if (!confirmDiscardIfDirty()) return;
    setSelectedRecord({ kind: "new" });
    setDirty(false);
  }

  function handleSave(data: Record) {
    if (!loaded || !selectedTable || !selectedRecord) return;
    setError(null);
    try {
      if (selectedRecord.kind === "new") {
        insertRecord(loaded.db, selectedTable, data);
        setSelectedRecord({ kind: "edit", id: data.id as string });
      } else {
        updateRecord(loaded.db, selectedTable, selectedRecord.id, data);
      }
      setDirty(false);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleDelete() {
    if (
      !loaded ||
      !selectedTable ||
      !selectedRecord ||
      selectedRecord.kind !== "edit"
    )
      return;
    setError(null);
    try {
      deleteRecord(loaded.db, selectedTable, selectedRecord.id);
      setSelectedRecord(null);
      setDirty(false);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDownload() {
    if (!loaded) return;
    if (!confirmDiscardIfDirty()) return;
    setError(null);
    try {
      const bytes = await exportDatabase(
        loaded.db,
        loaded.originalHeader ?? undefined,
      );
      const blob = new Blob([bytes as BlobPart], {
        type: "application/x-sqlite3",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = loaded.source.endsWith(".db") ? loaded.source : "notes.db";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (!loaded) {
    return (
      <>
        <FileOpener onOpen={handleOpen} onApplyUrl={handleApplyUrl} />
        {error && <ErrorToast message={error} />}
      </>
    );
  }

  const selectedRecordId =
    selectedRecord?.kind === "edit" ? selectedRecord.id : null;

  return (
    <div className="flex h-screen">
      <Sidebar
        inspection={loaded.inspection}
        selectedTable={selectedTable}
        selectedView={selectedView}
        onSelectTable={handleSelectTable}
        onSelectView={handleSelectView}
        source={loaded.source}
        onClose={handleClose}
        onApplyUrl={handleApplyUrl}
        onDownload={handleDownload}
      />
      {selectedView ? (
        <main className="flex-1 overflow-hidden">
          <ViewContent db={loaded.db} viewName={selectedView} />
        </main>
      ) : (
        <>
          <div className="w-80 shrink-0 border-r border-gray-200">
            {selectedTable ? (
              <RecordList
                tableName={selectedTable}
                records={records}
                selectedId={selectedRecordId}
                onSelectRecord={handleSelectRecord}
                onNewRecord={handleNewRecord}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Select a note table or view
              </div>
            )}
          </div>
          <main className="flex-1 overflow-hidden">
            {selectedRecord && noteTable ? (
              <NoteDetail
                db={loaded.db}
                mode={selectedRecord.kind}
                noteTable={noteTable}
                record={
                  selectedRecord.kind === "edit" ? editingRecord : null
                }
                onSave={handleSave}
                onDelete={
                  selectedRecord.kind === "edit" ? handleDelete : undefined
                }
                onDirtyChange={setDirty}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                {selectedTable
                  ? "Select a record or click + New"
                  : ""}
              </div>
            )}
          </main>
        </>
      )}
      {error && <ErrorToast message={error} />}
    </div>
  );
}

function ErrorToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded bg-red-100 px-4 py-2 text-sm text-red-800">
      {message}
    </div>
  );
}
