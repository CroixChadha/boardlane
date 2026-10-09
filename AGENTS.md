# AGENTS.md

Instructions for every coding agent working in this repo (Claude Code, Codex, others). `CLAUDE.md` imports this file, so edit instructions here only.

## Project

A personal kanban board web app tailored to software development work. It is a learning project and a portfolio candidate: it starts at the bare minimum and grows through GitHub issues and pull requests.

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
| Backend: Convex schema and functions, data logic, Clerk authentication | **The owner and Claude Code** |
| Repo files: `AGENTS.md`, `CLAUDE.md`, `README.md`, config | Whichever agent the owner asks |

- Codex does not write or change backend code. Claude Code does not write or restyle markup and CSS.
- Where a component needs data, Codex builds it to take that data and its actions as props. Connecting components to Convex is backend work.
- If a task crosses the line, do your side and tell the owner what the other side needs.

## The owner is learning: read this first

The repo owner is a beginner/intermediate Python programmer who knows HTML and CSS. They own the design and write parts of the backend themselves.

- **Do not implement anything marked `TODO(learner)`.** Do not rewrite or "tidy" code the owner wrote.
- On owner-written code you may explain concepts, review, point out bugs and give hints. Write that code only when the owner explicitly asks you to.
- **Do not make design decisions for the owner** (data model, functions, storage, features). Ask how they want it to work, then build what they chose. Offer options only when asked.
- Prefer simple, readable code over clever code. Explain anything you add that the owner has not seen before.

## Board design (from the owner)

Modelled on Microsoft Planner.

- A **bucket** is a column. It has a name, and the user can create as many buckets as they want.
- A **card** is a task. It sits inside a bucket and is the thing the user picks up and moves.
- A card has a **title** and a **checklist** of items to complete. More fields are planned later.
- Actions in the first version: add, move, edit and delete.
- **Moving works two ways:** click and drag a card to a bucket, or click a card and then click the bucket it should go to.
- **Storage:** cards are stored in Convex from the start.
- The owner does not plan to sell this as software as a service.

Open, not yet decided by the owner. Do not fill these in:

- How buckets, cards and checklist items are represented in the Convex schema.
- Whether Clerk sign-in is part of the first version.

## Workflow

Every change after the initial scaffold follows the same path:

1. A GitHub issue describes one piece of behaviour.
2. Work happens on a branch named `<issue-number>-short-description`, never directly on `main`.
3. Run the app and check the behaviour in a browser before opening a pull request. Earlier behaviour must still work.
4. The pull request describes what changed and how it was checked, and closes its issue (`Closes #<number>`).

Keep each pull request to one issue. Commit subjects are short and imperative ("Add bucket form"), and commits made by an agent say so in a `Co-Authored-By` trailer.

Do not create issues, push, or merge without the owner asking.

## Setup and run

```bash
npm install
npm run dev
```

The app is served at http://localhost:3000. `npm run build` and `npm run lint` must pass before a pull request is opened.

Convex is installed as a package but not yet connected to an account; `npx convex dev` does that and must be run by the owner because it signs in through the browser. Clerk is not installed.

## Layout

```
app/                Next.js pages and layout (App Router)
components/ui/      shadcn/ui components
lib/utils.ts        shadcn/ui helper
convex/             Convex schema and functions (created by `npx convex dev`)
```

## Status

Generated scaffold only: Next.js 16 with TypeScript, Tailwind CSS 4, shadcn/ui and the Convex package. The page is still the default Next.js starter page. No backend code, nothing committed or pushed. Update this section as that changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
