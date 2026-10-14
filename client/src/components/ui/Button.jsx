const VARIANTS = {
  primary: "bg-dmrc-red hover:bg-dmrc-red-dark text-white",
  teal: "bg-dmrc-teal hover:bg-teal-900 text-white",
  outline: "bg-white border border-gray-300 text-dmrc-ink hover:bg-gray-50",
  soft: "bg-indigo-200 text-white hover:bg-indigo-300",
};

export default function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button
      className={`rounded px-5 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dmrc-red focus-visible:ring-offset-2 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
