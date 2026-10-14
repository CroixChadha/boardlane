import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";
import { deleteAllOwnedRows } from "./board";
import { requireUserForWrite } from "./users";

// Deletes every row the given user owns. Only account.deleteMine calls this,
// after it has already checked who is signed in, so it trusts the ownerId
// it is given rather than deriving it again.
export const deleteAllRows = internalMutation({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    await deleteAllOwnedRows(ctx, args.ownerId);
    return null;
  },
});

// Deletes the signed-in user's Clerk login and all of their board data.
// The Clerk account is deleted first: if that call fails, nothing is lost
// and the user can try again.
export const deleteMine = action({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireUserForWrite(ctx);
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new ConvexError("Please sign in.");
    }

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new ConvexError("Account deletion isn't set up yet. Try again later.");
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${identity.subject}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) {
      throw new ConvexError("Could not delete your account right now. Try again in a moment.");
    }

    await ctx.runMutation(internal.account.deleteAllRows, { ownerId });
    return null;
  },
});
