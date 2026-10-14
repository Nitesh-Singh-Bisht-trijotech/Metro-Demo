export default function ChetnaAvatar({ className = "h-12 w-12" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-100 ${className}`}>
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
        <rect width="48" height="48" fill="#e0e7ff" />
        <path d="M8 48c2-11 9-15 16-15s14 4 16 15z" fill="#1e1b4b" />
        <circle cx="24" cy="21" r="9" fill="#f4c7a1" />
        <path d="M14 20c0-8 5-12 10-12s10 4 10 12c-3-5-7-6-10-6s-7 1-10 6z" fill="#1f1722" />
        <path d="M19 10l5-4 5 4z" fill="#c8102e" />
      </svg>
    </span>
  );
}