import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// This file describes every table in the database: its name and its columns.
// Convex adds two columns to every table automatically, so they are not
// written here:
//   _id            the row's ID
//   _creationTime  when the row was created
//
// Syntax key, compared with Python:
//   // comment                  is  # comment
//   { key: value, key: value }  is a dict, but keys are written without quotes
//   "text"                      is a string; this project uses double quotes
//   a comma after every entry, including the last one, is fine
//   every ( { opened must be closed in the reverse order: })
//
// Column types used here:
//   v.string()         text
//   v.boolean()        true or false
//   v.id("buckets")    the ID of a row in the "buckets" table (a reference)
export default defineSchema({
  // One row per bucket (a column on the board).
  //   buckets: defineTable({ ... })   creates a table named "buckets"
  //   name: v.string()                a column named "name" that holds text
  buckets: defineTable({
    name: v.string(),
  }),

  // One row per card.
  //   title     the card's title
  //   bucketId  which bucket the card is in. Moving a card to another bucket
  //             means changing this one value.
  cards: defineTable({
    title: v.string(),
    bucketId: v.id("buckets"),
  })
    // An index lets the database jump straight to "all cards in this bucket"
    // without reading every card. The name says which column it is built on.
    .index("by_bucketId", ["bucketId"]),

  // One row per checklist item.
  //   title   the item's text
  //   cardId  which card the item belongs to
  //   isDone  whether the item is ticked
  checklistItems: defineTable({
    title: v.string(),
    cardId: v.id("cards"),
    isDone: v.boolean()
  })
    // Same idea: find "all items on this card" directly.
    .index("by_cardId", ["cardId"]),
});
