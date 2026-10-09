import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { cleanTitle } from "./validation";

// Every function in this file is something the page can ask the backend to do.
// There are two kinds:
//   query     reads data and changes nothing
//   mutation  changes data
//
// Each one has the same two parts:
//   args     what the page must send, and the type of each value. Convex
//            rejects the call if anything is missing or the wrong type.
//   handler  the code that runs. It receives:
//              ctx   the tools Convex gives you; ctx.db is the database
//              args  the values the page sent
//
// "async" and "await": talking to the database takes a moment. "await" means
// "wait for this to finish before going to the next line". Any function that
// uses "await" has to be marked "async".
//
// "export const list = ..." makes a function the page can call as buckets.list
// (file name, then function name).

// The most buckets a board can have.
export const MAX_BUCKETS = 25;

// Returns the buckets, oldest first.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("buckets").take(MAX_BUCKETS);
  },
});

// Adds a bucket and returns the new bucket's ID.
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    // Refuse if the board is already full. take(n) reads at most n rows, so
    // this never reads more than it needs to.
    const existing = await ctx.db.query("buckets").take(MAX_BUCKETS);
    if (existing.length >= MAX_BUCKETS) {
      throw new ConvexError(`A board can have at most ${MAX_BUCKETS} buckets.`);
    }

    // insert(table, row) adds one row. The row is written like a Python dict.
    return await ctx.db.insert("buckets", { name: cleanTitle(args.name) });
  },
});

// Changes a bucket's name.
export const rename = mutation({
  args: { bucketId: v.id("buckets"), name: v.string() },
  handler: async (ctx, args) => {
    // patch(table, id, changes) updates only the columns listed in changes.
    await ctx.db.patch("buckets", args.bucketId, {
      name: cleanTitle(args.name),
    });
    return null;
  },
});

// Deletes a bucket, every card in it, and every checklist item on those cards.
export const remove = mutation({
  args: { bucketId: v.id("buckets") },
  handler: async (ctx, args) => {
    // Find the cards in this bucket, using the index from schema.ts.
    //   (q) => q.eq("bucketId", args.bucketId)
    // is a small function, like a Python lambda. It says: only rows whose
    // bucketId equals the bucket being deleted.
    const cardsInBucket = ctx.db
      .query("cards")
      .withIndex("by_bucketId", (q) => q.eq("bucketId", args.bucketId));

    // "for await (const card of ...)" is a for loop over rows from the database.
    for await (const card of cardsInBucket) {
      const itemsOnCard = ctx.db
        .query("checklistItems")
        .withIndex("by_cardId", (q) => q.eq("cardId", card._id));

      for await (const item of itemsOnCard) {
        await ctx.db.delete("checklistItems", item._id);
      }
      await ctx.db.delete("cards", card._id);
    }

    await ctx.db.delete("buckets", args.bucketId);
    return null;
  },
});
