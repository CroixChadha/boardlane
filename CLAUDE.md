@AGENTS.md

# Where things stand (updated 2026-10-10)

`AGENTS.md`, imported above, holds the standing rules and the design. This section is the handoff: what state the project is in and what comes next.

## What Boardlane is to the owner

A practice project for prompting and system design, built almost entirely by agents. The owner is not promoting it and does not expect real users. They bought `boardlane.dev` for a year and will probably not renew it, falling back to the `vercel.app` address. Keep solutions proportionate to that: correct and tidy, not built for scale.

## What is live

https://boardlane.dev, on Vercel with a Convex production deployment and a production Clerk instance. Every merge to `main` deploys.

- Sign-in (email and GitHub in production; Google is off there and on in development), one private board per account
- Board: buckets, cards, checklists; add, rename, delete, tick; move by mouse drag, keyboard drag, or click-to-move
- CSV import that replaces the board after a confirmation, with an in-app guide, a copyable prompt and a demo board
- Home and Progress pages; collapsible navigation and board overview
- Per-user rate limits; 36 backend tests

## What was done on 2026-10-09 and 2026-10-10

| PR | Change |
|---|---|
| #6 | Card and checklist functions, board query, page connected to Convex, first backend tests |
| #12 | Mouse drag fixed: whole card draggable, auto-scroll zone narrowed |
| #13 | CSV import |
| #14 | Codex's Steep-style redesign (reviewed and merged) |
| #15 | Clerk sign-in, per-user ownership on every table and function |
| #17 | Rate limiting |
| #18 | Tab icon |
| #19 | Production Clerk instance documented; site rebuilt on production keys |
| #21 | In-app CSV guide and demo board |
| #23 | Home and Progress pages, collapsible side panels |

The owner set up the Clerk, Vercel and domain accounts, added the DNS records and the production keys.

## What comes next

Decided by the owner, not built:

- **#24 Export the board as CSV**, as a button on the board next to Import.
- **#25 Settings page**: clear my board, and delete my account together with its data. Whether deleted data is removed at once or kept for 30 days is not decided; immediate is the default.
- **#8 Frontend follow-ups**: three small items left.

Asked about, not committed to:

- **#26 Multiple boards per account.** Feasible; the issue lists what it takes. The owner said it may be out of scope.

## Loose ends

- The three earliest commits carry a `Co-Authored-By: Claude` line the owner does not want. Removing it needs a history rewrite and a force push to `main`, which the owner has to approve explicitly.
- Merged branches are still on GitHub and can be deleted.
- Vercel preview builds for pull requests fail by design (production-only Convex deploy key).

## How the browser checks were done

There is no committed end-to-end suite. Checks were run with `puppeteer-core` driving the installed Google Chrome in headless mode, from a scratch folder outside the repo:

- Real mouse input comes from `page.mouse` (down, move in steps, up). Synthetic pointer events and the Claude-in-Chrome tab do not work for drag: that tab is hidden, so animation frames never fire.
- To sign in, create a one-time token with `npx clerk api /sign_in_tokens -X POST --yes -d '{"user_id":"..."}'` and open `/sign-in?__clerk_ticket=<token>`. The development instance has two test users, `e2e_alice` and `e2e_bob`. For production, create temporary users with `--instance prod` and delete them and their rows afterwards.
- Run `npx clerk api` with `</dev/null`; a `DELETE` otherwise waits on standard input.
- To act as a user from the command line: `npx convex run --identity '{"subject":"<user id>","issuer":"<clerk issuer>","tokenIdentifier":"<issuer>|<user id>"}' <function> '<args>'`, adding `--prod` for production.
- Count only visible elements, because Next.js keeps visited pages mounted but hidden.
- A long-running `next dev` can serve a stale stylesheet. If styles look half applied, restart it and delete `.next`.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
