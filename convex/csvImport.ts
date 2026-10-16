import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  MAX_BUCKETS,
  MAX_CARDS_PER_BUCKET,
  MAX_CHECKLIST_ITEMS_PER_CARD,
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  MAX_TITLE_LENGTH,
} from "./validation";

// The board a CSV describes, in the order the CSV lists it.
export type ParsedBoard = {
  buckets: {
    name: string;
    cards: { title: string; items: string[] }[];
  }[];
};

// Header names accepted for each column, compared in lower case. Files come
// from AI agents, which do not always use the exact documented names.
const BUCKET_HEADERS = ["bucket", "bucket name", "phase", "column", "list"];
const CARD_HEADERS = ["card title", "card", "title", "task", "task name"];
const ITEM_HEADERS = [
  "checklist item",
  "checklist items",
  "checklist",
  "item",
  "subtask",
];

// Splits CSV text into records of fields (RFC 4180): fields are separated by
// commas, a field may be wrapped in double quotes to contain commas or line
// breaks, and a double quote inside a quoted field is written twice.
export function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; // skip a byte-order mark

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 2;
      } else if (char === '"') {
        inQuotes = false;
        i++;
      } else {
        field += char;
        i++;
      }
    } else if (char === '"' && field === "") {
      inQuotes = true;
      i++;
    } else if (char === ",") {
      record.push(field);
      field = "";
      i++;
    } else if (char === "\n" || char === "\r") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
      i += char === "\r" && text[i + 1] === "\n" ? 2 : 1;
    } else {
      field += char;
      i++;
    }
  }

  if (inQuotes) {
    throw new ConvexError(
      `Row ${records.length + 1}: a value starts with a double quote that is never closed.`,
    );
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

function columnIndex(header: string[], names: string[]): number {
  return header.findIndex((cell) => names.includes(cell));
}

function checkLength(value: string, what: string, row: number) {
  if (value.length > MAX_TITLE_LENGTH) {
    throw new ConvexError(
      `Row ${row}: the ${what} can be at most ${MAX_TITLE_LENGTH} characters long.`,
    );
  }
}

// Turns CSV text into the board it describes, or throws a ConvexError whose
// message tells the user which row to fix. Row numbers count the header as
// row 1, the way a spreadsheet shows them.
//
// One row is one checklist item on a card in a bucket. Rows with the same
// bucket and card title (ignoring case) are the same card. A row with no
// checklist item makes a card with no checklist, and a row with only a bucket
// makes an empty bucket.
export function parseBoardCsv(text: string): ParsedBoard {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) {
    throw new ConvexError(
      `A CSV import can be at most ${MAX_IMPORT_BYTES / 1024} KB.`,
    );
  }

  const records = parseCsvRecords(text).map((record) =>
    record.map((cell) => cell.trim()),
  );
  if (records.length === 0) {
    throw new ConvexError("The CSV file is empty.");
  }

  const header = records[0].map((cell) => cell.toLowerCase());
  const bucketColumn = columnIndex(header, BUCKET_HEADERS);
  const cardColumn = columnIndex(header, CARD_HEADERS);
  const itemColumn = columnIndex(header, ITEM_HEADERS);
  if (bucketColumn === -1 || cardColumn === -1) {
    throw new ConvexError(
      'The first row must name the columns: "bucket", "card title" and "checklist item".',
    );
  }

  // Keep each row's spreadsheet number before dropping blank lines.
  const rows = records
    .slice(1)
    .map((cells, index) => ({ cells, row: index + 2 }))
    .filter(({ cells }) => cells.some((cell) => cell !== ""));
  if (rows.length === 0) {
    throw new ConvexError("The CSV has a header row but nothing to import.");
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ConvexError(
      `A CSV import can have at most ${MAX_IMPORT_ROWS} rows. This file has ${rows.length}.`,
    );
  }

  const board: ParsedBoard = { buckets: [] };
  const bucketsByKey = new Map<string, ParsedBoard["buckets"][number]>();
  const cardsByKey = new Map<string, { title: string; items: string[] }>();

  for (const { cells, row } of rows) {
    const bucketName = cells[bucketColumn] ?? "";
    const cardTitle = cells[cardColumn] ?? "";
    const itemTitle = itemColumn === -1 ? "" : (cells[itemColumn] ?? "");

    if (bucketName === "") {
      throw new ConvexError(`Row ${row}: the bucket is missing.`);
    }
    if (cardTitle === "" && itemTitle !== "") {
      throw new ConvexError(
        `Row ${row}: the checklist item has no card title.`,
      );
    }
    checkLength(bucketName, "bucket name", row);
    checkLength(cardTitle, "card title", row);
    checkLength(itemTitle, "checklist item", row);

    const bucketKey = bucketName.toLowerCase();
    let bucket = bucketsByKey.get(bucketKey);
    if (bucket === undefined) {
      if (board.buckets.length >= MAX_BUCKETS) {
        throw new ConvexError(
          `Row ${row}: a board can have at most ${MAX_BUCKETS} buckets.`,
        );
      }
      bucket = { name: bucketName, cards: [] };
      bucketsByKey.set(bucketKey, bucket);
      board.buckets.push(bucket);
    }
    if (cardTitle === "") continue;

    // JSON keeps a bucket/card pair unambiguous whatever the names contain.
    const cardKey = JSON.stringify([bucketKey, cardTitle.toLowerCase()]);
    let card = cardsByKey.get(cardKey);
    if (card === undefined) {
      if (bucket.cards.length >= MAX_CARDS_PER_BUCKET) {
        throw new ConvexError(
          `Row ${row}: a bucket can have at most ${MAX_CARDS_PER_BUCKET} cards.`,
        );
      }
      card = { title: cardTitle, items: [] };
      cardsByKey.set(cardKey, card);
      bucket.cards.push(card);
    }
    if (itemTitle === "") continue;

    if (card.items.length >= MAX_CHECKLIST_ITEMS_PER_CARD) {
      throw new ConvexError(
        `Row ${row}: a card can have at most ${MAX_CHECKLIST_ITEMS_PER_CARD} checklist items.`,
      );
    }
    card.items.push(itemTitle);
  }

  return board;
}

// RFC 4180: a value is wrapped in double quotes when it contains a comma, a
// double quote, or a line break; a double quote inside it is written twice.
function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Writes a board as the CSV parseBoardCsv reads: one row per checklist item,
// a card with none gets a row with an empty item cell, and a bucket with no
// cards gets a row with only its name. Buckets, cards and items are written
// in the order given, which board.get returns oldest first, so importing the
// result recreates the same board (ticked state aside: the format has no
// column for it).
export function stringifyBoardCsv(
  buckets: Doc<"buckets">[],
  cards: Doc<"cards">[],
  checklistItems: Doc<"checklistItems">[],
): string {
  const lines = ["bucket,card title,checklist item"];
  for (const bucket of buckets) {
    const bucketCards = cards.filter((card) => card.bucketId === bucket._id);
    if (bucketCards.length === 0) {
      lines.push(`${csvField(bucket.name)},,`);
      continue;
    }
    for (const card of bucketCards) {
      const cardItems = checklistItems.filter((item) => item.cardId === card._id);
      if (cardItems.length === 0) {
        lines.push(`${csvField(bucket.name)},${csvField(card.title)},`);
        continue;
      }
      for (const item of cardItems) {
        lines.push(
          `${csvField(bucket.name)},${csvField(card.title)},${csvField(item.title)}`,
        );
      }
    }
  }
  return lines.join("\n");
}
