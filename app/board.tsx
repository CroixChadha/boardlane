"use client";

import { FormEvent, useId, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckSquare2,
  ChevronRight,
  Circle,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  SquareKanban,
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
      className={`rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(25,38,58,0.04),0_7px_20px_rgba(25,38,58,0.035)] transition ${
        isMoving
          ? "border-[#4b8d6b] ring-3 ring-[#dcece4]"
          : "border-[#e4e7eb] hover:border-[#d1d7dd]"
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
            <MoreHorizontal className="mt-1 size-4 shrink-0 text-slate-300" />
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
    <section className="w-[300px] shrink-0" aria-labelledby={`bucket-${bucket._id}`}>
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
    <div className="grid min-h-screen place-items-center bg-[#f4f5f3]">
      <div className="flex items-center gap-3 rounded-2xl border border-[#e0e4e1] bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
        <LoaderCircle className="size-4 animate-spin text-[#4b8d6b]" />
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
  const atBucketLimit = buckets.length >= MAX_BUCKETS;

  if (isLoading) return <LoadingBoard />;

  function moveCard(bucketId: string) {
    if (!movingCardId) return;
    const card = cards.find((candidate) => candidate._id === movingCardId);
    if (card && card.bucketId !== bucketId) {
      actions.onMoveCard(movingCardId, bucketId);
    }
    setMovingCardId(null);
  }

  return (
    <main className="min-h-screen bg-[#f4f5f3] text-[#1d2939]">
      <header className="border-b border-[#e2e5e3] bg-[#fbfcfa]/95 px-5 py-4 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <p className="text-lg font-bold tracking-[-0.035em] text-[#17243b]">
                Boardlane
              </p>
              <p className="truncate text-xs text-slate-400">Development board</p>
            </div>
          </div>
          <button
            type="button"
            disabled={atBucketLimit}
            onClick={() => setAddingBucket(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-[#17243b] px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#243653] disabled:cursor-not-allowed disabled:opacity-40"
            title={atBucketLimit ? "A board can have at most 25 buckets." : undefined}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">
              {atBucketLimit ? "Bucket limit reached" : "Add bucket"}
            </span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {movingCardId && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#b9d5c4] bg-[#edf5f0] px-4 py-3 text-sm text-[#2f6d4a]">
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
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e5efe9] text-[#397956]">
                <SquareKanban className="size-6" />
              </span>
              <h1 className="mt-4 text-xl font-bold tracking-tight text-[#17243b]">
                Start your first phase
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Buckets organize your cards into the stages of your project.
              </p>
              <button
                type="button"
                onClick={() => setAddingBucket(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17243b] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus className="size-4" />
                Add a bucket
              </button>
            </div>
          </section>
        ) : (
          <div className="board-scroll overflow-x-auto pb-8">
            <div className="flex min-w-max items-start gap-5">
              {buckets.map((bucket) => (
                <BucketColumn
                  key={bucket._id}
                  bucket={bucket}
                  cards={cards.filter((card) => card.bucketId === bucket._id)}
                  checklistItems={checklistItems}
                  actions={actions}
                  movingCardId={movingCardId}
                  onStartMove={setMovingCardId}
                  onCancelMove={() => setMovingCardId(null)}
                  onMoveHere={moveCard}
                />
              ))}

              {addingBucket && (
                <div className="w-[300px] shrink-0 rounded-2xl border border-[#d8dde1] bg-white p-3 shadow-sm">
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
        )}
      </div>
    </main>
  );
}
