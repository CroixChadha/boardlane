"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { Bucket, Card, ChecklistItem } from "./board";
import { boardStats, percent } from "./board-stats";

const panel =
  "rounded-[20px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)]";

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-2 overflow-hidden rounded-full bg-[var(--border-hairline)]"
    >
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// How far along the board is: overall, bucket by bucket, and which cards
// still have unticked checklist items.
export function ProgressView({
  buckets,
  cards,
  checklistItems,
}: {
  buckets: Bucket[];
  cards: Card[];
  checklistItems: ChecklistItem[];
}) {
  const stats = boardStats(buckets, cards, checklistItems);

  if (stats.total === 0) {
    return (
      <section className="grid min-h-[40vh] place-items-center">
        <div className="max-w-sm text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Nothing to measure yet</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Progress is counted from checklist items. Add a checklist to a
            card on the board and it will show up here.
          </p>
          <Link
            href="/"
            className="primary-button mt-5 inline-flex h-10 items-center rounded-full bg-[var(--btn-primary-bg)] px-4 text-sm font-medium text-[var(--btn-primary-text)]"
          >
            Open the board
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${panel} bg-[var(--accent-soft)]`} aria-labelledby="progress-overall">
        <h2 id="progress-overall" className="text-sm font-medium text-[var(--text-secondary)]">
          Overall
        </h2>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-5xl font-semibold tracking-[-0.04em]" data-testid="progress-overall-value">
            {stats.completion}%
          </span>
          <CheckCircle2 className="size-7 text-[var(--success)]" />
        </div>
        <div className="mt-4">
          <Bar value={stats.completion} label="Overall completion" />
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          {stats.done} of {stats.total} checklist items complete. {stats.finishedCards} of{" "}
          {cards.length - stats.cardsWithoutChecklist} cards with a checklist are finished.
        </p>
      </section>

      <section className={panel} aria-labelledby="progress-buckets">
        <h2 id="progress-buckets" className="text-lg font-semibold tracking-tight">
          By bucket
        </h2>
        <ul className="mt-4 space-y-5">
          {stats.bucketProgress.map(({ bucket, cardCount, done, total }) => (
            <li key={bucket._id} data-testid="progress-bucket">
              <div className="flex items-baseline justify-between gap-4">
                <p className="truncate text-sm font-medium">{bucket.name}</p>
                <p className="shrink-0 text-sm text-[var(--text-secondary)]">
                  {total === 0
                    ? `${cardCount} ${cardCount === 1 ? "card" : "cards"}, no checklist items`
                    : `${done}/${total} items · ${percent(done, total)}%`}
                </p>
              </div>
              <div className="mt-2">
                <Bar value={percent(done, total)} label={`${bucket.name} completion`} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={panel} aria-labelledby="progress-todo">
        <h2 id="progress-todo" className="text-lg font-semibold tracking-tight">
          Still to do
        </h2>
        {stats.unfinished.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Every checklist is complete.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border-hairline)]">
            {stats.unfinished.map(({ card, bucketName, done, total }) => (
              <li key={card._id} className="flex items-center justify-between gap-4 py-3" data-testid="progress-unfinished">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{card.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{bucketName}</p>
                </div>
                <span className="shrink-0 text-sm text-[var(--text-secondary)]">
                  {total - done} left of {total}
                </span>
              </li>
            ))}
          </ul>
        )}
        {stats.cardsWithoutChecklist > 0 && (
          <p className="mt-4 text-xs text-[var(--text-secondary)]">
            {stats.cardsWithoutChecklist}{" "}
            {stats.cardsWithoutChecklist === 1 ? "card has" : "cards have"} no checklist and{" "}
            {stats.cardsWithoutChecklist === 1 ? "is" : "are"} not counted.
          </p>
        )}
      </section>
    </div>
  );
}
