export function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-9 place-items-center rounded-full bg-[var(--text-primary)] text-[var(--bg-surface)]"
    >
      <span className="absolute size-[18px] rounded-full border-[3px] border-current" />
      <span className="absolute bottom-[7px] right-[6px] size-3 rotate-45 border-b-[3px] border-r-[3px] border-current" />
    </span>
  );
}
