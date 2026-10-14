import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { parseBoardCsv } from "./csvImport";
import { requireUser, requireUserForWrite } from "./users";
import {
  MAX_BUCKETS,
  MAX_CARDS_PER_BUCKET,
  MAX_CHECKLIST_ITEMS_PER_CARD,
} from "./validation";

// The most rows a full board can hold, given the limits the mutations enforce.
const MAX_CARDS = MAX_BUCKETS * MAX_CARDS_PER_BUCKET;
const MAX_CHECKLIST_ITEMS = MAX_CARDS * MAX_CHECKLIST_ITEMS_PER_CARD;

// Deletes every bucket, card and checklist item the given user owns. Shared
// by clear, importCsv (which deletes before recreating) and account deletion.
export async function deleteAllOwnedRows(ctx: MutationCtx, ownerId: string) {
  const ownItems = ctx.db
    .query("checklistItems")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId));
  for await (const item of ownItems) {
    await ctx.db.delete("checklistItems", item._id);
  }
  const ownCards = ctx.db
    .query("cards")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId));
  for await (const card of ownCards) {
    await ctx.db.delete("cards", card._id);
  }
  const ownBuckets = ctx.db
    .query("buckets")
    .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId));
  for await (const bucket of ownBuckets) {
    await ctx.db.delete("buckets", bucket._id);
  }
}

// Deletes every bucket, card and checklist item on the user's board.
export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireUserForWrite(ctx);
    await deleteAllOwnedRows(ctx, ownerId);
    return null;
  },
});

// Returns everything on the signed-in user's board, each list oldest first.
export const get = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireUser(ctx);
    const buckets = await ctx.db
      .query("buckets")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_BUCKETS);
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_CARDS);
    const checklistItems = await ctx.db
      .query("checklistItems")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_CHECKLIST_ITEMS);
    return { buckets, cards, checklistItems };
  },
});

// Replaces the user's whole board with the contents of a CSV file: every
// bucket, card and checklist item they have is deleted, then the CSV's are
// created. A mutation is all-or-nothing, so a CSV that fails validation
// changes nothing. Other users' boards are never touched.
export const importCsv = mutation({
  args: { csv: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await requireUserForWrite(ctx, "importCsv");
    const parsed = parseBoardCsv(args.csv);

    await deleteAllOwnedRows(ctx, ownerId);

    const created = { buckets: 0, cards: 0, checklistItems: 0 };
    for (const bucket of parsed.buckets) {
      const bucketId = await ctx.db.insert("buckets", {
        name: bucket.name,
        ownerId,
      });
      created.buckets++;
      for (const card of bucket.cards) {
        const cardId = await ctx.db.insert("cards", {
          title: card.title,
          bucketId,
          ownerId,
        });
        created.cards++;
        for (const title of card.items) {
          await ctx.db.insert("checklistItems", {
            title,
            cardId,
            isDone: false,
            ownerId,
          });
          created.checklistItems++;
        }
      }
    }
    return created;
  },
});
