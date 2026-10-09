import {
  Bell,
  Check,
  CheckSquare2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Columns3,
  FileUp,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

type ChecklistItem = {
  title: string;
  isDone: boolean;
};

type Card = {
  title: string;
  label?: string;
  labelTone?: "green" | "blue" | "amber";
  due?: string;
  checklist: ChecklistItem[];
};

type Bucket = {
  name: string;
  color: string;
  cards: Card[];
};

const buckets: Bucket[] = [
  {
    name: "Backlog",
    color: "bg-slate-400",
    cards: [
      {
        title: "Create the first-run onboarding flow",
        label: "Product",
        labelTone: "blue",
        due: "Oct 14",
        checklist: [
          { title: "Outline steps", isDone: true },
          { title: "Write empty-state copy", isDone: false },
          { title: "Review mobile layout", isDone: false },
        ],
      },
      {
        title: "Define the CSV import format",
        label: "Planning",
        labelTone: "amber",
        checklist: [
          { title: "Choose required columns", isDone: false },
          { title: "Document checklist rows", isDone: false },
        ],
      },
      {
        title: "Add keyboard shortcuts",
        checklist: [],
      },
    ],
  },
  {
    name: "In progress",
    color: "bg-blue-500",
    cards: [
      {
        title: "Build the Boardlane workspace",
        label: "Frontend",
        labelTone: "green",
        due: "Today",
        checklist: [
          { title: "Create board shell", isDone: true },
          { title: "Design task cards", isDone: true },
          { title: "Check responsive layout", isDone: false },
        ],
      },
      {
        title: "Connect bucket actions",
        label: "Backend",
        labelTone: "blue",
        checklist: [
          { title: "List buckets", isDone: true },
          { title: "Add rename action", isDone: false },
        ],
      },
    ],
  },
  {
    name: "Review",
    color: "bg-amber-400",
    cards: [
      {
        title: "Refine the visual direction",
        label: "Design",
        labelTone: "amber",
        due: "Tomorrow",
        checklist: [
          { title: "Review spacing", isDone: true },
          { title: "Confirm color palette", isDone: false },
        ],
      },
    ],
  },
  {
    name: "Done",
    color: "bg-emerald-500",
    cards: [
      {
        title: "Set up Next.js and Tailwind",
        label: "Setup",
        labelTone: "green",
        checklist: [
          { title: "Install dependencies", isDone: true },
          { title: "Configure shadcn/ui", isDone: true },
          { title: "Connect repository", isDone: true },
        ],
      },
      {
        title: "Create the Convex schema",
        checklist: [
          { title: "Add buckets", isDone: true },
          { title: "Add cards", isDone: true },
          { title: "Add checklist items", isDone: true },
        ],
      },
    ],
  },
];

const labelStyles = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
};

function BrandMark() {
  return (
    <div className="grid size-9 grid-cols-2 gap-1 rounded-[11px] bg-[#17243b] p-2 shadow-sm">
      <span className="rounded-[2px] bg-white/95" />
      <span className="rounded-[2px] bg-white/55" />
      <span className="rounded-[2px] bg-[#74c69d]" />
      <span className="rounded-[2px] bg-white/95" />
    </div>
  );
}

function TaskCard({ card }: { card: Card }) {
  const completed = card.checklist.filter((item) => item.isDone).length;
  const progress = card.checklist.length
    ? Math.round((completed / card.checklist.length) * 100)
    : 0;

  return (
    <article className="group rounded-2xl border border-[#e4e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(25,38,58,0.04),0_7px_20px_rgba(25,38,58,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d8dde4] hover:shadow-[0_2px_5px_rgba(25,38,58,0.06),0_12px_28px_rgba(25,38,58,0.07)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        {card.label ? (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${labelStyles[card.labelTone ?? "blue"]}`}
          >
            {card.label}
          </span>
        ) : (
          <span />
        )}
        <button
          className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 opacity-70 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
          aria-label={`More options for ${card.title}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <h3 className="text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[#1d2939]">
        {card.title}
      </h3>

      {card.checklist.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckSquare2 className="size-3.5" />
              {completed}/{card.checklist.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#48a978] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex min-h-6 items-center justify-between border-t border-slate-100 pt-3">
        {card.due ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Clock3 className="size-3.5" />
            {card.due}
          </span>
        ) : (
          <span className="text-xs text-slate-400">No due date</span>
        )}
        <span className="grid size-6 place-items-center rounded-full bg-[#e8f3ed] text-[9px] font-bold text-[#287451] ring-2 ring-white">
          CC
        </span>
      </div>
    </article>
  );
}

function BucketColumn({ bucket }: { bucket: Bucket }) {
  return (
    <section className="w-[286px] shrink-0" aria-labelledby={`bucket-${bucket.name}`}>
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className={`size-2 rounded-full ${bucket.color}`} />
          <h2
            id={`bucket-${bucket.name}`}
            className="text-sm font-semibold text-[#344054]"
          >
            {bucket.name}
          </h2>
          <span className="rounded-md bg-[#e9ebee] px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">
            {bucket.cards.length}
          </span>
        </div>
        <button
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-slate-700"
          aria-label={`More options for ${bucket.name}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="space-y-3">
        {bucket.cards.map((card) => (
          <TaskCard key={card.title} card={card} />
        ))}
        <button className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#d7dce2] px-3 py-3 text-sm font-medium text-slate-500 transition hover:border-[#aeb8c4] hover:bg-white/70 hover:text-[#24334d]">
          <Plus className="size-4" />
          Add card
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#f4f5f3] text-[#1d2939]">
      <aside className="hidden w-[236px] shrink-0 flex-col border-r border-[#e2e5e3] bg-[#fbfcfa] px-4 py-5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <BrandMark />
          <span className="text-lg font-bold tracking-[-0.035em] text-[#17243b]">
            Boardlane
          </span>
        </div>

        <nav className="mt-9 space-y-1" aria-label="Main navigation">
          <a
            href="#"
            className="flex items-center gap-3 rounded-xl bg-[#e9f3ed] px-3 py-2.5 text-sm font-semibold text-[#216844]"
          >
            <LayoutGrid className="size-[18px]" />
            My board
          </a>
          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <Sparkles className="size-[18px]" />
            Import history
          </a>
        </nav>

        <div className="mt-8 px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>
        </div>
        <button className="mt-3 flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100">
          <span className="flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-lg bg-[#17243b] text-[10px] font-bold text-white">
              BL
            </span>
            Personal
          </span>
          <ChevronDown className="size-4 text-slate-400" />
        </button>

        <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            <CircleHelp className="size-[18px]" />
            Help & feedback
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            <Settings className="size-[18px]" />
            Settings
          </button>
          <div className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-[#dcebe3] text-xs font-bold text-[#286747]">
              CC
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-700">
                Croix Chadha
              </p>
              <p className="truncate text-[11px] text-slate-400">Free workspace</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden">
        <header className="border-b border-[#e2e5e3] bg-[#fbfcfa]/95 px-5 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden">
                <BrandMark />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Personal workspace
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-xl font-bold tracking-[-0.035em] text-[#17243b] md:text-2xl">
                    Product roadmap
                  </h1>
                  <ChevronDown className="size-4 shrink-0 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="hidden size-10 place-items-center rounded-xl border border-[#dfe3e7] bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 sm:grid"
                aria-label="Search"
              >
                <Search className="size-[18px]" />
              </button>
              <button
                className="hidden size-10 place-items-center rounded-xl border border-[#dfe3e7] bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-800 sm:grid"
                aria-label="Notifications"
              >
                <Bell className="size-[18px]" />
              </button>
              <button className="flex h-10 items-center gap-2 rounded-xl border border-[#cad1d8] bg-white px-3.5 text-sm font-semibold text-[#344054] shadow-sm transition hover:border-slate-400">
                <FileUp className="size-4" />
                <span className="hidden sm:inline">Import CSV</span>
              </button>
              <button className="flex h-10 items-center gap-2 rounded-xl bg-[#17243b] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#243653]">
                <Plus className="size-4" />
                <span className="hidden sm:inline">New card</span>
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 rounded-xl bg-[#edf0ed] p-1">
              <button className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] shadow-sm">
                <Columns3 className="size-3.5" />
                Board
              </button>
              <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:text-slate-800">
                Activity
              </button>
            </div>
            <p className="hidden items-center gap-1.5 text-xs text-slate-400 md:flex">
              <Check className="size-3.5 text-emerald-600" />
              All changes saved
            </p>
          </div>
        </header>

        <div className="board-scroll h-[calc(100vh-145px)] overflow-x-auto overflow-y-auto px-5 py-6 md:px-8 md:py-7">
          <div className="flex min-w-max items-start gap-5 pb-8">
            {buckets.map((bucket) => (
              <BucketColumn key={bucket.name} bucket={bucket} />
            ))}

            <button className="flex w-[286px] shrink-0 items-center gap-2 rounded-xl border border-dashed border-[#cfd5da] px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-[#a9b3bc] hover:bg-white/50 hover:text-[#24334d]">
              <Plus className="size-4" />
              Add bucket
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
