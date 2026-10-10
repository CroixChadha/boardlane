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
cp .env.example .env.local   # then fill in the Clerk keys
npx convex dev               # in a second terminal; connects to the backend
npm run dev
```

You also need a Clerk application with a JWT template named `convex`, and its Frontend API URL set on the Convex deployment:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<your-app>.clerk.accounts.dev
```

Then open http://localhost:3000.

## Importing a board from CSV

**Import CSV** replaces the whole board with the contents of a file, after asking you to confirm. The intended use: ask an AI agent to plan your work as a CSV in this format, then import it.

One row is one checklist item on a card in a bucket:

```csv
bucket,card title,checklist item
Backlog,Write the About page,Draft a short bio
Backlog,Write the About page,Pick a profile photo
Backlog,Add a contact form,"Add name, email and message fields"
In progress,Set up the domain,Buy the domain
Done,Choose a colour scheme,
Review,,
```

- Rows with the same bucket and card title are the same card, so a card with three checklist items takes three rows.
- Leave the checklist item empty for a card with no checklist. Leave the card title empty too for an empty bucket.
- Buckets, cards and items appear on the board in the order the file lists them.
- Wrap a value in double quotes if it contains a comma.
- Limits: 500 rows and 100 KB per file, 25 buckets, 50 cards per bucket, 10 checklist items per card, 200 characters per name.

If anything is wrong, nothing is imported and the message says which row to fix. A ready-made example is in `examples/board.csv`.

Inside the app, the **?** button next to Import CSV opens a guide with a prompt you can copy into an AI assistant and a **Load the demo board** button to see the result straight away.

## Status

The first version works on a development backend: buckets (columns) of task cards, where a card has a title and a checklist, with add, rename, delete, move and tick, all saved to Convex, plus CSV import. Sign-in is required, and each account has its own private board. It is live at https://boardlane.dev.
