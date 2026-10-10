import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { rateLimiter } from "./rateLimits";

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

// requireUser for a function that changes data: also counts the call against
// the user's rate limit and refuses it if they are going too fast. A refused
// call throws, so it changes nothing and uses up none of the allowance.
export async function requireUserForWrite(
  ctx: MutationCtx,
  limit: "write" | "importCsv" = "write",
): Promise<string> {
  const ownerId = await requireUser(ctx);
  const { ok } = await rateLimiter.limit(ctx, limit, { key: ownerId });
  if (!ok) {
    throw new ConvexError(
      limit === "importCsv"
        ? "You're importing too often. Wait a minute and try again."
        : "You're making changes too fast. Wait a moment and try again.",
    );
  }
  return ownerId;
}
