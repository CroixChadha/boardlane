import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireUser, requireUserForWrite } from "./users";
import { cleanTitle, MAX_BUCKETS } from "./validation";

// Throws unless the bucket exists and belongs to the user. A bucket that
// belongs to someone else is reported the same way as one that does not
// exist, so IDs cannot be used to probe other people's boards.
async function requireBucket(
  ctx: MutationCtx,
  ownerId: string,
  bucketId: Id<"buckets">,
) {
  const bucket = await ctx.db.get("buckets", bucketId);
  if (bucket === null || bucket.ownerId !== ownerId) {
    throw new ConvexError("That bucket no longer exists.");
  }
  return bucket;
}

// Returns the user's buckets, oldest first.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireUser(ctx);
    return await ctx.db
      .query("buckets")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_BUCKETS);
  },
});

// Adds a bucket and returns the new bucket's ID.
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await requireUserForWrite(ctx);
    const name = cleanTitle(args.name);
    const existing = await ctx.db
      .query("buckets")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId))
      .take(MAX_BUCKETS);
    if (existing.length >= MAX_BUCKETS) {
      throw new ConvexError(`A board can have at most ${MAX_BUCKETS} buckets.`);
    }
    return await ctx.db.insert("buckets", { name, ownerId });
  },
});

// Changes a bucket's name.
export const rename = mutation({
  args: { bucketId: v.id("buckets"), name: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await requireUserForWrite(ctx);
    const name = cleanTitle(args.name);
    await requireBucket(ctx, ownerId, args.bucketId);
    await ctx.db.patch("buckets", args.bucketId, { name });
    return null;
  },
});

// Deletes a bucket, every card in it, and every checklist item on those cards.
export const remove = mutation({
  args: { bucketId: v.id("buckets") },
  handler: async (ctx, args) => {
    const ownerId = await requireUserForWrite(ctx);
    await requireBucket(ctx, ownerId, args.bucketId);

    const cardsInBucket = ctx.db
      .query("cards")
      .withIndex("by_bucketId", (q) => q.eq("bucketId", args.bucketId));
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
