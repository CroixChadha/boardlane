# Boardlane

A personal kanban board for software development work, with a focus on turning
AI-generated CSV files into boards, cards and checklists.

**Working project name:** Boardlane

The public domain is not decided. `boardlane.io` was considered, but it is
already registered.

Stack: Next.js, Convex, Clerk, shadcn/ui, Tailwind CSS, hosted on Vercel.

This project starts at the bare minimum and grows one issue and pull request at a time.

## Run it

```bash
npm install
npx convex dev   # in a second terminal; connects to the backend
npm run dev
```

Then open http://localhost:3000.

## Status

The first version works on a development backend: buckets (columns) of task cards, where a card has a title and a checklist, with add, rename, delete, move and tick, all saved to Convex. Next: CSV import, then sign-in and a public deployment.
