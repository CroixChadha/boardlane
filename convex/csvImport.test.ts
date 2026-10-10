/// <reference types="vite/client" />
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { ConvexError } from "convex/values";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import { parseBoardCsv, parseCsvRecords } from "./csvImport";
import schema from "./schema";
import {
  MAX_BUCKETS,
  MAX_CARDS_PER_BUCKET,
  MAX_CHECKLIST_ITEMS_PER_CARD,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  MAX_TITLE_LENGTH,
} from "./validation";

const modules = import.meta.glob("./**/*.ts");
const HEADER = "bucket,card title,checklist item";

function signedIn() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  return t.withIdentity({ subject: "user-a" });
}

// Returns the message of the ConvexError thrown by the callback.
function errorOf(callback: () => unknown): string {
  try {
    callback();
  } catch (error) {
    if (error instanceof ConvexError) return String(error.data);
    throw error;
  }
  throw new Error("Expected an error, but none was thrown.");
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

describe("parseCsvRecords", () => {
  test("splits plain rows, with LF, CRLF or CR line endings", () => {
    const expected = [
      ["a", "b"],
      ["c", "d"],
    ];
    expect(parseCsvRecords("a,b\nc,d")).toEqual(expected);
    expect(parseCsvRecords("a,b\r\nc,d\r\n")).toEqual(expected);
    expect(parseCsvRecords("a,b\rc,d")).toEqual(expected);
  });

  test("handles quoted commas, quotes and line breaks", () => {
    expect(parseCsvRecords('"a, b","say ""hi""","two\nlines"\nx,y,z')).toEqual([
      ["a, b", 'say "hi"', "two\nlines"],
      ["x", "y", "z"],
    ]);
  });

  test("keeps empty fields and skips a byte-order mark", () => {
    expect(parseCsvRecords("﻿a,,c\n,,")).toEqual([
      ["a", "", "c"],
      ["", "", ""],
    ]);
  });

  test("returns nothing for empty text", () => {
    expect(parseCsvRecords("")).toEqual([]);
  });

  test("rejects an unclosed quote", () => {
    expect(errorOf(() => parseCsvRecords('a,b\n"open,c'))).toBe(
      "Row 2: a value starts with a double quote that is never closed.",
    );
  });
});

describe("parseBoardCsv", () => {
  test("groups rows into buckets, cards and items in file order", () => {
    const board = parseBoardCsv(
      [
        HEADER,
        "Phase 1,Set up login,Create sign-in form",
        "Phase 1,Set up login,Test wrong password",
        "Phase 2,Write docs,",
        "Phase 1,Design home page,Sketch layout",
        "Phase 3,,",
      ].join("\n"),
    );
    expect(board).toEqual({
      buckets: [
        {
          name: "Phase 1",
          cards: [
            {
              title: "Set up login",
              items: ["Create sign-in form", "Test wrong password"],
            },
            { title: "Design home page", items: ["Sketch layout"] },
          ],
        },
        { name: "Phase 2", cards: [{ title: "Write docs", items: [] }] },
        { name: "Phase 3", cards: [] },
      ],
    });
  });

  test("matches buckets and cards ignoring case and outer spaces", () => {
    const board = parseBoardCsv(
      [HEADER, "Phase 1, Login ,a", "phase 1,LOGIN,b", "Phase 2,Login,c"].join("\n"),
    );
    expect(board.buckets).toEqual([
      { name: "Phase 1", cards: [{ title: "Login", items: ["a", "b"] }] },
      { name: "Phase 2", cards: [{ title: "Login", items: ["c"] }] },
    ]);
  });

  test("accepts other header names, any column order, and extra columns", () => {
    const board = parseBoardCsv("Notes,Task,PHASE,Subtask\nx,Login,Phase 1,Form");
    expect(board.buckets).toEqual([
      { name: "Phase 1", cards: [{ title: "Login", items: ["Form"] }] },
    ]);
  });

  test("works without a checklist column and skips blank lines", () => {
    const board = parseBoardCsv("bucket,card\n\nPhase 1,Login\n,\n\nPhase 1,Docs\n");
    expect(board.buckets).toEqual([
      {
        name: "Phase 1",
        cards: [
          { title: "Login", items: [] },
          { title: "Docs", items: [] },
        ],
      },
    ]);
  });

  test("reports problems with the spreadsheet row number", () => {
    expect(errorOf(() => parseBoardCsv(""))).toBe("The CSV file is empty.");
    expect(errorOf(() => parseBoardCsv("name,thing\na,b"))).toBe(
      'The first row must name the columns: "bucket", "card title" and "checklist item".',
    );
    expect(errorOf(() => parseBoardCsv(`${HEADER}\n\n`))).toBe(
      "The CSV has a header row but nothing to import.",
    );
    expect(errorOf(() => parseBoardCsv(`${HEADER}\nPhase 1,Login,a\n\n,Docs,b`))).toBe(
      "Row 4: the bucket is missing.",
    );
    expect(errorOf(() => parseBoardCsv(`${HEADER}\nPhase 1,,orphan`))).toBe(
      "Row 2: the checklist item has no card title.",
    );
    const long = "x".repeat(MAX_TITLE_LENGTH + 1);
    expect(errorOf(() => parseBoardCsv(`${HEADER}\nPhase 1,${long},a`))).toBe(
      `Row 2: the card title can be at most ${MAX_TITLE_LENGTH} characters long.`,
    );
    parseBoardCsv(`${HEADER}\nPhase 1,${"x".repeat(MAX_TITLE_LENGTH)},a`);
  });

  test("enforces the board limits", () => {
    const buckets = Array.from({ length: MAX_BUCKETS + 1 }, (_, i) => `B${i},Card,`);
    expect(errorOf(() => parseBoardCsv([HEADER, ...buckets].join("\n")))).toBe(
      `Row ${MAX_BUCKETS + 2}: a board can have at most ${MAX_BUCKETS} buckets.`,
    );
    parseBoardCsv([HEADER, ...buckets.slice(0, MAX_BUCKETS)].join("\n"));

    const cards = Array.from({ length: MAX_CARDS_PER_BUCKET + 1 }, (_, i) => `B,Card ${i},`);
    expect(errorOf(() => parseBoardCsv([HEADER, ...cards].join("\n")))).toBe(
      `Row ${MAX_CARDS_PER_BUCKET + 2}: a bucket can have at most ${MAX_CARDS_PER_BUCKET} cards.`,
    );

    const items = Array.from(
      { length: MAX_CHECKLIST_ITEMS_PER_CARD + 1 },
      (_, i) => `B,Card,Item ${i}`,
    );
    expect(errorOf(() => parseBoardCsv([HEADER, ...items].join("\n")))).toBe(
      `Row ${MAX_CHECKLIST_ITEMS_PER_CARD + 2}: a card can have at most ${MAX_CHECKLIST_ITEMS_PER_CARD} checklist items.`,
    );
  });

  test("enforces the import size limits", () => {
    // Spread the rows over many cards so only the row limit is hit.
    const row = (i: number) => `B${i % MAX_BUCKETS},Card ${i % 40},`;
    const tooMany = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => row(i));
    expect(errorOf(() => parseBoardCsv([HEADER, ...tooMany].join("\n")))).toBe(
      `A CSV import can have at most ${MAX_IMPORT_ROWS} rows. This file has ${MAX_IMPORT_ROWS + 1}.`,
    );
    parseBoardCsv([HEADER, ...tooMany.slice(0, MAX_IMPORT_ROWS)].join("\n"));

    expect(errorOf(() => parseBoardCsv(`${HEADER}\n${"x".repeat(MAX_IMPORT_BYTES)}`))).toBe(
      `A CSV import can be at most ${MAX_IMPORT_BYTES / 1024} KB.`,
    );
  });
});

describe("board.importCsv", () => {
  test("replaces the whole board and reports what it created", async () => {
    const t = signedIn();
    const oldBucket = await t.mutation(api.buckets.create, { name: "Old" });
    const oldCard = await t.mutation(api.cards.create, { bucketId: oldBucket, title: "Old card" });
    await t.mutation(api.checklistItems.create, { cardId: oldCard, title: "Old item" });

    const created = await t.mutation(api.board.importCsv, {
      csv: [HEADER, "Phase 1,Login,Form", "Phase 1,Login,Tests", "Phase 2,Docs,"].join("\n"),
    });
    expect(created).toEqual({ buckets: 2, cards: 2, checklistItems: 2 });

    const board = await t.query(api.board.get, {});
    expect(board.buckets.map((bucket) => bucket.name)).toEqual(["Phase 1", "Phase 2"]);
    expect(board.cards.map((card) => card.title)).toEqual(["Login", "Docs"]);
    expect(board.checklistItems).toMatchObject([
      { title: "Form", isDone: false, cardId: board.cards[0]._id },
      { title: "Tests", isDone: false, cardId: board.cards[0]._id },
    ]);
    expect(board.cards[0].bucketId).toBe(board.buckets[0]._id);
    expect(board.cards[1].bucketId).toBe(board.buckets[1]._id);
  });

  test("a CSV that fails validation leaves the board untouched", async () => {
    const t = signedIn();
    const bucketId = await t.mutation(api.buckets.create, { name: "Keep" });
    await t.mutation(api.cards.create, { bucketId, title: "Keep card" });

    expect(
      await rejection(
        t.mutation(api.board.importCsv, { csv: `${HEADER}\nPhase 1,Login,a\n,Docs,b` }),
      ),
    ).toBe("Row 3: the bucket is missing.");

    const board = await t.query(api.board.get, {});
    expect(board.buckets.map((bucket) => bucket.name)).toEqual(["Keep"]);
    expect(board.cards.map((card) => card.title)).toEqual(["Keep card"]);
  });
});
