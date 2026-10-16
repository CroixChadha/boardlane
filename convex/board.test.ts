/// <reference types="vite/client" />
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import {
  MAX_BUCKETS,
  MAX_CARDS_PER_BUCKET,
  MAX_CHECKLIST_ITEMS_PER_CARD,
  MAX_TITLE_LENGTH,
} from "./validation";

const modules = import.meta.glob("./**/*.ts");

// Every function needs a signed-in user, so tests act as one.
function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  return t.withIdentity({ subject: "user-a" });
}

// Resolves to the message of the ConvexError the promise rejects with.
async function rejection(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ConvexError) return String(error.data);
    throw error;
  }
  throw new Error("Expected the call to be rejected, but it succeeded.");
}

describe("buckets", () => {
  test("create trims the name and the board lists it", async () => {
    const t = setup();
    await t.mutation(api.buckets.create, { name: "  Phase 1  " });
    const board = await t.query(api.board.get, {});
    expect(board.buckets.map((bucket) => bucket.name)).toEqual(["Phase 1"]);
  });

  test("rejects empty and over-long names", async () => {
    const t = setup();
    expect(await rejection(t.mutation(api.buckets.create, { name: "   " }))).toBe(
      "This can't be empty.",
    );
    expect(
      await rejection(
        t.mutation(api.buckets.create, { name: "x".repeat(MAX_TITLE_LENGTH + 1) }),
      ),
    ).toBe(`This can be at most ${MAX_TITLE_LENGTH} characters long.`);
    await t.mutation(api.buckets.create, { name: "x".repeat(MAX_TITLE_LENGTH) });
  });

  test("stops at the bucket limit", async () => {
    const t = setup();
    for (let i = 0; i < MAX_BUCKETS; i++) {
      await t.mutation(api.buckets.create, { name: `Bucket ${i}` });
    }
    expect(await rejection(t.mutation(api.buckets.create, { name: "One more" }))).toBe(
      `A board can have at most ${MAX_BUCKETS} buckets.`,
    );
  });

  test("rename changes the name; a deleted bucket cannot be renamed", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Old" });
    await t.mutation(api.buckets.rename, { bucketId, name: "New" });
    expect((await t.query(api.buckets.list, {}))[0].name).toBe("New");

    await t.mutation(api.buckets.remove, { bucketId });
    expect(
      await rejection(t.mutation(api.buckets.rename, { bucketId, name: "Again" })),
    ).toBe("That bucket no longer exists.");
  });

  test("remove deletes its cards and their items, and nothing else", async () => {
    const t = setup();
    const doomed = await t.mutation(api.buckets.create, { name: "Doomed" });
    const kept = await t.mutation(api.buckets.create, { name: "Kept" });
    const doomedCard = await t.mutation(api.cards.create, { bucketId: doomed, title: "A" });
    const keptCard = await t.mutation(api.cards.create, { bucketId: kept, title: "B" });
    await t.mutation(api.checklistItems.create, { cardId: doomedCard, title: "a1" });
    await t.mutation(api.checklistItems.create, { cardId: keptCard, title: "b1" });

    await t.mutation(api.buckets.remove, { bucketId: doomed });

    const board = await t.query(api.board.get, {});
    expect(board.buckets.map((bucket) => bucket.name)).toEqual(["Kept"]);
    expect(board.cards.map((card) => card.title)).toEqual(["B"]);
    expect(board.checklistItems.map((item) => item.title)).toEqual(["b1"]);
  });
});

describe("cards", () => {
  test("create, rename and move", async () => {
    const t = setup();
    const first = await t.mutation(api.buckets.create, { name: "First" });
    const second = await t.mutation(api.buckets.create, { name: "Second" });
    const cardId = await t.mutation(api.cards.create, { bucketId: first, title: " Task " });
    const itemId = await t.mutation(api.checklistItems.create, { cardId, title: "Step" });

    await t.mutation(api.cards.rename, { cardId, title: "Renamed" });
    await t.mutation(api.cards.move, { cardId, bucketId: second });

    const board = await t.query(api.board.get, {});
    expect(board.cards).toMatchObject([{ title: "Renamed", bucketId: second }]);
    // The item still belongs to the card after the move.
    expect(board.checklistItems).toMatchObject([{ _id: itemId, cardId }]);
  });

  test("rejects a missing bucket, a missing card and a bad title", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Bucket" });
    const cardId = await t.mutation(api.cards.create, { bucketId, title: "Task" });
    expect(await rejection(t.mutation(api.cards.create, { bucketId, title: " " }))).toBe(
      "This can't be empty.",
    );

    await t.mutation(api.cards.remove, { cardId });
    expect(await rejection(t.mutation(api.cards.rename, { cardId, title: "X" }))).toBe(
      "That card no longer exists.",
    );
    expect(await rejection(t.mutation(api.cards.move, { cardId, bucketId }))).toBe(
      "That card no longer exists.",
    );

    await t.mutation(api.buckets.remove, { bucketId });
    expect(await rejection(t.mutation(api.cards.create, { bucketId, title: "X" }))).toBe(
      "That bucket no longer exists.",
    );
  });

  test("a bucket stops at the card limit, for both create and move", async () => {
    const t = setup();
    const full = await t.mutation(api.buckets.create, { name: "Full" });
    const other = await t.mutation(api.buckets.create, { name: "Other" });
    for (let i = 0; i < MAX_CARDS_PER_BUCKET; i++) {
      await t.mutation(api.cards.create, { bucketId: full, title: `Card ${i}` });
    }
    const message = `A bucket can have at most ${MAX_CARDS_PER_BUCKET} cards.`;
    expect(
      await rejection(t.mutation(api.cards.create, { bucketId: full, title: "Extra" })),
    ).toBe(message);

    const outsider = await t.mutation(api.cards.create, { bucketId: other, title: "Out" });
    expect(
      await rejection(t.mutation(api.cards.move, { cardId: outsider, bucketId: full })),
    ).toBe(message);
  });

  test("moving a card to the bucket it is already in is allowed when full", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Full" });
    let cardId = await t.mutation(api.cards.create, { bucketId, title: "Card 0" });
    for (let i = 1; i < MAX_CARDS_PER_BUCKET; i++) {
      cardId = await t.mutation(api.cards.create, { bucketId, title: `Card ${i}` });
    }
    await t.mutation(api.cards.move, { cardId, bucketId });
  });

  test("remove deletes the card's items only", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Bucket" });
    const doomed = await t.mutation(api.cards.create, { bucketId, title: "Doomed" });
    const kept = await t.mutation(api.cards.create, { bucketId, title: "Kept" });
    await t.mutation(api.checklistItems.create, { cardId: doomed, title: "d1" });
    await t.mutation(api.checklistItems.create, { cardId: kept, title: "k1" });

    await t.mutation(api.cards.remove, { cardId: doomed });

    const board = await t.query(api.board.get, {});
    expect(board.cards.map((card) => card.title)).toEqual(["Kept"]);
    expect(board.checklistItems.map((item) => item.title)).toEqual(["k1"]);
  });
});

describe("checklist items", () => {
  test("create starts unticked; rename, tick, untick and remove work", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Bucket" });
    const cardId = await t.mutation(api.cards.create, { bucketId, title: "Task" });
    const itemId = await t.mutation(api.checklistItems.create, { cardId, title: " Step " });
    const otherId = await t.mutation(api.checklistItems.create, { cardId, title: "Other" });

    let board = await t.query(api.board.get, {});
    expect(board.checklistItems[0]).toMatchObject({ title: "Step", isDone: false });

    await t.mutation(api.checklistItems.rename, { itemId, title: "Step one" });
    await t.mutation(api.checklistItems.setDone, { itemId, isDone: true });
    // Sending the same state twice leaves it ticked.
    await t.mutation(api.checklistItems.setDone, { itemId, isDone: true });
    board = await t.query(api.board.get, {});
    expect(board.checklistItems[0]).toMatchObject({ title: "Step one", isDone: true });

    await t.mutation(api.checklistItems.setDone, { itemId, isDone: false });
    await t.mutation(api.checklistItems.remove, { itemId });
    board = await t.query(api.board.get, {});
    expect(board.checklistItems).toMatchObject([{ _id: otherId, isDone: false }]);

    expect(
      await rejection(t.mutation(api.checklistItems.setDone, { itemId, isDone: true })),
    ).toBe("That checklist item no longer exists.");
  });

  test("a card stops at the checklist item limit", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Bucket" });
    const cardId = await t.mutation(api.cards.create, { bucketId, title: "Task" });
    for (let i = 0; i < MAX_CHECKLIST_ITEMS_PER_CARD; i++) {
      await t.mutation(api.checklistItems.create, { cardId, title: `Item ${i}` });
    }
    expect(
      await rejection(t.mutation(api.checklistItems.create, { cardId, title: "Extra" })),
    ).toBe(
      `A card can have at most ${MAX_CHECKLIST_ITEMS_PER_CARD} checklist items.`,
    );
  });

  test("cannot be added to a deleted card", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Bucket" });
    const cardId = await t.mutation(api.cards.create, { bucketId, title: "Task" });
    await t.mutation(api.cards.remove, { cardId });
    expect(
      await rejection(t.mutation(api.checklistItems.create, { cardId, title: "X" })),
    ).toBe("That card no longer exists.");
  });
});

describe("clear", () => {
  test("deletes every bucket, card and checklist item on the board", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Bucket" });
    const cardId = await t.mutation(api.cards.create, { bucketId, title: "Task" });
    await t.mutation(api.checklistItems.create, { cardId, title: "Step" });

    await t.mutation(api.board.clear, {});

    expect(await t.query(api.board.get, {})).toEqual({
      buckets: [],
      cards: [],
      checklistItems: [],
    });
  });

  test("leaves an empty board empty, and leaves other users alone", async () => {
    const t = convexTest(schema, modules);
    rateLimiterTest.register(t);
    const alice = t.withIdentity({ subject: "alice" });
    const bob = t.withIdentity({ subject: "bob" });
    await bob.mutation(api.buckets.create, { name: "Bob's bucket" });

    await alice.mutation(api.board.clear, {});

    expect(await alice.query(api.board.get, {})).toEqual({
      buckets: [],
      cards: [],
      checklistItems: [],
    });
    expect((await bob.query(api.board.get, {})).buckets).toHaveLength(1);
  });
});

describe("exportCsv", () => {
  test("an empty board exports just the header", async () => {
    const t = setup();
    expect(await t.query(api.board.exportCsv, {})).toBe(
      "bucket,card title,checklist item",
    );
  });

  test("a bucket with no cards and a card with no items each get one row", async () => {
    const t = setup();
    await t.mutation(api.buckets.create, { name: "Empty bucket" });
    const bucketId = await t.mutation(api.buckets.create, { name: "Bucket" });
    await t.mutation(api.cards.create, { bucketId, title: "Bare card" });

    expect(await t.query(api.board.exportCsv, {})).toBe(
      [
        "bucket,card title,checklist item",
        "Empty bucket,,",
        "Bucket,Bare card,",
      ].join("\n"),
    );
  });

  test("quotes values with commas, quotes or line breaks", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: 'Phase "one"' });
    const cardId = await t.mutation(api.cards.create, { bucketId, title: "A, B" });
    await t.mutation(api.checklistItems.create, { cardId, title: "Line\nbreak" });

    expect(await t.query(api.board.exportCsv, {})).toBe(
      [
        "bucket,card title,checklist item",
        '"Phase ""one""","A, B","Line\nbreak"',
      ].join("\n"),
    );
  });

  test("only exports the signed-in user's board", async () => {
    const { alice, bob } = (() => {
      const t = convexTest(schema, modules);
      rateLimiterTest.register(t);
      return {
        alice: t.withIdentity({ subject: "alice" }),
        bob: t.withIdentity({ subject: "bob" }),
      };
    })();
    await alice.mutation(api.buckets.create, { name: "Alice bucket" });
    await bob.mutation(api.buckets.create, { name: "Bob bucket" });

    expect(await alice.query(api.board.exportCsv, {})).toBe(
      "bucket,card title,checklist item\nAlice bucket,,",
    );
  });

  test("round trips through importCsv to the same board", async () => {
    const t = setup();
    const bucketId = await t.mutation(api.buckets.create, { name: "Phase 1" });
    const cardId = await t.mutation(api.cards.create, { bucketId, title: "Task, with comma" });
    await t.mutation(api.checklistItems.create, { cardId, title: "Step one" });
    await t.mutation(api.checklistItems.create, { cardId, title: "Step two" });
    await t.mutation(api.buckets.create, { name: "Empty phase" });
    const before = await t.query(api.board.get, {});

    const csv = await t.query(api.board.exportCsv, {});
    await t.mutation(api.board.importCsv, { csv });

    const after = await t.query(api.board.get, {});
    expect(after.buckets.map((bucket) => bucket.name)).toEqual(
      before.buckets.map((bucket) => bucket.name),
    );
    expect(after.cards.map((card) => card.title)).toEqual(
      before.cards.map((card) => card.title),
    );
    expect(after.checklistItems.map((item) => item.title)).toEqual(
      before.checklistItems.map((item) => item.title),
    );
  });
});
