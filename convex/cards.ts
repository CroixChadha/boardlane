import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { cleanTitle } from "./validation";

// Card functions. buckets.ts is the worked example for everything here.

// TODO(learner): write "create". It adds a card to a bucket and returns the
// new card's ID. Model it on "create" in buckets.ts. The differences:
//   - the page must send two things: the card's title, and the ID of the
//     bucket the card goes in
//   - the row goes in the "cards" table, and has the two columns you can see
//     for that table in schema.ts
// Run the title through cleanTitle(...) the same way buckets.ts does.

// Still to come, one at a time after "create" works:
//   rename  change a card's title
//   move    put a card in a different bucket
//   remove  delete a card and its checklist items
