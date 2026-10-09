"use client";

import { Board, type BoardActions } from "./board";

const buckets = [
  { _id: "bucket-1", _creationTime: 1, name: "Phase 1" },
  { _id: "bucket-2", _creationTime: 2, name: "Phase 2" },
  { _id: "bucket-3", _creationTime: 3, name: "Phase 3" },
  { _id: "bucket-4", _creationTime: 4, name: "Phase 4" },
  { _id: "bucket-5", _creationTime: 5, name: "Phase 5" },
];

const cards = [
  {
    _id: "card-1",
    _creationTime: 1,
    title: "Create the board interface",
    bucketId: "bucket-1",
  },
  {
    _id: "card-2",
    _creationTime: 2,
    title: "Connect bucket actions",
    bucketId: "bucket-2",
  },
  {
    _id: "card-3",
    _creationTime: 3,
    title: "Review the first version",
    bucketId: "bucket-3",
  },
];

const checklistItems = [
  {
    _id: "item-1",
    _creationTime: 1,
    title: "Build the board shell",
    cardId: "card-1",
    isDone: true,
  },
  {
    _id: "item-2",
    _creationTime: 2,
    title: "Add card controls",
    cardId: "card-1",
    isDone: true,
  },
  {
    _id: "item-3",
    _creationTime: 3,
    title: "Check empty states",
    cardId: "card-1",
    isDone: false,
  },
  {
    _id: "item-4",
    _creationTime: 4,
    title: "Load buckets from Convex",
    cardId: "card-2",
    isDone: true,
  },
  {
    _id: "item-5",
    _creationTime: 5,
    title: "Pass mutations as actions",
    cardId: "card-2",
    isDone: false,
  },
];

// These placeholders make the frontend contract visible without calling Convex.
// The backend owner can replace each function with the matching mutation later.
const actions: BoardActions = {
  onAddBucket: () => undefined,
  onRenameBucket: () => undefined,
  onDeleteBucket: () => undefined,
  onAddCard: () => undefined,
  onRenameCard: () => undefined,
  onDeleteCard: () => undefined,
  onMoveCard: () => undefined,
  onAddChecklistItem: () => undefined,
  onRenameChecklistItem: () => undefined,
  onToggleChecklistItem: () => undefined,
  onDeleteChecklistItem: () => undefined,
};

export default function Home() {
  return (
    <Board
      buckets={buckets}
      cards={cards}
      checklistItems={checklistItems}
      actions={actions}
      isLoading={false}
      error={null}
    />
  );
}
