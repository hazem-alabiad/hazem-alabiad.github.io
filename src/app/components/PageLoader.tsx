export function PageLoader({ label = "loading" }: { label?: string }) {
  return (
    <div className="wrap">
      <div className="page-loader" role="status" aria-live="polite">
        <span className="page-loader-prompt" aria-hidden="true">$</span>
        <span className="page-loader-text">{label}…</span>
        <span className="page-loader-cursor" aria-hidden="true" />
      </div>
    </div>
  );
}