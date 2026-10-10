"use client";

import { FormEvent, useId, useState, useSyncExternalStore } from "react";
import { AutoScroller } from "@dnd-kit/dom";
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  CheckSquare2,
  ChevronRight,
  Circle,
  CircleHelp,
  GripVertical,
  Home,
  LayoutDashboard,
  LoaderCircle,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Plus,
  Search,
  Settings,
  SquareKanban,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCsvImport } from "./csv-import";
import { HomeView } from "./home-view";
import { ProgressView } from "./progress-view";

export type Bucket = {
  _id: string;
  _creationTime: number;
  name: string;
};

export type Card = {
  _id: string;
  _creationTime: number;
  title: string;
  bucketId: string;
};

export type ChecklistItem = {
  _id: string;
  _creationTime: number;
  title: string;
  cardId: string;
  isDone: boolean;
};

export type BoardActions = {
  onAddBucket: (name: string) => void | Promise<void>;
  onRenameBucket: (bucketId: string, name: string) => void | Promise<void>;
  onDeleteBucket: (bucketId: string) => void | Promise<void>;
  onAddCard: (bucketId: string, title: string) => void | Promise<void>;
  onRenameCard: (cardId: string, title: string) => void | Promise<void>;
  onDeleteCard: (cardId: string) => void | Promise<void>;
  onMoveCard: (cardId: string, bucketId: string) => void | Promise<void>;
  onAddChecklistItem: (cardId: string, title: string) => void | Promise<void>;
  onRenameChecklistItem: (itemId: string, title: string) => void | Promise<void>;
  onToggleChecklistItem: (itemId: string, isDone: boolean) => void | Promise<void>;
  onDeleteChecklistItem: (itemId: string) => void | Promise<void>;
  // Whether a chosen file is worth importing at all. A false result means
  // the reason is already in the error prop.
  onCheckCsvFile: (file: File) => boolean;
  // Replaces the board with the file's contents. Resolves to what was
  // created, or null if the import was rejected.
  onImportCsv: (file: File) => Promise<CsvImportSummary | null>;
};

export type CsvImportSummary = {
  buckets: number;
  cards: number;
  checklistItems: number;
};

// Which page of the workspace to show inside the shared shell.
export type WorkspaceView = "home" | "board" | "progress";

type BoardProps = {
  view: WorkspaceView;
  buckets: Bucket[];
  cards: Card[];
  checklistItems: ChecklistItem[];
  actions: BoardActions;
  isLoading: boolean;
  error: string | null;
};

const MAX_BUCKETS = 25;
const MAX_CHECKLIST_ITEMS = 10;
const MAX_TITLE_LENGTH = 200;
const THEME_EVENT = "boardlane-theme-change";

// A card can be picked up with the mouse or a finger from anywhere on it, not
// only from its grip handle. Buttons and inputs inside the card still work:
// the sensor ignores a press that starts on one. The keyboard uses the handle.
const dragSensors = [
  PointerSensor.configure({
    activatorElements: (source) => [source.element, source.handle],
  }),
  KeyboardSensor,
];

// By default the board starts scrolling when a dragged card is within the
// outer 20% of its width, which covers most of the last visible bucket. Keep
// the zone to a thin strip at the edge so aiming at a visible bucket is safe.
const dragAutoScroller = AutoScroller.configure({
  threshold: { x: 0.05, y: 0.1 },
  acceleration: 12,
});

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

function BrandMark() {
  return (
    <span className="relative grid size-9 place-items-center rounded-full bg-[var(--text-primary)] text-[var(--bg-surface)]">
      <span className="absolute size-[18px] rounded-full border-[3px] border-current" />
      <span className="absolute bottom-[7px] right-[6px] size-3 rotate-45 border-b-[3px] border-r-[3px] border-current" />
    </span>
  );
}

function InlineForm({
  label,
  initialValue = "",
  submitLabel,
  onSubmit,
  onCancel,
}: {
  label: string;
  initialValue?: string;
  submitLabel: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const fieldId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanValue = value.trim();
    if (!cleanValue) return;
    onSubmit(cleanValue);
    setValue("");
  }

  return (
    <form className="space-y-2" onSubmit={submit}>
      <label className="sr-only" htmlFor={fieldId}>
        {label}
      </label>
      <input
        id={fieldId}
        autoFocus
        value={value}
        maxLength={MAX_TITLE_LENGTH}
        onChange={(event) => setValue(event.target.value)}
        placeholder={label}
        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-3 focus:ring-[var(--accent-soft)]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {value.length}/{MAX_TITLE_LENGTH}
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-lg bg-[var(--btn-primary-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--btn-primary-text)] transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </span>
      </div>
    </form>
  );
}

function Checklist({
  card,
  items,
  actions,
}: {
  card: Card;
  items: ChecklistItem[];
  actions: BoardActions;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const atLimit = items.length >= MAX_CHECKLIST_ITEMS;

  return (
    <div className="mt-4 border-t border-[var(--border-hairline)] pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
          <CheckSquare2 className="size-3.5" />
          Checklist
        </p>
        <span className="text-[11px] font-medium text-[var(--text-tertiary)]">
          {items.filter((item) => item.isDone).length}/{items.length}
        </span>
      </div>

      {items.length === 0 && !adding ? (
        <p className="rounded-lg bg-[var(--bg-surface-2)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
          No checklist items yet.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item._id}>
              {editingId === item._id ? (
                <InlineForm
                  label="Checklist item"
                  initialValue={item.title}
                  submitLabel="Save"
                  onSubmit={(title) => {
                    actions.onRenameChecklistItem(item._id, title);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="group/item flex items-start gap-2 rounded-lg px-1 py-1.5 hover:bg-[var(--bg-surface-2)]">
                  <button
                    type="button"
                    onClick={() =>
                      actions.onToggleChecklistItem(item._id, !item.isDone)
                    }
                    className="mt-0.5 text-[var(--accent)]"
                    aria-label={
                      item.isDone
                        ? `Mark ${item.title} incomplete`
                        : `Mark ${item.title} complete`
                    }
                  >
                    {item.isDone ? (
                      <CheckSquare2 className="size-4" />
                    ) : (
                      <Circle className="size-4 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                  <span
                    className={`min-w-0 flex-1 text-xs leading-5 ${
                      item.isDone
                        ? "text-[var(--text-tertiary)] line-through"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingId(item._id)}
                    className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                    aria-label={`Rename ${item.title}`}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.onDeleteChecklistItem(item._id)}
                    className="rounded p-1 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--danger)]"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="mt-2">
          <InlineForm
            label="New checklist item"
            submitLabel="Add item"
            onSubmit={(title) => {
              actions.onAddChecklistItem(card._id, title);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={atLimit}
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:text-[var(--text-tertiary)]"
          title={atLimit ? "A card can have at most 10 checklist items." : undefined}
        >
          <Plus className="size-3.5" />
          {atLimit ? "Checklist limit reached" : "Add checklist item"}
        </button>
      )}
    </div>
  );
}

function TaskCard({
  card,
  items,
  actions,
  isMoving,
  onStartMove,
  onCancelMove,
}: {
  card: Card;
  items: ChecklistItem[];
  actions: BoardActions;
  isMoving: boolean;
  onStartMove: () => void;
  onCancelMove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const { ref, handleRef, isDragging } = useDraggable({
    id: card._id,
  });

  function confirmDelete() {
    if (
      window.confirm(
        `Are you sure you want to delete “${card.title}”? Its checklist items will also be deleted.`,
      )
    ) {
      actions.onDeleteCard(card._id);
    }
  }

  return (
    <article
      ref={editing ? undefined : ref}
      role="listitem"
      className={`task-card cursor-grab rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-card)] ${
        isDragging
          ? "z-[70] rotate-3 scale-[1.03] opacity-80 shadow-[var(--shadow-drag)]"
          : isMoving
            ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-surface)]"
            : ""
      }`}
    >
      {editing ? (
        <InlineForm
          label="Card title"
          initialValue={card.title}
          submitLabel="Save"
          onSubmit={(title) => {
            actions.onRenameCard(card._id, title);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[var(--text-primary)]">
              {card.title}
            </h3>
            <button
              ref={handleRef}
              type="button"
              className="drag-handle -mr-1 -mt-1 grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:cursor-grabbing"
              aria-label={`Drag ${card.title}`}
            >
              <GripVertical className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1 border-t border-[var(--border-hairline)] pt-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)]"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={isMoving ? onCancelMove : onStartMove}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]"
            >
              {isMoving ? "Cancel move" : "Move"}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[var(--text-tertiary)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-[var(--danger)]"
            >
              Delete
            </button>
          </div>
        </>
      )}

      <Checklist card={card} items={items} actions={actions} />
    </article>
  );
}

function BucketColumn({
  bucket,
  cards,
  totalCardCount,
  hasSearchQuery,
  checklistItems,
  actions,
  movingCardId,
  draggingOriginBucketId,
  onStartMove,
  onCancelMove,
  onMoveHere,
}: {
  bucket: Bucket;
  cards: Card[];
  totalCardCount: number;
  hasSearchQuery: boolean;
  checklistItems: ChecklistItem[];
  actions: BoardActions;
  movingCardId: string | null;
  draggingOriginBucketId: string | null;
  onStartMove: (cardId: string) => void;
  onCancelMove: () => void;
  onMoveHere: (bucketId: string) => void;
}) {
  const [addingCard, setAddingCard] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const { ref, isDropTarget } = useDroppable({
    id: bucket._id,
  });
  const showDropTarget =
    isDropTarget && draggingOriginBucketId !== bucket._id;

  function confirmDelete() {
    if (
      window.confirm(
        `Are you sure you want to delete “${bucket.name}”? Every card and checklist item inside it will also be deleted.`,
      )
    ) {
      actions.onDeleteBucket(bucket._id);
    }
  }

  return (
    <section
      ref={ref}
      className={`kanban-column w-[320px] shrink-0 snap-center rounded-[20px] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-3.5 ${
        showDropTarget ? "drop-target" : ""
      }`}
      aria-labelledby={`bucket-${bucket._id}`}
    >
      <div className="mb-3 rounded-xl px-1">
        {renaming ? (
          <InlineForm
            label="Bucket name"
            initialValue={bucket.name}
            submitLabel="Save"
            onSubmit={(name) => {
              actions.onRenameBucket(bucket._id, name);
              setRenaming(false);
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="bucket-tone size-2 rounded-full bg-[var(--accent)]" />
                <h2
                  id={`bucket-${bucket._id}`}
                  className="text-sm font-semibold text-[var(--text-primary)]"
                >
                  {bucket.name}
                </h2>
                <span className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                  {totalCardCount}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                  aria-label={`Rename ${bucket.name}`}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] hover:text-[var(--danger)]"
                  aria-label={`Delete ${bucket.name}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            {movingCardId && (
              <button
                type="button"
                onClick={() => onMoveHere(bucket._id)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
              >
                Move selected card here
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      <div role="list" className="space-y-3">
        {showDropTarget && (
          <div role="listitem" className="drop-placeholder rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-8 text-center text-sm font-semibold text-[var(--accent)]">
            Drop here
          </div>
        )}
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-8 text-center">
            <SquareKanban className="mx-auto size-5 text-[var(--text-tertiary)]" />
            <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
              {hasSearchQuery && totalCardCount > 0 ? "No matching cards" : "No cards yet"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {hasSearchQuery && totalCardCount > 0
                ? "Try a different search."
                : "Add the first task to this phase."}
            </p>
          </div>
        ) : (
          cards.map((card) => (
            <TaskCard
              key={card._id}
              card={card}
              items={checklistItems.filter((item) => item.cardId === card._id)}
              actions={actions}
              isMoving={movingCardId === card._id}
              onStartMove={() => onStartMove(card._id)}
              onCancelMove={onCancelMove}
            />
          ))
        )}
      </div>

      {addingCard ? (
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3">
            <InlineForm
              label="Card title"
              submitLabel="Add card"
              onSubmit={(title) => {
                actions.onAddCard(bucket._id, title);
                setAddingCard(false);
              }}
              onCancel={() => setAddingCard(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCard(true)}
            className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] hover:text-[var(--accent)]"
          >
            <Plus className="size-4" />
            Add card
          </button>
        )}
    </section>
  );
}

// Whether a side panel is collapsed is remembered per browser, like the theme.
const NAV_COLLAPSED_KEY = "boardlane-nav-collapsed";
const OVERVIEW_HIDDEN_KEY = "boardlane-overview-hidden";

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // Storage can be unavailable (private windows); the panel still toggles.
  }
}

const NAV_ITEMS: { view: WorkspaceView; label: string; href: string; icon: typeof Home }[] = [
  { view: "home", label: "Home", href: "/home", icon: Home },
  { view: "board", label: "Board", href: "/", icon: LayoutDashboard },
  { view: "progress", label: "Progress", href: "/progress", icon: BarChart3 },
];

// The coloured band at the top of each page.
function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-[24px] bg-[var(--accent-yellow-soft)] px-6 py-7 md:px-8 md:py-9">
      <span className="pointer-events-none absolute -right-12 -top-20 size-56 rounded-full bg-[var(--accent-red-soft)]" />
      <span className="pointer-events-none absolute -bottom-24 right-28 size-48 rounded-full bg-[var(--accent-soft)]" />
      <div className="relative flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--text-secondary)]">{eyebrow}</p>
          <h1 className="editorial-title page-title text-[clamp(2.75rem,5vw,4.8rem)] leading-[0.98] tracking-[-0.045em]">
            {title}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoadingBoard() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg-page)]">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-5 py-4 text-sm font-medium text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
        <LoaderCircle className="size-4 animate-spin text-[var(--accent)]" />
        Loading your board…
      </div>
    </div>
  );
}

export function Board({
  view,
  buckets,
  cards,
  checklistItems,
  actions,
  isLoading,
  error,
}: BoardProps) {
  const [addingBucket, setAddingBucket] = useState(false);
  const [movingCardId, setMovingCardId] = useState<string | null>(null);
  const [draggingOriginBucketId, setDraggingOriginBucketId] = useState<
    string | null
  >(null);
  const [query, setQuery] = useState("");
  const [navCollapsed, setNavCollapsed] = useState(
    () => typeof window !== "undefined" && readFlag(NAV_COLLAPSED_KEY),
  );
  const [overviewHidden, setOverviewHidden] = useState(
    () => typeof window !== "undefined" && readFlag(OVERVIEW_HIDDEN_KEY),
  );
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const csvImport = useCsvImport({
    boardHasContent: buckets.length > 0,
    canImport: actions.onCheckCsvFile,
    onImport: async (file) => {
      setImportNotice(null);
      const summary = await actions.onImportCsv(file);
      if (summary) {
        setImportNotice(
          `Imported ${summary.buckets} buckets, ${summary.cards} cards and ${summary.checklistItems} checklist items from ${file.name}.`,
        );
      }
    },
  });
  const atBucketLimit = buckets.length >= MAX_BUCKETS;
  const completedItems = checklistItems.filter((item) => item.isDone).length;
  const completion = checklistItems.length
    ? Math.round((completedItems / checklistItems.length) * 100)
    : 0;
  const visibleCards = cards.filter((card) =>
    card.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (isLoading) return <LoadingBoard />;

  // Below the xl width the navigation is always the narrow icon rail and the
  // overview is not shown, so these only change the layout on wide screens.
  const wideNav = !navCollapsed;
  const showOverview = view === "board" && !overviewHidden;
  const shellColumns = showOverview
    ? wideNav
      ? "xl:grid-cols-[208px_minmax(0,1fr)_288px]"
      : "xl:grid-cols-[72px_minmax(0,1fr)_288px]"
    : wideNav
      ? "xl:grid-cols-[208px_minmax(0,1fr)]"
      : "xl:grid-cols-[72px_minmax(0,1fr)]";

  function toggleNav() {
    writeFlag(NAV_COLLAPSED_KEY, !navCollapsed);
    setNavCollapsed(!navCollapsed);
  }

  function toggleOverview() {
    writeFlag(OVERVIEW_HIDDEN_KEY, !overviewHidden);
    setOverviewHidden(!overviewHidden);
  }

  function changeTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("boardlane-theme", nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function announceMove(message: string) {
    setMoveAnnouncement("");
    window.setTimeout(() => setMoveAnnouncement(message), 0);
  }

  async function moveCard(
    cardId: string,
    bucketId: string,
    announce: boolean,
  ) {
    const card = cards.find((candidate) => candidate._id === cardId);
    if (!card || card.bucketId === bucketId) {
      setMovingCardId(null);
      return;
    }

    try {
      await actions.onMoveCard(cardId, bucketId);
      if (announce) {
        const bucket = buckets.find((candidate) => candidate._id === bucketId);
        announceMove(
          `${card.title} moved to ${bucket?.name ?? "the selected bucket"}.`,
        );
      }
    } catch {
      // The page shows the backend's message through the error prop.
    } finally {
      setMovingCardId(null);
    }
  }

  return (
    <div className="board-stage min-h-screen bg-[var(--bg-page)] p-0 text-[var(--text-primary)] lg:p-5">
      <div className={`app-shell mx-auto grid min-h-screen max-w-[1800px] overflow-clip bg-[var(--bg-surface)] lg:min-h-[calc(100vh-40px)] lg:rounded-[var(--radius-xl)] lg:border lg:border-[var(--border-hairline)] lg:shadow-[0_20px_70px_rgba(14,23,43,0.08)] md:grid-cols-[72px_minmax(0,1fr)] ${shellColumns}`}>
        <aside className={`glass-panel hidden border-r border-[var(--border-hairline)] px-3 py-4 md:flex md:flex-col ${wideNav ? "xl:px-4" : ""}`}>
          <div className={`flex items-center gap-3 px-1 ${wideNav ? "xl:px-2" : "justify-center"}`}>
            <BrandMark />
            <span className={`hidden text-lg font-medium tracking-[-0.04em] ${wideNav ? "xl:block" : ""}`}>
              Boardlane
            </span>
          </div>
          <nav className="mt-8 space-y-1" aria-label="Main navigation">
            {NAV_ITEMS.map(({ view: itemView, label, href, icon: Icon }) => {
              const active = itemView === view;
              return (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  title={label}
                  className={`relative flex h-10 w-full items-center justify-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition ${wideNav ? "xl:justify-start" : ""} ${
                    active
                      ? "bg-[var(--text-primary)] text-[var(--bg-surface)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="size-[18px]" />
                  <span className={`sr-only ${wideNav ? "xl:not-sr-only" : ""}`}>{label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-2">
            <button
              type="button"
              onClick={toggleNav}
              aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              aria-expanded={!navCollapsed}
              title={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              className={`hidden h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] xl:flex ${wideNav ? "xl:justify-start" : ""}`}
            >
              {navCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
              <span className={`sr-only ${wideNav ? "xl:not-sr-only" : ""}`}>Collapse</span>
            </button>
            <button
              type="button"
              onClick={csvImport.openGuide}
              aria-label="Help"
              title="How CSV import works"
              className={`flex h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] ${wideNav ? "xl:justify-start" : ""}`}
            >
              <CircleHelp className="size-5" />
              <span className={`sr-only ${wideNav ? "xl:not-sr-only" : ""}`}>Help</span>
            </button>
            <button
              type="button"
              disabled
              aria-label="Settings"
              title="Settings are not yet available"
              className={`flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-tertiary)] opacity-60 ${wideNav ? "xl:justify-start" : ""}`}
            >
              <Settings className="size-5" />
              <span className={`sr-only ${wideNav ? "xl:not-sr-only" : ""}`}>Settings</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 bg-[var(--bg-surface)]">
          <header className="glass-panel sticky top-0 z-40 flex h-[68px] items-center justify-between gap-4 border-b border-[var(--border-hairline)] px-5 md:px-7">
            {view === "board" ? (
            <label className="search-pill flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] px-4 text-[var(--text-secondary)] md:max-w-xs">
              <Search className="size-4 shrink-0" />
              <span className="sr-only">Search cards</span>
              <input
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  if (movingCardId) {
                    const movingCard = cards.find(
                      (card) => card._id === movingCardId,
                    );
                    if (
                      movingCard &&
                      !movingCard.title
                        .toLowerCase()
                        .includes(nextQuery.trim().toLowerCase())
                    ) {
                      setMovingCardId(null);
                    }
                  }
                }}
                placeholder="Search cards"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </label>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={changeTheme}
                className="grid size-10 place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]"
                aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
              >
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>
              {view === "board" && (
                <>
              <button
                type="button"
                onClick={csvImport.openGuide}
                className="hidden size-10 place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] sm:grid"
                aria-label="How CSV import works"
                title="How CSV import works"
              >
                <CircleHelp className="size-4" />
              </button>
              <button
                type="button"
                disabled={csvImport.importing}
                onClick={csvImport.chooseFile}
                className="flex h-10 items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Import CSV"
              >
                <Upload className="size-4" />
                <span className="hidden sm:inline">
                  {csvImport.importing ? "Importing…" : "Import CSV"}
                </span>
              </button>
              <button
                type="button"
                disabled={atBucketLimit}
                onClick={() => setAddingBucket(true)}
                className="primary-button flex h-10 items-center gap-2 rounded-full bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-text)] disabled:cursor-not-allowed disabled:opacity-40"
                title={atBucketLimit ? "A board can have at most 25 buckets." : undefined}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">
                  {atBucketLimit ? "Limit reached" : "Add bucket"}
                </span>
              </button>
                  <button
                    type="button"
                    onClick={toggleOverview}
                    aria-label={overviewHidden ? "Show board overview" : "Hide board overview"}
                    aria-expanded={!overviewHidden}
                    title={overviewHidden ? "Show board overview" : "Hide board overview"}
                    className="hidden size-10 place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)] xl:grid"
                  >
                    {overviewHidden ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
                  </button>
                </>
              )}
              <UserButton />
            </div>
          </header>

          <div className="px-5 pb-28 pt-7 md:px-7 md:pb-8 md:pt-8">
            {view === "home" && (
              <PageHero eyebrow="Home" title={<>Your <em>workspace</em></>} />
            )}
            {view === "progress" && (
              <PageHero eyebrow="Progress" title={<>How it&rsquo;s <em>going</em></>} />
            )}
            {view === "board" && (
              <PageHero eyebrow="Development workspace" title={<>Product <em>roadmap</em></>}>
                <div className="segmented-control flex rounded-full border border-[var(--border-hairline)] bg-[var(--bg-glass)] p-1 text-xs font-medium backdrop-blur-sm">
                  <span className="rounded-full bg-[var(--text-primary)] px-3.5 py-2 text-[var(--bg-surface)]">
                    Board
                  </span>
                  <span className="px-3.5 py-2 text-[var(--text-secondary)]">
                    {cards.length} cards
                  </span>
                </div>
              </PageHero>
            )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--danger)]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {importNotice && !error && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--success)_25%,transparent)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)] px-4 py-3 text-sm text-[var(--success)]"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span className="flex-1">{importNotice}</span>
            <button
              type="button"
              onClick={() => setImportNotice(null)}
              className="font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {view === "home" && (
          <HomeView
            buckets={buckets}
            cards={cards}
            checklistItems={checklistItems}
            onOpenGuide={csvImport.openGuide}
          />
        )}

        {view === "progress" && (
          <ProgressView buckets={buckets} cards={cards} checklistItems={checklistItems} />
        )}

        {view === "board" && movingCardId && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
            <Check className="size-4" />
            <span className="flex-1 font-medium">
              Choose “Move selected card here” under a different bucket.
            </span>
            <button
              type="button"
              onClick={() => setMovingCardId(null)}
              className="font-semibold"
            >
              Cancel
            </button>
          </div>
        )}

        {view !== "board" ? null : buckets.length === 0 && !addingBucket ? (
          <section className="grid min-h-[60vh] place-items-center">
            <div className="max-w-sm text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <SquareKanban className="size-6" />
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                Start your first phase
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Buckets organize your cards into the stages of your project.
                Add one by hand, or have an AI assistant plan the whole board
                and import it as a CSV.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddingBucket(true)}
                  className="primary-button inline-flex items-center gap-2 rounded-full bg-[var(--btn-primary-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--btn-primary-text)]"
                >
                  <Plus className="size-4" />
                  Add a bucket
                </button>
                <button
                  type="button"
                  onClick={csvImport.openGuide}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-2)]"
                >
                  <Upload className="size-4" />
                  Import from a CSV
                </button>
              </div>
            </div>
          </section>
        ) : (
          <DragDropProvider
            sensors={dragSensors}
            plugins={(defaults) => [
              ...defaults.filter((plugin) => plugin !== AutoScroller),
              dragAutoScroller,
            ]}
            onDragStart={(event) => {
              const cardId = String(event.operation.source?.id ?? "");
              const card = cards.find((candidate) => candidate._id === cardId);
              setDraggingOriginBucketId(card?.bucketId ?? null);
            }}
            onDragEnd={(event) => {
              setDraggingOriginBucketId(null);
              if (event.canceled) return;
              const cardId = String(event.operation.source?.id ?? "");
              const bucketId = String(event.operation.target?.id ?? "");
              if (cardId && bucketId) void moveCard(cardId, bucketId, false);
            }}
          >
          <div
            className={`board-scroll overflow-x-auto pb-8 ${
              draggingOriginBucketId ? "" : "snap-x snap-proximity"
            }`}
          >
            <div className="flex min-w-max items-start gap-4">
              {buckets.map((bucket) => (
                <BucketColumn
                  key={bucket._id}
                  bucket={bucket}
                  cards={visibleCards.filter((card) => card.bucketId === bucket._id)}
                  totalCardCount={
                    cards.filter((card) => card.bucketId === bucket._id).length
                  }
                  hasSearchQuery={query.trim().length > 0}
                  checklistItems={checklistItems}
                  actions={actions}
                  movingCardId={movingCardId}
                  draggingOriginBucketId={draggingOriginBucketId}
                  onStartMove={setMovingCardId}
                  onCancelMove={() => setMovingCardId(null)}
                  onMoveHere={(bucketId) => {
                    if (movingCardId) {
                      void moveCard(movingCardId, bucketId, true);
                    }
                  }}
                />
              ))}

              {addingBucket && (
                <div className="w-[320px] shrink-0 rounded-[22px] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-4 shadow-[var(--shadow-card)]">
                  <InlineForm
                    label="Bucket name"
                    submitLabel="Add bucket"
                    onSubmit={(name) => {
                      actions.onAddBucket(name);
                      setAddingBucket(false);
                    }}
                    onCancel={() => setAddingBucket(false)}
                  />
                </div>
              )}
            </div>
          </div>
          </DragDropProvider>
        )}
          </div>
        </main>

        {showOverview && (
        <aside className="hidden border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 xl:block">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Board overview
          </p>
          <h2 className="editorial-title mt-2 text-[34px] tracking-[-0.035em]">
            Progress
          </h2>
          <div className="mt-6 rounded-[20px] border border-[var(--border-hairline)] bg-[var(--accent-soft)] p-5">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-semibold tracking-[-0.04em]">{completion}%</span>
              <CheckCircle2 className="size-6 text-[var(--success)]" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--border-hairline)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {completedItems} of {checklistItems.length} checklist items complete
            </p>
          </div>
          <div className="mt-4 rounded-[20px] border border-[var(--border-hairline)] bg-[var(--text-primary)] p-5 text-[var(--bg-surface)]">
            <p className="font-semibold">Move cards your way</p>
            <p className="mt-2 text-sm leading-6 opacity-75">
              Drag a card to another bucket, or choose Move and then select a destination bucket.
            </p>
          </div>
          <dl className="mt-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
              <dt className="text-sm text-[var(--text-secondary)]">Buckets</dt>
              <dd className="font-semibold">{buckets.length}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
              <dt className="text-sm text-[var(--text-secondary)]">Cards</dt>
              <dd className="font-semibold">{cards.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-[var(--text-secondary)]">Checklist items</dt>
              <dd className="font-semibold">{checklistItems.length}</dd>
            </div>
          </dl>
        </aside>
        )}
      </div>
      <nav className="glass-panel fixed inset-x-4 bottom-4 z-50 flex h-16 items-center justify-around rounded-2xl border border-[var(--border-hairline)] shadow-[var(--shadow-hover)] md:hidden" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ view: itemView, label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            aria-label={label}
            aria-current={itemView === view ? "page" : undefined}
            className={`grid min-h-11 min-w-11 place-items-center ${
              itemView === view ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
            }`}
          >
            <Icon className="size-5" />
          </Link>
        ))}
      </nav>
      <p className="sr-only" aria-live="polite">{moveAnnouncement}</p>
      {csvImport.elements}
    </div>
  );
}
