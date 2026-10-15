// Small inline brand-style icons shared by section headers.
export function MetroBadge({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Outer red circle */}
      <circle cx="32" cy="32" r="30" fill="#dc2626" />
      {/* Inner white ring accent */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.25" />
      {/* Bold white M letterform */}
      <path
        d="M14 44 L14 22 L22 36 L32 20 L42 36 L50 22 L50 44"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Navy blue accent underline arc */}
      <path
        d="M18 50 Q32 56 46 50"
        fill="none"
        stroke="#1a3a7c"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
