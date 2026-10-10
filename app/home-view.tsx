"use client";

import { useUser } from "@clerk/nextjs";
import { ArrowRight, Sparkles, SquareKanban } from "lucide-react";
import Link from "next/link";
import type { Bucket, Card, ChecklistItem } from "./board";
import { boardStats } from "./board-stats";

const panel =
  "rounded-[20px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]";

// The page a user lands on from the Home button: where the board stands, what
// to pick up next, and how to build a board from a CSV.
export function HomeView({
  buckets,
  cards,
  checklistItems,
  onOpenGuide,
}: {
  buckets: Bucket[];
  cards: Card[];
  checklistItems: ChecklistItem[];
  onOpenGuide: () => void;
}) {
  const { user } = useUser();
  const stats = boardStats(buckets, cards, checklistItems);
  const name = user?.firstName ?? user?.username;
  const isEmpty = buckets.length === 0;
  const upNext = stats.unfinished.slice(0, 5);

  return (
    <div className="space-y-6">
      <p className="text-lg text-[var(--text-secondary)]" data-testid="home-greeting">
        {name ? `Welcome back, ${name}.` : "Welcome back."}{" "}
        {isEmpty
          ? "Your board is empty."
          : `Your board is ${stats.completion}% complete.`}
      </p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Buckets", buckets.length],
          ["Cards", cards.length],
          ["Checklist items", stats.total],
          ["Complete", `${stats.completion}%`],
        ].map(([label, value]) => (
          <div key={label} className={panel}>
            <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
            <dd className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={panel} aria-labelledby="home-board">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <SquareKanban className="size-5" />
          </span>
          <h2 id="home-board" className="mt-4 text-lg font-semibold tracking-tight">
            {isEmpty ? "Start your board" : "Pick up where you left off"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {isEmpty
              ? "Add buckets for the stages of your project, then cards for the work in each one."
              : `${stats.unfinished.length} ${stats.unfinished.length === 1 ? "card has" : "cards have"} unfinished checklist items.`}
          </p>
          <Link
            href="/"
            className="primary-button mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-text)]"
          >
            Open the board
            <ArrowRight className="size-4" />
          </Link>
        </section>

        <section className={panel} aria-labelledby="home-csv">
          <span className="grid size-10 place-items-center rounded-2xl bg-[var(--accent-yellow-soft)] text-[var(--text-primary)]">
            <Sparkles className="size-5" />
          </span>
          <h2 id="home-csv" className="mt-4 text-lg font-semibold tracking-tight">
            Build a board with an AI assistant
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            Describe your project to an assistant, have it write the plan as a
            CSV file, and import it. There is a ready-made prompt and a demo
            board to try.
          </p>
          <button
            type="button"
            onClick={onOpenGuide}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-surface-2)]"
          >
            Show me how
          </button>
        </section>
      </div>

      {upNext.length > 0 && (
        <section className={panel} aria-labelledby="home-next">
          <div className="flex items-center justify-between gap-4">
            <h2 id="home-next" className="text-lg font-semibold tracking-tight">
              Up next
            </h2>
            <Link href="/progress" className="text-sm font-medium text-[var(--accent)]">
              See all progress
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-[var(--border-hairline)]">
            {upNext.map(({ card, bucketName, done, total }) => (
              <li key={card._id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{card.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{bucketName}</p>
                </div>
                <span className="shrink-0 text-sm text-[var(--text-secondary)]">
                  {done}/{total} done
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
