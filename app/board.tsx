"use client";

import { FormEvent, useId, useState } from "react";
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
  onAddBucket: (name: string) => void;
  onRenameBucket: (bucketId: string, name: string) => void;
  onDeleteBucket: (bucketId: string) => void;
  onAddCard: (bucketId: string, title: string) => void;
  onRenameCard: (cardId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, bucketId: string) => void;
  onAddChecklistItem: (cardId: string, title: string) => void;
  onRenameChecklistItem: (itemId: string, title: string) => void;
  onToggleChecklistItem: (itemId: string, isDone: boolean) => void;
  onDeleteChecklistItem: (itemId: string) => void;
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

function BrandMark() {
  return (
    <span className="grid size-9 grid-cols-2 gap-1 rounded-[11px] bg-[#17243b] p-2 shadow-sm">
      <span className="rounded-[2px] bg-white/95" />
      <span className="rounded-[2px] bg-white/55" />
      <span className="rounded-[2px] bg-[#74c69d]" />
      <span className="rounded-[2px] bg-white/95" />
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
        className="w-full rounded-xl border border-[#cfd5da] bg-white px-3 py-2.5 text-sm text-[#1d2939] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#4b8d6b] focus:ring-3 focus:ring-[#dcece4]"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400">
          {value.length}/{MAX_TITLE_LENGTH}
        </span>
        <span className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!value.trim()}
            className="rounded-lg bg-[#17243b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#243653] disabled:cursor-not-allowed disabled:opacity-40"
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
    <div className="mt-4 border-t border-slate-100 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          <CheckSquare2 className="size-3.5" />
          Checklist
        </p>
        <span className="text-[11px] font-medium text-slate-400">
          {items.filter((item) => item.isDone).length}/{items.length}
        </span>
      </div>

      {items.length === 0 && !adding ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
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
                <div className="group/item flex items-start gap-2 rounded-lg px-1 py-1.5 hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() =>
                      actions.onToggleChecklistItem(item._id, !item.isDone)
                    }
                    className="mt-0.5 text-[#4b8d6b]"
                    aria-label={
                      item.isDone
                        ? `Mark ${item.title} incomplete`
                        : `Mark ${item.title} complete`
                    }
                  >
                    {item.isDone ? (
                      <CheckSquare2 className="size-4" />
                    ) : (
                      <Circle className="size-4 text-slate-300" />
                    )}
                  </button>
                  <span
                    className={`min-w-0 flex-1 text-xs leading-5 ${
                      item.isDone ? "text-slate-400 line-through" : "text-slate-600"
                    }`}
                  >
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingId(item._id)}
                    className="rounded p-1 text-slate-300 hover:bg-white hover:text-slate-600"
                    aria-label={`Rename ${item.title}`}
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.onDeleteChecklistItem(item._id)}
                    className="rounded p-1 text-slate-300 hover:bg-white hover:text-red-600"
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
          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#397956] hover:bg-[#edf5f0] disabled:cursor-not-allowed disabled:text-slate-300"
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
    data: { cardId: card._id, bucketId: card.bucketId },
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
      ref={ref}
      role="listitem"
      className={`task-card rounded-[var(--radius-lg)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-card)] ${
        isDragging
          ? "z-50 rotate-3 scale-[1.03] opacity-80 shadow-[var(--shadow-drag)]"
          : isMoving
            ? "ring-2 ring-[var(--accent)] ring-offset-2"
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
            <h3 className="text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[#1d2939]">
              {card.title}
            </h3>
            <button
              ref={handleRef}
              type="button"
              className="drag-handle -mr-1 -mt-1 grid size-9 shrink-0 cursor-grab place-items-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] active:cursor-grabbing"
              aria-label={`Drag ${card.title}. Press Space to pick up, arrow keys to move, and Space to drop.`}
            >
              <GripVertical className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={isMoving ? onCancelMove : onStartMove}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-[#397956] hover:bg-[#edf5f0]"
            >
              {isMoving ? "Cancel move" : "Move"}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600"
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
  checklistItems,
  actions,
  movingCardId,
  onStartMove,
  onCancelMove,
  onMoveHere,
}: {
  bucket: Bucket;
  cards: Card[];
  checklistItems: ChecklistItem[];
  actions: BoardActions;
  movingCardId: string | null;
  onStartMove: (cardId: string) => void;
  onCancelMove: () => void;
  onMoveHere: (bucketId: string) => void;
}) {
  const [addingCard, setAddingCard] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const { ref, isDropTarget } = useDroppable({
    id: bucket._id,
    data: { bucketId: bucket._id },
  });

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
      role="list"
      className={`kanban-column w-[320px] shrink-0 snap-center rounded-[22px] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-4 ${
        isDropTarget ? "drop-target" : ""
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
                <span className="size-2 rounded-full bg-[#4b8d6b]" />
                <h2
                  id={`bucket-${bucket._id}`}
                  className="text-sm font-semibold text-[#344054]"
                >
                  {bucket.name}
                </h2>
                <span className="rounded-md bg-[#e6e9e7] px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
                  {cards.length}
                </span>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                  aria-label={`Rename ${bucket.name}`}
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#9cc7ae] bg-[#edf5f0] px-3 py-2 text-xs font-semibold text-[#2f6d4a] hover:bg-[#e2f0e8]"
              >
                Move selected card here
                <ChevronRight className="size-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="space-y-3">
        {isDropTarget && (
          <div className="drop-placeholder rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-8 text-center text-sm font-semibold text-[var(--accent)]">
            Drop here
          </div>
        )}
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d3d8dc] px-5 py-8 text-center">
            <SquareKanban className="mx-auto size-5 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">No cards yet</p>
            <p className="mt-1 text-xs text-slate-400">Add the first task to this phase.</p>
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

        {addingCard ? (
          <div className="rounded-2xl border border-[#d8dde1] bg-white p-3">
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
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#d1d6da] px-3 py-3 text-sm font-medium text-slate-500 hover:border-[#9eaaa4] hover:bg-white/70 hover:text-[#274d39]"
          >
            <Plus className="size-4" />
            Add card
          </button>
        )}
      </div>
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
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
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

  function moveCard(bucketId: string) {
    if (!movingCardId) return;
    const card = cards.find((candidate) => candidate._id === movingCardId);
    if (card && card.bucketId !== bucketId) {
      actions.onMoveCard(movingCardId, bucketId);
      const bucket = buckets.find((candidate) => candidate._id === bucketId);
      setMoveAnnouncement(
        `${card.title} moved to ${bucket?.name ?? "the selected bucket"}.`,
      );
    }
    setMovingCardId(null);
  }

  return (
    <div
      data-theme={theme}
      className="board-stage min-h-screen bg-[var(--bg-page)] p-0 text-[var(--text-primary)] lg:p-6"
    >
      <div className="app-shell mx-auto grid min-h-screen max-w-[1680px] overflow-hidden bg-[var(--bg-surface)] lg:min-h-[calc(100vh-48px)] lg:rounded-[var(--radius-xl)] lg:border lg:border-[var(--border-hairline)] lg:shadow-[0_28px_90px_rgba(0,0,0,0.08)] md:grid-cols-[72px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="glass-panel hidden border-r border-[var(--border-hairline)] px-3 py-5 md:flex md:flex-col xl:px-4">
          <div className="flex items-center gap-3 px-1 xl:px-2">
            <BrandMark />
            <span className="hidden text-lg font-semibold tracking-[-0.025em] xl:block">
              Boardlane
            </span>
          </div>
          <nav className="mt-10 space-y-2" aria-label="Main navigation">
            {[
              { label: "Home", icon: Home },
              { label: "Board", icon: LayoutDashboard, active: true },
              { label: "Progress", icon: BarChart3 },
            ].map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                type="button"
                className={`relative flex h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold transition xl:justify-start ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--text-primary)] before:absolute before:-left-3 before:h-6 before:w-[3px] before:rounded-full before:bg-[var(--accent)] xl:before:-left-4"
                    : "text-[var(--text-secondary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }`}
              >
                <Icon className={`size-5 ${active ? "text-[var(--accent)]" : ""}`} />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-2">
            <button className="flex h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-black/[0.04] xl:justify-start">
              <CircleHelp className="size-5" />
              <span className="hidden xl:inline">Help</span>
            </button>
            <button className="flex h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-black/[0.04] xl:justify-start">
              <Settings className="size-5" />
              <span className="hidden xl:inline">Settings</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 bg-[var(--bg-surface)]">
          <header className="glass-panel sticky top-0 z-40 flex h-[72px] items-center justify-between gap-4 border-b border-[var(--border-hairline)] px-5 md:px-8">
            <label className="search-pill flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-[var(--text-secondary)] md:max-w-xs">
              <Search className="size-4 shrink-0" />
              <span className="sr-only">Search cards</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cards"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="grid size-11 place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
                aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
              >
                {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>
              <button
                type="button"
                disabled={atBucketLimit}
                onClick={() => setAddingBucket(true)}
                className="primary-button flex h-11 items-center gap-2 rounded-full bg-[var(--btn-primary-bg)] px-4 text-sm font-semibold text-[var(--btn-primary-text)] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                title={atBucketLimit ? "A board can have at most 25 buckets." : undefined}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">
                  {atBucketLimit ? "Limit reached" : "Add bucket"}
                </span>
              </button>
            </div>
          </header>

          <div className="px-5 pb-8 pt-8 md:px-8 md:pt-10">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
                  Development workspace
                </p>
                <h1 className="page-title text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.035em]">
                  Product roadmap
                </h1>
              </div>
              <div className="segmented-control flex rounded-full bg-[var(--bg-page)] p-1 text-sm font-medium">
                <span className="rounded-full bg-[var(--bg-surface)] px-4 py-2 text-[var(--text-primary)] shadow-sm">
                  Board
                </span>
                <span className="px-4 py-2 text-[var(--text-secondary)]">
                  {cards.length} cards
                </span>
              </div>
            </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-[var(--danger)]"
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
            onDragEnd={(event) => {
              if (event.canceled) return;
              const cardId = String(event.operation.source?.id ?? "");
              const bucketId = String(event.operation.target?.id ?? "");
              const card = cards.find((candidate) => candidate._id === cardId);
              if (card && bucketId && card.bucketId !== bucketId) {
                actions.onMoveCard(cardId, bucketId);
                const bucket = buckets.find((candidate) => candidate._id === bucketId);
                setMoveAnnouncement(
                  `${card.title} moved to ${bucket?.name ?? "the selected bucket"}.`,
                );
              }
            }}
          >
          <div className="board-scroll overflow-x-auto pb-8">
            <div className="flex min-w-max snap-x snap-mandatory items-start gap-6">
              {buckets.map((bucket) => (
                <BucketColumn
                  key={bucket._id}
                  bucket={bucket}
                  cards={visibleCards.filter((card) => card.bucketId === bucket._id)}
                  checklistItems={checklistItems}
                  actions={actions}
                  movingCardId={movingCardId}
                  onStartMove={setMovingCardId}
                  onCancelMove={() => setMovingCardId(null)}
                  onMoveHere={moveCard}
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

        <aside className="hidden border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 xl:block">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Board overview
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.025em]">
            Progress
          </h2>
          <div className="mt-6 rounded-[22px] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-5">
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
          <div className="mt-5 rounded-[22px] border border-[var(--border-hairline)] bg-[var(--bg-surface-2)] p-5">
            <p className="font-semibold">Move cards your way</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
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
        <button className="grid min-h-11 min-w-11 place-items-center text-[var(--text-secondary)]" aria-label="Home"><Home className="size-5" /></button>
        <button className="grid min-h-11 min-w-11 place-items-center text-[var(--accent)]" aria-label="Board"><LayoutDashboard className="size-5" /></button>
        <button className="grid min-h-11 min-w-11 place-items-center text-[var(--text-secondary)]" aria-label="Progress"><BarChart3 className="size-5" /></button>
      </nav>
      <p className="sr-only" aria-live="polite">{moveAnnouncement}</p>
    </div>
  );
}
