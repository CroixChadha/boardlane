"use client";

import {
  Moon,
  Paintbrush,
  Sun,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const THEME_EVENT = "boardlane-theme-change";
const panel =
  "rounded-[20px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]";

function getThemeSnapshot(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("boardlane-theme", theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  danger = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      onCancel={(event) => {
        if (busy) event.preventDefault();
      }}
      className="m-auto w-[min(92vw,440px)] rounded-[24px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-[var(--shadow-hover)] backdrop:bg-slate-950/35 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <span
          className={`grid size-11 place-items-center rounded-2xl ${
            danger
              ? "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]"
              : "bg-[var(--accent-soft)] text-[var(--accent)]"
          }`}
        >
          <TriangleAlert className="size-5" />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onCancel}
            className="h-10 rounded-full border border-[var(--border-hairline)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`h-10 rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              danger
                ? "bg-[var(--danger)] text-white hover:opacity-90"
                : "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function SettingsView({
  onClearBoard,
  onDeleteAccount,
}: {
  onClearBoard: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );
  const [confirmation, setConfirmation] = useState<"clear" | "delete" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function runConfirmedAction(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      setConfirmation(null);
    } catch {
      // Workspace puts the backend's user-facing message in Board's error prop.
      setConfirmation(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className={panel} aria-labelledby="settings-appearance">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Paintbrush className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="settings-appearance" className="text-lg font-semibold tracking-tight">
              Appearance
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Choose how Boardlane looks in this browser.
            </p>
            <div
              className="mt-4 inline-flex rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-1"
              aria-label="Theme"
            >
              {([
                ["light", "Light", Sun],
                ["dark", "Dark", Moon],
              ] as const).map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={theme === value}
                  className={`flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                    theme === value
                      ? "bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={panel} aria-labelledby="settings-clear-board">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[var(--accent-yellow-soft)] text-[var(--text-primary)]">
              <Trash2 className="size-5" />
            </span>
            <div>
              <h2 id="settings-clear-board" className="text-lg font-semibold tracking-tight">
                Clear my board
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Delete every bucket, card and checklist item, while keeping your account.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmation("clear")}
            className="h-10 shrink-0 rounded-full border border-[var(--border-strong)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-2)]"
          >
            Clear board
          </button>
        </div>
      </section>

      <section
        className="rounded-[20px] border border-[color-mix(in_srgb,var(--danger)_30%,var(--border-hairline))] bg-[color-mix(in_srgb,var(--danger)_6%,var(--bg-surface))] p-5 shadow-[var(--shadow-card)]"
        aria-labelledby="settings-delete-account"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--danger)]">
                Danger zone
              </p>
              <h2 id="settings-delete-account" className="mt-1 text-lg font-semibold tracking-tight">
                Delete my account
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                Permanently delete your login and all of your board data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmation("delete")}
            className="h-10 shrink-0 rounded-full bg-[var(--danger)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Delete account
          </button>
        </div>
      </section>

      <ConfirmationDialog
        open={confirmation === "clear"}
        title="Clear my board?"
        description="This deletes every bucket and card on it. This can't be undone."
        confirmLabel="Yes, clear my board"
        busy={busy}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void runConfirmedAction(onClearBoard)}
      />
      <ConfirmationDialog
        open={confirmation === "delete"}
        title="Delete my account?"
        description="This permanently deletes your login and all your board data. There is no recovery."
        confirmLabel="Yes, delete my account"
        busy={busy}
        danger
        onCancel={() => setConfirmation(null)}
        onConfirm={() => void runConfirmedAction(onDeleteAccount)}
      />
    </div>
  );
}
