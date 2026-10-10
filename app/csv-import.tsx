"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

// The "Import CSV" button. Importing replaces the whole board, so when the
// board has anything on it the user has to confirm first.
export function CsvImportButton({
  boardHasContent,
  canImport,
  onImport,
}: {
  boardHasContent: boolean;
  // Called as soon as a file is chosen. Returning false stops the import
  // before the user is asked to confirm anything.
  canImport: (file: File) => boolean;
  onImport: (file: File) => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  async function runImport(file: File) {
    setImporting(true);
    try {
      await onImport(file);
    } finally {
      setImporting(false);
    }
  }

  function handleFileChosen(file: File | undefined) {
    if (!file || !canImport(file)) return;
    if (boardHasContent) {
      setPendingFile(file);
      dialog.current?.showModal();
    } else {
      void runImport(file);
    }
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          handleFileChosen(event.target.files?.[0]);
          // Clear it so choosing the same file again still fires a change.
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={importing}
        onClick={() => fileInput.current?.click()}
        className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Import CSV"
      >
        <Upload className="size-4" />
        <span className="hidden sm:inline">
          {importing ? "Importing…" : "Import CSV"}
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="csv-import-title"
        onClose={() => setPendingFile(null)}
        className="m-auto w-[min(92vw,420px)] rounded-[var(--radius-xl)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-drag)] backdrop:bg-black/50"
      >
        <h2 id="csv-import-title" className="text-lg font-semibold tracking-tight">
          Replace this board?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          CSV import will delete all current buckets and cards. Proceed?
        </p>
        {pendingFile && (
          <p className="mt-3 truncate rounded-[var(--radius-md)] bg-[var(--bg-surface-2)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            {pendingFile.name}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => dialog.current?.close()}
            className="h-9 rounded-[var(--radius-md)] border border-[var(--border-hairline)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)]"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => {
              const file = pendingFile;
              dialog.current?.close();
              if (file) void runImport(file);
            }}
            className="h-9 rounded-[var(--radius-md)] bg-[var(--danger)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Yes
          </button>
        </div>
      </dialog>
    </>
  );
}
