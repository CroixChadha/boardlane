# AGENTS.md

Instructions for every coding agent working in this repo (Claude Code, Codex, others). `CLAUDE.md` imports this file, so edit instructions here only.

## Project

**Boardlane** is a personal kanban board web app tailored to software development work. It is a learning project and a portfolio candidate: it starts at the bare minimum and grows through GitHub issues and pull requests.

**The main idea:** the owner wants a free, easy-to-use board that can import a CSV written by an AI agent. Instead of typing every card and checklist by hand, the user prompts an agent, the agent writes a CSV, and importing it builds the board. Features that serve this idea come before small extras.

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js |
| Backend and database | Convex |
| Authentication | Clerk |
| UI components | shadcn/ui |
| Styling | Tailwind CSS |
| Hosting | Vercel |

Do not add other frameworks, databases or UI libraries without the owner asking.

## Who is responsible for what

| Area | Responsible |
|---|---|
| Frontend markup and styling: page and component structure, Tailwind classes, shadcn/ui components | **Codex, solely** |
| Backend: Convex schema and functions, data logic, connecting the page to Convex, Clerk authentication | **Claude Code** |
| Repo files: `AGENTS.md`, `CLAUDE.md`, `README.md`, config | Whichever agent the owner asks |

- Codex does not write or change backend code. Claude Code does not write or restyle markup and CSS.
- Where a component needs data, Codex builds it to take that data and its actions as props. Connecting components to Convex is backend work and lives in `app/page.tsx` and `app/convex-client-provider.tsx`.
- If a task crosses the line, do your side and tell the owner what the other side needs.

## How the owner works with agents

The owner sets direction and makes product decisions; agents write the code. Claude Code is the lead engineer: it owns the backend and the connection between page and backend, reviews and merges pull requests, and reports blockers to the owner. Codex is the frontend engineer.

- Bring the owner decisions about what the product does, not questions about how to implement it.
- Do not add features the owner has not agreed to. Propose them first.
- Prefer simple, readable code over clever code.
- The owner is a beginner/intermediate Python programmer who knows HTML and CSS and is new to TypeScript. Explain things in plain language when reporting to them.

## Board design (from the owner)

Modelled on Microsoft Planner.

- A **bucket** is a column. It has a name. A board can have at most 25 buckets.
- A **card** is a task. It sits inside a bucket and is the thing the user picks up and moves.
- A card has a **title** and a **checklist** of items to complete. More fields are planned later.
- Actions in the first version: add, edit and delete for buckets, cards and checklist items (each checklist item can be deleted on its own); move a card to another bucket; tick and untick a checklist item; load the whole board.
- Planned later, not in the first version: priority, time taken and status on cards.
- When sign-in is added, data is tagged with the signed-in user's ID and each user sees only their own. The owner wants this to be very secure.
- **Moving works two ways:** click and drag a card to a bucket, or click a card and then click the bucket it should go to.
- **Storage:** cards are stored in Convex from the start.
- The owner does not plan to sell this as software as a service.

- **Sign-in (Clerk) is not in the first version.** It comes later as an onboarding step for first-time users. Do not add Clerk code, including commented-out code, until an issue asks for it.
- **CSV import is a planned feature**, not part of the first version's four actions.

- **Data model:** three tables in `convex/schema.ts`. `buckets` (`name`); `cards` (`title`, `bucketId`); `checklistItems` (`title`, `cardId`, `isDone`). Buckets, cards and items show in the order they were created; there is no position column yet. The owner wrote the `checklistItems` table.
- **Import CSV shape:** one row per checklist item, with three columns: bucket, card title, checklist item. Two rows are the same card when the bucket and the card title both match. A card with no checklist items has a row with an empty item cell.
- Starting buckets while building: Phase 1 through Phase 5.
- **Limits:** a board can have at most 25 buckets. A bucket can have at most 50 cards. A card can have at most 10 checklist items. The numbers live in `convex/validation.ts`. A CSV import is at most 500 rows and 100 KB, and each title is at most 200 characters. An import either fully succeeds or changes nothing.
- **Deleting:** deleting a bucket also deletes its cards and their checklist items; deleting a card also deletes its checklist items. The page asks "Are you sure?" first.
- **Environments:** the Convex project has a development deployment and a separate production deployment with separate data. All building and testing happens on development. Production changes only through a deliberate deploy, and agents never run one without the owner asking.

Open, not yet decided by the owner. Do not fill these in:

- Where CSV import sits in the order of issues.

## Frontend brief (for Codex)

The frontend agent may read anything under `convex/` but must not change it.

**Build components against these data shapes.** They match `convex/schema.ts`. IDs are strings.

| Thing | Fields |
|---|---|
| Bucket | `_id`, `name` |
| Card | `_id`, `title`, `bucketId` |
| Checklist item | `_id`, `title`, `cardId`, `isDone` |

Every row also has `_creationTime` (a number). Buckets, cards and items are shown in creation order, oldest first.

**Data comes in through props.** `app/board.tsx` takes its data and its actions (for example `onAddCard`, `onMoveCard`) as props and never calls Convex itself. `app/page.tsx` loads the board from Convex and supplies the actions. Do not call Convex from components and do not store board data in the browser.

**How actions behave.** Every action returns a promise. If the backend rejects a call, the page puts the backend's message in the `error` prop and the promise still resolves, except `onMoveCard`, which rejects so the board does not announce a move that failed. Moving a card and ticking an item update the board immediately and roll back if the backend rejects them.

**Backend functions.** All of these work on the development deployment.

| Function | Arguments | Notes |
|---|---|---|
| `board.get` | none | Returns `{ buckets, cards, checklistItems }`, each oldest first |
| `buckets.list` | none | |
| `buckets.create` | `name` | |
| `buckets.rename` | `bucketId`, `name` | |
| `buckets.remove` | `bucketId` | Also deletes the bucket's cards and their items |
| `cards.create` | `bucketId`, `title` | |
| `cards.rename` | `cardId`, `title` | |
| `cards.move` | `cardId`, `bucketId` | |
| `cards.remove` | `cardId` | Also deletes the card's items |
| `checklistItems.create` | `cardId`, `title` | New items start unticked |
| `checklistItems.rename` | `itemId`, `title` | |
| `checklistItems.setDone` | `itemId`, `isDone` | |
| `checklistItems.remove` | `itemId` | |

**What the interface must cover in the first version**

- Add, rename and delete a bucket; add, rename and delete a card; add, rename, tick and delete a single checklist item.
- Move a card two ways: drag it to a bucket, and click the card then click the target bucket. The second way must work without a mouse drag (touch and keyboard).
- An "Are you sure?" confirmation before deleting a bucket or a card, saying that everything inside is deleted too.
- The limits, enforced by the backend and reflected in the interface: 25 buckets per board, 50 cards per bucket, 10 checklist items per card, 200 characters per name or title, no empty names. The add control is disabled or hidden at a limit.
- A place to show an error message from the backend. The backend rejects bad input with a short message written for the user, such as "A board can have at most 25 buckets."
- Empty states: a board with no buckets, a bucket with no cards, a card with no checklist items.
- Loading state: the page will receive no data for a moment before the board arrives.

**Also in the first version.** Codex added these in PR #4 and the owner chose to keep them:

- A light/dark theme toggle.
- A progress panel and board overview, worked out from checklist progress (`isDone`). It needs no new backend data.
- A navigation bar with Home.
- A search box that filters cards.

New features beyond this list still need the owner's agreement before they are built.

**Not in the first version. Do not build these yet:** sign-in or any account interface, CSV import, priority, time taken, status, reordering within a bucket.

**Libraries.** shadcn/ui components are added with `npx shadcn@latest add <name>`; only `button` is installed so far. Dragging needs a library; propose one to the owner before installing it.

## Workflow

Every change after the initial scaffold follows the same path:

1. A GitHub issue describes one piece of behaviour.
2. Work happens on a branch named `<issue-number>-short-description`, never directly on `main`.
3. Run the app and check the behaviour in a browser before opening a pull request. Earlier behaviour must still work.
4. The pull request describes what changed and how it was checked, and closes its issue (`Closes #<number>`).

Keep each pull request to one issue. Commit subjects are short and imperative ("Add bucket form"). Commits are authored by the owner only: do not add `Co-Authored-By`, "Generated with" or any other agent attribution line to commit messages or pull request descriptions.

Do not create issues, push, or merge without the owner asking.

## Setup and run

```bash
npm install
npm run dev
```

The app is served at http://localhost:3000. `npm run build`, `npm run lint` and `npm test` must pass before a pull request is opened.

`npm test` runs the backend tests in `convex/*.test.ts` against an in-memory Convex. Any change to a backend function comes with a test.

Backend work needs `npx convex dev` running in a second terminal; it syncs the `convex/` folder to the dev deployment and reports errors. Clerk is not installed.

## Layout

```
app/                Next.js pages and layout (App Router)
components/ui/      shadcn/ui components
lib/utils.ts        shadcn/ui helper
convex/             Convex schema, functions (one file per table, plus board.ts) and tests
```

## Status

Next.js 16 with TypeScript, Tailwind CSS 4, shadcn/ui and Convex. The first version works end to end on the development deployment: the board page loads from Convex and every action (add, rename, delete, move, tick) saves to it. Not built yet: CSV import, sign-in, a production deployment and hosting on Vercel. Update this section as that changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
