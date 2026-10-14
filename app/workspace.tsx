"use client";

import { useClerk } from "@clerk/nextjs";
import { useConvexAuth, useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MAX_IMPORT_BYTES } from "@/convex/validation";
import {
  Board,
  type BoardActions,
  type CsvImportSummary,
  type WorkspaceView,
} from "./board";

// The backend rejects bad input with a ConvexError whose data is a message
// written for the user. Anything else is a fault the user cannot act on.
function messageFor(error: unknown): string {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  return "Something went wrong. Please try again.";
}

// Loads the signed-in user's board and supplies every action, then shows the
// requested page of the workspace. The three routes (/, /home, /progress) all
// render this, so they share one live copy of the data.
export function Workspace({ view }: { view: WorkspaceView }) {
  // The board is private, so wait until Convex has verified who is signed in
  // before asking for it. Signed-out visitors never reach this page: proxy.ts
  // sends them to the sign-in page.
  const { isAuthenticated } = useConvexAuth();
  const board = useQuery(api.board.get, isAuthenticated ? {} : "skip");
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useClerk();

  const createBucket = useMutation(api.buckets.create);
  const renameBucket = useMutation(api.buckets.rename);
  const removeBucket = useMutation(api.buckets.remove);
  const createCard = useMutation(api.cards.create);
  const renameCard = useMutation(api.cards.rename);
  const removeCard = useMutation(api.cards.remove);
  const createItem = useMutation(api.checklistItems.create);
  const renameItem = useMutation(api.checklistItems.rename);
  const removeItem = useMutation(api.checklistItems.remove);
  const importCsv = useMutation(api.board.importCsv);
  const clearBoard = useMutation(api.board.clear);
  const deleteAccount = useAction(api.account.deleteMine);

  // Moving a card and ticking an item update the board straight away and are
  // rolled back by Convex if the backend rejects them, so they do not wait on
  // a round trip.
  const moveCard = useMutation(api.cards.move).withOptimisticUpdate(
    (localStore, { cardId, bucketId }) => {
      const current = localStore.getQuery(api.board.get, {});
      if (current === undefined) return;
      localStore.setQuery(api.board.get, {}, {
        ...current,
        cards: current.cards.map((card) =>
          card._id === cardId ? { ...card, bucketId } : card,
        ),
      });
    },
  );
  const setItemDone = useMutation(
    api.checklistItems.setDone,
  ).withOptimisticUpdate((localStore, { itemId, isDone }) => {
    const current = localStore.getQuery(api.board.get, {});
    if (current === undefined) return;
    localStore.setQuery(api.board.get, {}, {
      ...current,
      checklistItems: current.checklistItems.map((item) =>
        item._id === itemId ? { ...item, isDone } : item,
      ),
    });
  });

  // Runs one backend call and shows its error message, if any, on the board.
  // Returns whether it succeeded.
  async function run(call: () => Promise<unknown>): Promise<boolean> {
    setError(null);
    try {
      await call();
      return true;
    } catch (caught) {
      setError(messageFor(caught));
      return false;
    }
  }

  // The board works with plain string IDs; they are Convex IDs it was given.
  const actions: BoardActions = {
    onAddBucket: async (name) => {
      await run(() => createBucket({ name }));
    },
    onRenameBucket: async (bucketId, name) => {
      await run(() =>
        renameBucket({ bucketId: bucketId as Id<"buckets">, name }),
      );
    },
    onDeleteBucket: async (bucketId) => {
      await run(() => removeBucket({ bucketId: bucketId as Id<"buckets"> }));
    },
    onAddCard: async (bucketId, title) => {
      await run(() =>
        createCard({ bucketId: bucketId as Id<"buckets">, title }),
      );
    },
    onRenameCard: async (cardId, title) => {
      await run(() => renameCard({ cardId: cardId as Id<"cards">, title }));
    },
    onDeleteCard: async (cardId) => {
      await run(() => removeCard({ cardId: cardId as Id<"cards"> }));
    },
    // The board announces a move to screen readers once this resolves, so a
    // failed move has to reject.
    onMoveCard: async (cardId, bucketId) => {
      const moved = await run(() =>
        moveCard({
          cardId: cardId as Id<"cards">,
          bucketId: bucketId as Id<"buckets">,
        }),
      );
      if (!moved) throw new Error("The card was not moved.");
    },
    onAddChecklistItem: async (cardId, title) => {
      await run(() => createItem({ cardId: cardId as Id<"cards">, title }));
    },
    onRenameChecklistItem: async (itemId, title) => {
      await run(() =>
        renameItem({ itemId: itemId as Id<"checklistItems">, title }),
      );
    },
    onToggleChecklistItem: async (itemId, isDone) => {
      await run(() =>
        setItemDone({ itemId: itemId as Id<"checklistItems">, isDone }),
      );
    },
    onDeleteChecklistItem: async (itemId) => {
      await run(() => removeItem({ itemId: itemId as Id<"checklistItems"> }));
    },
    onClearBoard: async () => {
      const cleared = await run(() => clearBoard({}));
      if (!cleared) throw new Error("The board was not cleared.");
    },
    // Deletes the Clerk login as well as the board, so the session is dead
    // once this resolves. Sign out and leave the app rather than show a
    // board that can no longer be loaded.
    onDeleteAccount: async () => {
      const deleted = await run(() => deleteAccount({}));
      if (!deleted) throw new Error("The account was not deleted.");
      await signOut({ redirectUrl: "/sign-in" });
    },
    // The backend enforces the same limit; checking here rejects an oversized
    // file before the user is asked to confirm replacing the board.
    onCheckCsvFile: (file) => {
      if (file.size > MAX_IMPORT_BYTES) {
        setError(`A CSV import can be at most ${MAX_IMPORT_BYTES / 1024} KB.`);
        return false;
      }
      return true;
    },
    onImportCsv: async (file) => {
      let summary: CsvImportSummary | null = null;
      await run(async () => {
        summary = await importCsv({ csv: await file.text() });
      });
      return summary;
    },
  };

  return (
    <Board
      view={view}
      buckets={board?.buckets ?? []}
      cards={board?.cards ?? []}
      checklistItems={board?.checklistItems ?? []}
      actions={actions}
      isLoading={board === undefined}
      error={error}
    />
  );
}
