import Link from "next/link";
import { BrandMark } from "./brand-mark";

export default function NotFound() {
  return (
    <main className="board-stage grid min-h-screen place-items-center bg-[var(--bg-page)] px-5 py-10 text-[var(--text-primary)]">
      <section className="w-full max-w-lg rounded-[24px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-6 py-10 text-center shadow-[var(--shadow-card)] sm:px-10 sm:py-12">
        <div className="flex items-center justify-center gap-3">
          <BrandMark />
          <span className="text-lg font-medium tracking-[-0.04em]">Boardlane</span>
        </div>
        <p className="mt-10 text-sm font-medium text-[var(--text-secondary)]">
          Nothing here
        </p>
        <h1 className="editorial-title mt-3 text-[clamp(2.75rem,8vw,4.5rem)] leading-[0.98] tracking-[-0.045em]">
          This page doesn&rsquo;t <em>exist.</em>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
          Your board is still right where you left it.
        </p>
        <Link
          href="/"
          className="primary-button mt-7 inline-flex h-10 items-center rounded-full bg-[var(--btn-primary-bg)] px-5 text-sm font-medium text-[var(--btn-primary-text)]"
        >
          Back to my board
        </Link>
      </section>
    </main>
  );
}
