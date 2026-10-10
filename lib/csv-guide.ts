import {
  MAX_BUCKETS,
  MAX_CARDS_PER_BUCKET,
  MAX_CHECKLIST_ITEMS_PER_CARD,
  MAX_IMPORT_ROWS,
  MAX_TITLE_LENGTH,
} from "../convex/validation";

// The prompt a user gives an AI assistant to get a board as a CSV. The limits
// come from the same constants the backend enforces, so the two cannot drift.
export const CSV_PROMPT = `Plan my project as a kanban board. Reply with only a CSV file and no explanation.

Use exactly these three columns, with this header row:
bucket,card title,checklist item

Rules:
- One row per checklist item. Repeat the bucket and the card title on every row of the same card.
- Buckets are the stages of the work, in order. For example: Backlog, In progress, Review, Done.
- Leave the checklist item empty for a card that has no checklist.
- Wrap any value that contains a comma in double quotes.
- Limits: ${MAX_IMPORT_ROWS} rows, ${MAX_BUCKETS} buckets, ${MAX_CARDS_PER_BUCKET} cards per bucket, ${MAX_CHECKLIST_ITEMS_PER_CARD} checklist items per card, ${MAX_TITLE_LENGTH} characters per value.

My project:
[describe your project here]`;

// A small, realistic board. It is what "Load the demo board" imports, what
// the guide shows as the example, and what examples/board.csv contains.
export const DEMO_CSV = `bucket,card title,checklist item
Backlog,Write the About page,Draft a short bio
Backlog,Write the About page,Pick a profile photo
Backlog,Add a contact form,Choose a form service
Backlog,Add a contact form,"Add name, email and message fields"
Backlog,Add a contact form,Send a test message
In progress,Build the home page,Sketch the layout
In progress,Build the home page,Write the headline
In progress,Build the home page,Add links to three projects
In progress,Set up the domain,Buy the domain
In progress,Set up the domain,Point it at the host
Review,Check it on a phone,Test the menu
Review,Check it on a phone,Test the contact form
Done,Choose a colour scheme,
Done,Create the repository,Add a README
`;

export const DEMO_FILE_NAME = "demo-board.csv";
