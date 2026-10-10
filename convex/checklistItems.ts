import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import { requireUser } from "./users";
import { cleanTitle, MAX_CHECKLIST_ITEMS_PER_CARD } from "./validation";

// Throws unless the item exists and belongs to the user.
async function requireItem(
  ctx: MutationCtx,
  ownerId: string,
  itemId: Id<"checklistItems">,
) {
  const item = await ctx.db.get("checklistItems", itemId);
  if (item === null || item.ownerId !== ownerId) {
    throw new ConvexError("That checklist item no longer exists.");
  }
  return item;
}

// Adds an unticked checklist item to a card and returns the new item's ID.
export const create = mutation({
  args: { cardId: v.id("cards"), title: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    const title = cleanTitle(args.title);
    const card = await ctx.db.get("cards", args.cardId);
    if (card === null || card.ownerId !== ownerId) {
      throw new ConvexError("That card no longer exists.");
    }
    const items = await ctx.db
      .query("checklistItems")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .take(MAX_CHECKLIST_ITEMS_PER_CARD);
    if (items.length >= MAX_CHECKLIST_ITEMS_PER_CARD) {
      throw new ConvexError(
        `A card can have at most ${MAX_CHECKLIST_ITEMS_PER_CARD} checklist items.`,
      );
    }
    return await ctx.db.insert("checklistItems", {
      title,
      cardId: args.cardId,
      isDone: false,
      ownerId,
    });
  },
});

// Changes a checklist item's text.
export const rename = mutation({
  args: { itemId: v.id("checklistItems"), title: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    const title = cleanTitle(args.title);
    await requireItem(ctx, ownerId, args.itemId);
    await ctx.db.patch("checklistItems", args.itemId, { title });
    return null;
  },
});

// Ticks or unticks a checklist item. The page sends the state it wants, so a
// repeated or out-of-order call cannot flip the item the wrong way.
export const setDone = mutation({
  args: { itemId: v.id("checklistItems"), isDone: v.boolean() },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    await requireItem(ctx, ownerId, args.itemId);
    await ctx.db.patch("checklistItems", args.itemId, { isDone: args.isDone });
    return null;
  },
});

// Deletes one checklist item.
export const remove = mutation({
  args: { itemId: v.id("checklistItems") },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    await requireItem(ctx, ownerId, args.itemId);
    await ctx.db.delete("checklistItems", args.itemId);
    return null;
  },
});
