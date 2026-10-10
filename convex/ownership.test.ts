/// <reference types="vite/client" />
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { MAX_BUCKETS } from "./validation";

const modules = import.meta.glob("./**/*.ts");

async function rejection(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ConvexError) return String(error.data);
    throw error;
  }
  throw new Error("Expected the call to be rejected, but it succeeded.");
}

// Two users sharing one database, plus a visitor who is not signed in.
function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  return {
    anonymous: t,
    alice: t.withIdentity({ subject: "alice" }),
    bob: t.withIdentity({ subject: "bob" }),
  };
}

// Gives Alice a bucket with one card that has one checklist item.
async function aliceBoard(alice: ReturnType<typeof setup>["alice"]) {
  const bucketId = await alice.mutation(api.buckets.create, { name: "Alice bucket" });
  const cardId = await alice.mutation(api.cards.create, { bucketId, title: "Alice card" });
  const itemId = await alice.mutation(api.checklistItems.create, { cardId, title: "Alice item" });
  return { bucketId, cardId, itemId };
}

describe("signed-out visitors", () => {
  test("cannot read or change anything", async () => {
    const { anonymous, alice } = setup();
    const { bucketId, cardId, itemId } = await aliceBoard(alice);
    const calls = [
      () => anonymous.query(api.board.get, {}),
      () => anonymous.query(api.buckets.list, {}),
      () => anonymous.mutation(api.buckets.create, { name: "X" }),
      () => anonymous.mutation(api.buckets.rename, { bucketId, name: "X" }),
      () => anonymous.mutation(api.buckets.remove, { bucketId }),
      () => anonymous.mutation(api.cards.create, { bucketId, title: "X" }),
      () => anonymous.mutation(api.cards.rename, { cardId, title: "X" }),
      () => anonymous.mutation(api.cards.move, { cardId, bucketId }),
      () => anonymous.mutation(api.cards.remove, { cardId }),
      () => anonymous.mutation(api.checklistItems.create, { cardId, title: "X" }),
      () => anonymous.mutation(api.checklistItems.rename, { itemId, title: "X" }),
      () => anonymous.mutation(api.checklistItems.setDone, { itemId, isDone: true }),
      () => anonymous.mutation(api.checklistItems.remove, { itemId }),
      () => anonymous.mutation(api.board.importCsv, { csv: "bucket,card\nA,B" }),
    ];
    // Each call starts only when it is awaited, one at a time.
    for (const call of calls) {
      expect(await rejection(call())).toBe("Please sign in.");
    }
  });
});

describe("one user's board is invisible to another", () => {
  test("each user only sees their own board", async () => {
    const { alice, bob } = setup();
    await aliceBoard(alice);
    await bob.mutation(api.buckets.create, { name: "Bob bucket" });

    const aliceView = await alice.query(api.board.get, {});
    expect(aliceView.buckets.map((bucket) => bucket.name)).toEqual(["Alice bucket"]);
    expect(aliceView.cards).toHaveLength(1);
    expect(aliceView.checklistItems).toHaveLength(1);

    const bobView = await bob.query(api.board.get, {});
    expect(bobView.buckets.map((bucket) => bucket.name)).toEqual(["Bob bucket"]);
    expect(bobView.cards).toHaveLength(0);
    expect(bobView.checklistItems).toHaveLength(0);
    expect((await bob.query(api.buckets.list, {})).map((bucket) => bucket.name)).toEqual([
      "Bob bucket",
    ]);
  });

  test("a user cannot change another user's rows, even knowing their IDs", async () => {
    const { alice, bob } = setup();
    const { bucketId, cardId, itemId } = await aliceBoard(alice);
    const bobBucket = await bob.mutation(api.buckets.create, { name: "Bob bucket" });
    const bobCard = await bob.mutation(api.cards.create, { bucketId: bobBucket, title: "Bob card" });

    const noBucket = "That bucket no longer exists.";
    const noCard = "That card no longer exists.";
    const noItem = "That checklist item no longer exists.";
    expect(await rejection(bob.mutation(api.buckets.rename, { bucketId, name: "Mine" }))).toBe(noBucket);
    expect(await rejection(bob.mutation(api.buckets.remove, { bucketId }))).toBe(noBucket);
    expect(await rejection(bob.mutation(api.cards.create, { bucketId, title: "Planted" }))).toBe(noBucket);
    expect(await rejection(bob.mutation(api.cards.rename, { cardId, title: "Mine" }))).toBe(noCard);
    expect(await rejection(bob.mutation(api.cards.remove, { cardId }))).toBe(noCard);
    // Bob cannot pull Alice's card onto his board, or push his card onto hers.
    expect(await rejection(bob.mutation(api.cards.move, { cardId, bucketId: bobBucket }))).toBe(noCard);
    expect(await rejection(bob.mutation(api.cards.move, { cardId: bobCard, bucketId }))).toBe(noBucket);
    expect(await rejection(bob.mutation(api.checklistItems.create, { cardId, title: "Planted" }))).toBe(noCard);
    expect(await rejection(bob.mutation(api.checklistItems.rename, { itemId, title: "Mine" }))).toBe(noItem);
    expect(await rejection(bob.mutation(api.checklistItems.setDone, { itemId, isDone: true }))).toBe(noItem);
    expect(await rejection(bob.mutation(api.checklistItems.remove, { itemId }))).toBe(noItem);

    // Alice's board is exactly as she left it.
    const aliceView = await alice.query(api.board.get, {});
    expect(aliceView.buckets).toMatchObject([{ name: "Alice bucket" }]);
    expect(aliceView.cards).toMatchObject([{ title: "Alice card", bucketId }]);
    expect(aliceView.checklistItems).toMatchObject([{ title: "Alice item", isDone: false }]);
  });

  test("a CSV import replaces only the importing user's board", async () => {
    const { alice, bob } = setup();
    await aliceBoard(alice);
    await bob.mutation(api.buckets.create, { name: "Bob old" });

    await bob.mutation(api.board.importCsv, { csv: "bucket,card title\nBob new,Task" });

    expect((await bob.query(api.board.get, {})).buckets.map((bucket) => bucket.name)).toEqual([
      "Bob new",
    ]);
    const aliceView = await alice.query(api.board.get, {});
    expect(aliceView.buckets.map((bucket) => bucket.name)).toEqual(["Alice bucket"]);
    expect(aliceView.cards).toHaveLength(1);
    expect(aliceView.checklistItems).toHaveLength(1);
  });

  test("limits are counted per user", async () => {
    const { alice, bob } = setup();
    for (let i = 0; i < MAX_BUCKETS; i++) {
      await alice.mutation(api.buckets.create, { name: `Bucket ${i}` });
    }
    expect(await rejection(alice.mutation(api.buckets.create, { name: "One more" }))).toBe(
      `A board can have at most ${MAX_BUCKETS} buckets.`,
    );
    // Alice being full does not stop Bob.
    await bob.mutation(api.buckets.create, { name: "Bob bucket" });
  });
});

describe("rate limits", () => {
  test("a user who changes things too fast is refused, and others are not", async () => {
    const { alice, bob } = setup();
    const bucketId = await alice.mutation(api.buckets.create, { name: "Bucket" });
    // The allowance is 120 changes; the bucket above used one.
    for (let i = 0; i < 119; i++) {
      await alice.mutation(api.buckets.rename, { bucketId, name: `Name ${i}` });
    }
    expect(
      await rejection(alice.mutation(api.buckets.rename, { bucketId, name: "Too many" })),
    ).toBe("You're making changes too fast. Wait a moment and try again.");
    // The refused call changed nothing, and reading is not limited.
    expect((await alice.query(api.buckets.list, {}))[0].name).toBe("Name 118");
    await bob.mutation(api.buckets.create, { name: "Bob bucket" });
  });

  test("CSV imports have their own, tighter limit", async () => {
    const { alice } = setup();
    const csv = "bucket,card title\nPhase 1,Task";
    for (let i = 0; i < 3; i++) {
      await alice.mutation(api.board.importCsv, { csv });
    }
    expect(await rejection(alice.mutation(api.board.importCsv, { csv }))).toBe(
      "You're importing too often. Wait a minute and try again.",
    );
    // Other changes still work after imports are used up.
    await alice.mutation(api.buckets.create, { name: "Still allowed" });
  });
});
