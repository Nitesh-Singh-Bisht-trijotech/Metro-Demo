// Small inline brand-style icons shared by section headers.
export function MetroBadge({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" />
      <path d="M9 20 L23 12 M9 16 H23" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
