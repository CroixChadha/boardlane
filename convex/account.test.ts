/// <reference types="vite/client" />
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  return t.withIdentity({ subject: "clerk-user-1" });
}

async function rejection(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ConvexError) return String(error.data);
    throw error;
  }
  throw new Error("Expected the call to be rejected, but it succeeded.");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("deleteMine", () => {
  test("deletes the Clerk user and the board, in that order", async () => {
    const t = setup();
    await t.mutation(api.buckets.create, { name: "Bucket" });
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_123");
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await t.action(api.account.deleteMine, {});

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.clerk.com/v1/users/clerk-user-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect((await t.query(api.board.get, {})).buckets).toEqual([]);
  });

  test("leaves the board untouched when the Clerk call fails", async () => {
    const t = setup();
    await t.mutation(api.buckets.create, { name: "Bucket" });
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_123");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 500 })));

    expect(await rejection(t.action(api.account.deleteMine, {}))).toBe(
      "Could not delete your account right now. Try again in a moment.",
    );
    expect((await t.query(api.board.get, {})).buckets).toHaveLength(1);
  });

  test("refuses when the Clerk secret key is not configured", async () => {
    const t = setup();
    vi.stubEnv("CLERK_SECRET_KEY", "");

    expect(await rejection(t.action(api.account.deleteMine, {}))).toBe(
      "Account deletion isn't set up yet. Try again later.",
    );
  });
});
