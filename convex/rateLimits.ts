import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// Per-user caps on how fast the board can be changed. A token bucket allows
// a burst up to `capacity`, then refills at `rate` per `period`.
//   write      any change to a bucket, card or checklist item. Generous: a
//              person dragging and ticking quickly stays far below it.
//   importCsv  replacing the whole board, which is the most expensive call.
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  write: { kind: "token bucket", rate: 120, period: MINUTE, capacity: 120 },
  importCsv: { kind: "token bucket", rate: 6, period: MINUTE, capacity: 3 },
});
