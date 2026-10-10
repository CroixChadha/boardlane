import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { parseBoardCsv } from "./csvImport";
import {
  MAX_BUCKETS,
  MAX_CARDS_PER_BUCKET,
  MAX_CHECKLIST_ITEMS_PER_CARD,
} from "./validation";

// The most rows a full board can hold, given the limits the mutations enforce.
const MAX_CARDS = MAX_BUCKETS * MAX_CARDS_PER_BUCKET;
const MAX_CHECKLIST_ITEMS = MAX_CARDS * MAX_CHECKLIST_ITEMS_PER_CARD;

// Returns everything the board page shows, each list oldest first. There is
// one board until sign-in exists, so this reads the three tables whole.
export const get = query({
  args: {},
  handler: async (ctx) => {
    const buckets = await ctx.db.query("buckets").take(MAX_BUCKETS);
    const cards = await ctx.db.query("cards").take(MAX_CARDS);
    const checklistItems = await ctx.db
      .query("checklistItems")
      .take(MAX_CHECKLIST_ITEMS);
    return { buckets, cards, checklistItems };
  },
});

// Replaces the whole board with the contents of a CSV file: every existing
// bucket, card and checklist item is deleted, then the CSV's are created. A
// mutation is all-or-nothing, so a CSV that fails validation changes nothing.
export const importCsv = mutation({
  args: { csv: v.string() },
  handler: async (ctx, args) => {
    const parsed = parseBoardCsv(args.csv);

    for await (const item of ctx.db.query("checklistItems")) {
      await ctx.db.delete("checklistItems", item._id);
    }
    for await (const card of ctx.db.query("cards")) {
      await ctx.db.delete("cards", card._id);
    }
    for await (const bucket of ctx.db.query("buckets")) {
      await ctx.db.delete("buckets", bucket._id);
    }

    const created = { buckets: 0, cards: 0, checklistItems: 0 };
    for (const bucket of parsed.buckets) {
      const bucketId = await ctx.db.insert("buckets", { name: bucket.name });
      created.buckets++;
      for (const card of bucket.cards) {
        const cardId = await ctx.db.insert("cards", {
          title: card.title,
          bucketId,
        });
        created.cards++;
        for (const title of card.items) {
          await ctx.db.insert("checklistItems", {
            title,
            cardId,
            isDone: false,
          });
          created.checklistItems++;
        }
      }
    }
    return created;
  },
});
