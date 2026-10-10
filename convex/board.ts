import { query } from "./_generated/server";
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
