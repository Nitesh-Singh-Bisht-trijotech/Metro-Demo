import React from "react";

// Metro Line badge color map
const LINE_COLORS = {
  "yellow line": "bg-yellow-400 text-yellow-950 border-yellow-500",
  "blue line": "bg-blue-600 text-white border-blue-700",
  "red line": "bg-red-600 text-white border-red-700",
  "orange line": "bg-amber-600 text-white border-amber-700",
  "airport express line": "bg-amber-600 text-white border-amber-700",
  "airport line": "bg-amber-600 text-white border-amber-700",
  "violet line": "bg-purple-700 text-white border-purple-800",
  "magenta line": "bg-pink-700 text-white border-pink-800",
  "pink line": "bg-pink-400 text-pink-950 border-pink-500",
  "green line": "bg-emerald-600 text-white border-emerald-700",
  "grey line": "bg-gray-500 text-white border-gray-600",
  "rapid metro": "bg-sky-500 text-white border-sky-600",
};

/**
 * Parses inline markdown:
 * - **bold**
 * - Metro line badges
 * - *italic*
 */
function parseInline(text) {
  if (!text) return null;

  // Split by bold (**text**) first
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      const lower = inner.toLowerCase();

      // Check for Metro line pill
      for (const [key, colorClass] of Object.entries(LINE_COLORS)) {
        if (lower.includes(key)) {
          return (
            <span
              key={idx}
              className={`mx-1 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold shadow-xs ${colorClass}`}
            >
              🚇 {inner}
            </span>
          );
        }
      }

      return (
        <strong key={idx} className="font-semibold text-gray-900">
          {inner}
        </strong>
      );
    }

    // Process italics (*text*)
    const italicParts = part.split(/(\*[^*]+?\*)/g);
    if (italicParts.length > 1) {
      return (
        <React.Fragment key={idx}>
          {italicParts.map((sub, sIdx) => {
            if (sub.startsWith("*") && sub.endsWith("*")) {
              return <em key={sIdx} className="italic text-gray-800">{sub.slice(1, -1)}</em>;
            }
            return sub;
          })}
        </React.Fragment>
      );
    }

    return part;
  });
}

/**
 * Normalizes dense / unformatted raw model text into clean paragraphs & list items.
 */
function normalizeTransitText(raw) {
  if (!raw) return "";

  return raw
    // Insert double newlines before numbered steps like ' 1. **Boarding' or ' 2. The'
    .replace(/\s+(\d+\.\s+(?:\*\*|[A-Z]))/g, (m, p) => "\n\n" + p)
    // Insert newline before bullet items like ' - **New Delhi'
    .replace(/\s+(-\s+)/g, (m, p) => "\n" + p)
    // Separate common closing remarks
    .replace(/\s+(Have a wonderful|Let me know if|Safe journey|Happy journey)/gi, (m, p) => "\n\n" + p);
}

export default function FormattedMessage({ text }) {
  if (!text) return null;

  const normalized = normalizeTransitText(text);
  const blocks = normalized.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-gray-800">
      {blocks.map((block, bIdx) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

        // Check if block starts with a numbered item (e.g. '1. **Boarding Station:** ...')
        const numMatch = block.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const rest = numMatch[2];

          // Sub-bullets within this numbered item
          const subLines = lines.slice(1);

          return (
            <div
              key={bIdx}
              className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white/80 p-2.5 shadow-xs"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2f5db0] text-xs font-bold text-white shadow-xs">
                {num}
              </span>
              <div className="flex-1 space-y-1">
                <div>{parseInline(rest)}</div>
                {subLines.length > 0 && (
                  <ul className="mt-1.5 space-y-1 pl-1">
                    {subLines.map((line, lIdx) => {
                      const cleanLine = line.replace(/^-\s*/, "");
                      return (
                        <li key={lIdx} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <span className="text-[#2f5db0]">•</span>
                          <span>{parseInline(cleanLine)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        }

        // Check if block is a pure bullet list (multiple lines starting with '-')
        if (lines.every((l) => l.startsWith("-") || l.startsWith("•"))) {
          return (
            <ul key={bIdx} className="space-y-1.5 rounded-lg bg-white/60 p-2 pl-3">
              {lines.map((l, lIdx) => {
                const clean = l.replace(/^[-•]\s*/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <span className="text-[#2f5db0]">•</span>
                    <span>{parseInline(clean)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p key={bIdx} className="leading-normal">
            {parseInline(block)}
          </p>
        );
      })}
    </div>
  );
}

