import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// This file describes every table in the database: its name and its columns.
// Convex adds two columns to every table automatically, so they are not
// written here:
//   _id            the row's ID
//   _creationTime  when the row was created
//
// Every row records its owner (ownerId, the signed-in user's ID), and every
// function only reads or changes rows that belong to the caller.
export default defineSchema({
  // One row per bucket (a column on the board).
  buckets: defineTable({
    name: v.string(),
    ownerId: v.string(),
  }).index("by_ownerId", ["ownerId"]),

  // One row per card.
  //   bucketId  which bucket the card is in. Moving a card to another bucket
  //             means changing this one value.
  cards: defineTable({
    title: v.string(),
    bucketId: v.id("buckets"),
    ownerId: v.string(),
  })
    .index("by_bucketId", ["bucketId"])
    .index("by_ownerId", ["ownerId"]),

  // One row per checklist item.
  //   cardId  which card the item belongs to
  //   isDone  whether the item is ticked
  checklistItems: defineTable({
    title: v.string(),
    cardId: v.id("cards"),
    isDone: v.boolean(),
    ownerId: v.string(),
  })
    .index("by_cardId", ["cardId"])
    .index("by_ownerId", ["ownerId"]),
});
