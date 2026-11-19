/** The logo: the brushstroke glyph and the name. Same glyph as main's Nav. */
export function Brand() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <path d="M3 18C8 6 12 22 17 12S22 8 23 10" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-brand" />
      </svg>
      Albert Nelly
    </span>
  );
}
