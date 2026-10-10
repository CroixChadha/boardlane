"use client";

import { Check, Copy, Download, Sparkles, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { CSV_PROMPT, DEMO_CSV, DEMO_FILE_NAME } from "@/lib/csv-guide";

const dialogClass =
  "m-auto rounded-[var(--radius-xl)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-drag)] backdrop:bg-black/50";
const secondaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed disabled:opacity-40";
const primaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-text)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

// Everything to do with importing a CSV: choosing a file, confirming that the
// board will be replaced, and the guide that explains the format and offers a
// demo board. The board renders `elements` once and can call `chooseFile` and
// `openGuide` from any button.
export function useCsvImport({
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
  const confirmDialog = useRef<HTMLDialogElement>(null);
  const guideDialog = useRef<HTMLDialogElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runImport(file: File) {
    setImporting(true);
    try {
      await onImport(file);
    } finally {
      setImporting(false);
    }
  }

  // Importing replaces the whole board, so when the board has anything on it
  // the user has to confirm first.
  function startImport(file: File | undefined) {
    if (!file || !canImport(file)) return;
    guideDialog.current?.close();
    if (boardHasContent) {
      setPendingFile(file);
      confirmDialog.current?.showModal();
    } else {
      void runImport(file);
    }
  }

  function chooseFile() {
    fileInput.current?.click();
  }

  function openGuide() {
    setCopied(false);
    guideDialog.current?.showModal();
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(CSV_PROMPT);
      setCopied(true);
      return;
    } catch {
      // Some browsers refuse clipboard access; fall back to the older way.
    }
    // The textarea has to live inside the open dialog: everything outside a
    // modal dialog is inert and cannot be selected.
    const textarea = document.createElement("textarea");
    textarea.value = CSV_PROMPT;
    textarea.setAttribute("readonly", "");
    textarea.className = "sr-only";
    guideDialog.current?.appendChild(textarea);
    textarea.select();
    setCopied(document.execCommand("copy"));
    textarea.remove();
  }

  function downloadExample() {
    const url = URL.createObjectURL(new Blob([DEMO_CSV], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = DEMO_FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
  }

  const elements: ReactNode = (
    <>
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          startImport(event.target.files?.[0]);
          // Clear it so choosing the same file again still fires a change.
          event.target.value = "";
        }}
      />

      <dialog
        ref={confirmDialog}
        aria-labelledby="csv-import-title"
        onClose={() => setPendingFile(null)}
        className={`${dialogClass} w-[min(92vw,420px)]`}
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
            onClick={() => confirmDialog.current?.close()}
            className={secondaryButton}
          >
            No
          </button>
          <button
            type="button"
            onClick={() => {
              const file = pendingFile;
              confirmDialog.current?.close();
              if (file) void runImport(file);
            }}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--danger)] px-5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Yes
          </button>
        </div>
      </dialog>

      <dialog
        ref={guideDialog}
        aria-labelledby="csv-guide-title"
        className={`${dialogClass} max-h-[90vh] w-[min(94vw,640px)] overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="csv-guide-title" className="text-xl font-semibold tracking-tight">
              Build a board from a CSV
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Describe your project to an AI assistant, have it write the plan
              as a CSV file, then import the file here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => guideDialog.current?.close()}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
          >
            Close
          </button>
        </div>

        <ol className="mt-6 space-y-6">
          <li>
            <h3 className="text-sm font-semibold">1. Copy this prompt</h3>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-4 font-mono text-xs leading-5 text-[var(--text-secondary)]">
              {CSV_PROMPT}
            </pre>
            <button type="button" onClick={copyPrompt} className={`${secondaryButton} mt-3`}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy prompt"}
            </button>
          </li>
          <li>
            <h3 className="text-sm font-semibold">2. Give it to an AI assistant</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Paste the prompt into ChatGPT, Claude, Codex or any assistant and
              replace the last line with a description of your project. Save
              the reply as a file ending in <code className="font-mono text-xs">.csv</code>.
            </p>
          </li>
          <li>
            <h3 className="text-sm font-semibold">3. Import the file</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Importing replaces everything on your current board. If a row is
              wrong, nothing is imported and you are told which row to fix.
            </p>
            <button type="button" onClick={chooseFile} disabled={importing} className={`${primaryButton} mt-3`}>
              <Upload className="size-4" />
              Choose a CSV file
            </button>
          </li>
        </ol>

        <div className="mt-8 border-t border-[var(--border-hairline)] pt-6">
          <h3 className="text-sm font-semibold">What the file looks like</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            One row is one checklist item on a card in a bucket. Rows with the
            same bucket and card title are the same card.
          </p>
          <pre className="mt-2 max-h-40 overflow-auto rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-4 font-mono text-xs leading-5 text-[var(--text-secondary)]">
            {DEMO_CSV}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={importing}
              onClick={() =>
                startImport(new File([DEMO_CSV], DEMO_FILE_NAME, { type: "text/csv" }))
              }
              className={secondaryButton}
            >
              <Sparkles className="size-4" />
              Load the demo board
            </button>
            <button type="button" onClick={downloadExample} className={secondaryButton}>
              <Download className="size-4" />
              Download this example
            </button>
          </div>
        </div>
      </dialog>
    </>
  );

  return { elements, chooseFile, openGuide, importing };
}
