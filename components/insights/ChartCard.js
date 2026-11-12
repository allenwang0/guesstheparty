export default function ChartCard({ id, title, question, takeaway, state, minSample, onRetry, children }) {
  let body;
  if (state.status === "loading") {
    body = <div className="h-48 rounded-xl bg-[var(--rule)] animate-pulse" aria-label="Loading" />;
  } else if (state.status === "error") {
    body = (
      <div className="h-48 flex flex-col items-center justify-center gap-3 text-sm text-[var(--ink-muted)]">
        <p>Stats are unavailable right now</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg border border-[var(--rule)] text-[var(--ink)] font-semibold"
        >
          Retry
        </button>
      </div>
    );
  } else if (state.n < minSample) {
    body = (
      <div className="h-48 flex items-center justify-center text-sm text-[var(--ink-muted)]">
        Not enough games yet ({state.n} of {minSample})
      </div>
    );
  } else {
    body = (
      <>
        {takeaway && (
          <p className="text-sm font-semibold mb-3" data-testid={`${id}-takeaway`}>
            {takeaway}
          </p>
        )}
        <div data-testid={`${id}-chart`}>{children}</div>
      </>
    );
  }
  return (
    <section
      className="rounded-2xl bg-[var(--card)] border border-[var(--rule)] p-4 md:p-6 min-w-0"
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="text-base font-bold">
        {title}
      </h2>
      <p className="text-xs text-[var(--ink-muted)] mb-4">{question}</p>
      {body}
    </section>
  );
}
