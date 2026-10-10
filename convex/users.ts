import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Returns the signed-in user's stable ID, or throws if nobody is signed in.
// Every function calls this and only reads or changes rows whose ownerId
// matches. The ID always comes from the verified session, never from an
// argument, so one user cannot act as another.
export async function requireUser(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new ConvexError("Please sign in.");
  }
  return identity.tokenIdentifier;
}
