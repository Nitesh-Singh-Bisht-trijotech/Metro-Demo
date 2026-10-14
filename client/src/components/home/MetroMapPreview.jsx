// Lightweight SVG stand-in for the interactive map. Swap with a real map later.
export default function MetroMapPreview() {
  return (
    <svg viewBox="0 0 600 170" className="h-full w-full bg-white" role="img" aria-label="Metro map preview">
      <polygon points="370,0 440,0 600,150 600,170 530,170" fill="#c9ecfc" opacity=".8" />
      <path d="M0 140 H440 L600 80" stroke="#c8102e" strokeWidth="6" fill="none" />
      <path d="M205 0 L250 60 V140" stroke="#f2c94c" strokeWidth="6" fill="none" />
      <path d="M250 140 L420 168" stroke="#6b3fa0" strokeWidth="5" />
      {[70, 135, 210, 250, 440].map((x) => (
        <circle key={x} cx={x} cy="140" r="7" fill="#fff" stroke="#c8102e" strokeWidth="3" />
      ))}
      <circle cx="250" cy="60" r="7" fill="#fff" stroke="#f2c94c" strokeWidth="3" />
      <g fontSize="11" fill="#1f2937">
        <text x="222" y="14">Vidhan Sabha</text>
        <text x="262" y="66">Civil Lines</text>
        <text x="262" y="132">Kashmere Gate</text>
        <text x="28" y="118">Pratap Nagar</text>
        <text x="10" y="162">Nagar</text>
        <text x="100" y="162">Pulbangash</text>
        <text x="185" y="162">Tis Hazari</text>
        <text x="500" y="162">Shastri Park</text>
      </g>
      <g stroke="#1d4ed8" strokeWidth="3" fill="none">
        <circle cx="232" cy="82" r="16" />
        <path d="M244 94 L258 108" strokeLinecap="round" />
      </g>
    </svg>
  );
}
