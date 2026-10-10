"use client";

import { FormEvent, useId, useState, useSyncExternalStore } from "react";
import {
  DragDropProvider,
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
  Pencil,
  Plus,
  Search,
  Settings,
  SquareKanban,
  Sun,
  Trash2,
} from "lucide-react";

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
};

type BoardProps = {
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
    <span className="grid size-9 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold tracking-[-0.06em] text-[var(--btn-primary-text)] shadow-sm">
      BL
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
      className={`task-card rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-card)] ${
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
      className={`kanban-column w-[320px] shrink-0 snap-center rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-3.5 ${
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
                <span className="size-2 rounded-sm bg-[var(--accent)]" />
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
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const atBucketLimit = buckets.length >= MAX_BUCKETS;
  const completedItems = checklistItems.filter((item) => item.isDone).length;
  const completion = checklistItems.length
    ? Math.round((completedItems / checklistItems.length) * 100)
    : 0;
  const visibleCards = cards.filter((card) =>
    card.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (isLoading) return <LoadingBoard />;

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
    <div className="board-stage min-h-screen bg-[var(--bg-page)] p-0 text-[var(--text-primary)] lg:p-4">
      <div className="app-shell mx-auto grid min-h-screen max-w-[1800px] overflow-clip bg-[var(--bg-surface)] lg:min-h-[calc(100vh-32px)] lg:rounded-[var(--radius-xl)] lg:border lg:border-[var(--border-hairline)] md:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[208px_minmax(0,1fr)_288px]">
        <aside className="glass-panel hidden border-r border-[var(--border-hairline)] px-3 py-4 md:flex md:flex-col xl:px-4">
          <div className="flex items-center gap-3 px-1 xl:px-2">
            <BrandMark />
            <span className="hidden text-base font-bold tracking-[-0.035em] xl:block">
              Boardlane
            </span>
          </div>
          <nav className="mt-8 space-y-1" aria-label="Main navigation">
            {[
              { label: "Home", icon: Home },
              { label: "Board", icon: LayoutDashboard, active: true },
              { label: "Progress", icon: BarChart3 },
            ].map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                aria-current={active ? "page" : undefined}
                disabled={!active}
                title={active ? undefined : `${label} is not yet available`}
                className={`relative flex h-10 w-full items-center justify-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition xl:justify-start ${
                  active
                    ? "bg-[var(--accent)] text-[var(--btn-primary-text)]"
                    : "cursor-not-allowed text-[var(--text-tertiary)] opacity-60"
                }`}
              >
                <Icon className="size-[18px]" />
                <span className="sr-only xl:not-sr-only">{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-2">
            <button
              type="button"
              disabled
              aria-label="Help"
              title="Help is not yet available"
              className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-tertiary)] opacity-60 xl:justify-start"
            >
              <CircleHelp className="size-5" />
              <span className="sr-only xl:not-sr-only">Help</span>
            </button>
            <button
              type="button"
              disabled
              aria-label="Settings"
              title="Settings are not yet available"
              className="flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-tertiary)] opacity-60 xl:justify-start"
            >
              <Settings className="size-5" />
              <span className="sr-only xl:not-sr-only">Settings</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 bg-[var(--bg-surface)]">
          <header className="glass-panel sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-[var(--border-hairline)] px-5 md:px-7">
            <label className="search-pill flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] px-3 text-[var(--text-secondary)] md:max-w-xs">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={changeTheme}
                className="grid size-9 place-items-center rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
              >
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>
              <button
                type="button"
                disabled={atBucketLimit}
                onClick={() => setAddingBucket(true)}
                className="primary-button flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--btn-primary-bg)] px-3.5 text-sm font-semibold text-[var(--btn-primary-text)] disabled:cursor-not-allowed disabled:opacity-40"
                title={atBucketLimit ? "A board can have at most 25 buckets." : undefined}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">
                  {atBucketLimit ? "Limit reached" : "Add bucket"}
                </span>
              </button>
            </div>
          </header>

          <div className="px-5 pb-28 pt-7 md:px-7 md:pb-8 md:pt-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--border-hairline)] pb-6">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.02em] text-[var(--accent)]">
                  Boardlane / Development
                </p>
                <h1 className="page-title text-[clamp(2rem,4vw,3.35rem)] font-medium leading-[1.02] tracking-[-0.055em]">
                  Product roadmap
                </h1>
              </div>
              <div className="segmented-control flex rounded-[var(--radius-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-1 text-xs font-medium">
                <span className="rounded-[7px] bg-[var(--bg-surface)] px-3 py-1.5 text-[var(--text-primary)] shadow-sm">
                  Board
                </span>
                <span className="px-3 py-1.5 text-[var(--text-secondary)]">
                  {cards.length} cards
                </span>
              </div>
            </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_25%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--danger)]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {movingCardId && (
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

        {buckets.length === 0 && !addingBucket ? (
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
              </p>
              <button
                type="button"
                onClick={() => setAddingBucket(true)}
                className="primary-button mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--btn-primary-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--btn-primary-text)]"
              >
                <Plus className="size-4" />
                Add a bucket
              </button>
            </div>
          </section>
        ) : (
          <DragDropProvider
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

        <aside className="hidden border-l border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-5 xl:block">
          <p className="text-xs font-semibold text-[var(--accent)]">
            Boardlane / Overview
          </p>
          <h2 className="mt-2 text-[26px] font-medium tracking-[-0.045em]">
            Progress
          </h2>
          <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
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
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--accent)] p-5 text-[var(--btn-primary-text)]">
            <p className="font-semibold">Move cards your way</p>
            <p className="mt-2 text-sm leading-6 opacity-75">
              Drag a card by its handle, or choose Move and then select a destination bucket.
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
      </div>
      <nav className="glass-panel fixed inset-x-4 bottom-4 z-50 flex h-16 items-center justify-around rounded-2xl border border-[var(--border-hairline)] shadow-[var(--shadow-hover)] md:hidden" aria-label="Mobile navigation">
        <button type="button" disabled className="grid min-h-11 min-w-11 cursor-not-allowed place-items-center text-[var(--text-tertiary)] opacity-60" aria-label="Home, not yet available" title="Home is not yet available"><Home className="size-5" /></button>
        <button type="button" aria-current="page" className="grid min-h-11 min-w-11 place-items-center text-[var(--accent)]" aria-label="Board"><LayoutDashboard className="size-5" /></button>
        <button type="button" disabled className="grid min-h-11 min-w-11 cursor-not-allowed place-items-center text-[var(--text-tertiary)] opacity-60" aria-label="Progress, not yet available" title="Progress is not yet available"><BarChart3 className="size-5" /></button>
      </nav>
      <p className="sr-only" aria-live="polite">{moveAnnouncement}</p>
    </div>
  );
}
