import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { requireUser } from "./users";
import { cleanTitle, MAX_CARDS_PER_BUCKET } from "./validation";

// Throws unless the bucket is the user's and has room for one more card.
async function requireRoomInBucket(
  ctx: MutationCtx,
  ownerId: string,
  bucketId: Id<"buckets">,
) {
  const bucket = await ctx.db.get("buckets", bucketId);
  if (bucket === null || bucket.ownerId !== ownerId) {
    throw new ConvexError("That bucket no longer exists.");
  }
  const cards = await ctx.db
    .query("cards")
    .withIndex("by_bucketId", (q) => q.eq("bucketId", bucketId))
    .take(MAX_CARDS_PER_BUCKET);
  if (cards.length >= MAX_CARDS_PER_BUCKET) {
    throw new ConvexError(
      `A bucket can have at most ${MAX_CARDS_PER_BUCKET} cards.`,
    );
  }
}

// Throws unless the card exists and belongs to the user.
async function requireCard(
  ctx: MutationCtx,
  ownerId: string,
  cardId: Id<"cards">,
) {
  const card = await ctx.db.get("cards", cardId);
  if (card === null || card.ownerId !== ownerId) {
    throw new ConvexError("That card no longer exists.");
  }
  return card;
}

// Adds a card to a bucket and returns the new card's ID.
export const create = mutation({
  args: { bucketId: v.id("buckets"), title: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    const title = cleanTitle(args.title);
    await requireRoomInBucket(ctx, ownerId, args.bucketId);
    return await ctx.db.insert("cards", {
      title,
      bucketId: args.bucketId,
      ownerId,
    });
  },
});

// Changes a card's title.
export const rename = mutation({
  args: { cardId: v.id("cards"), title: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    const title = cleanTitle(args.title);
    await requireCard(ctx, ownerId, args.cardId);
    await ctx.db.patch("cards", args.cardId, { title });
    return null;
  },
});

// Puts a card in a different bucket. Its checklist items follow it, because
// they point at the card and not at the bucket.
export const move = mutation({
  args: { cardId: v.id("cards"), bucketId: v.id("buckets") },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    const card = await requireCard(ctx, ownerId, args.cardId);
    if (card.bucketId === args.bucketId) {
      return null;
    }
    await requireRoomInBucket(ctx, ownerId, args.bucketId);
    await ctx.db.patch("cards", args.cardId, { bucketId: args.bucketId });
    return null;
  },
});

// Deletes a card and every checklist item on it.
export const remove = mutation({
  args: { cardId: v.id("cards") },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    await requireCard(ctx, ownerId, args.cardId);
    const itemsOnCard = ctx.db
      .query("checklistItems")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId));
    for await (const item of itemsOnCard) {
      await ctx.db.delete("checklistItems", item._id);
    }
    await ctx.db.delete("cards", args.cardId);
    return null;
  },
});
