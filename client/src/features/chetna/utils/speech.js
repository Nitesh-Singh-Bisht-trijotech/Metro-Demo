export const formatTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** Remove markdown and read ₹ amounts naturally before text-to-speech. */
export const cleanForSpeech = (t) =>
  t
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/₹\s?(\d+)/g, "$1 rupees")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function pickVoice(langCode) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const base = langCode.split("-")[0].toLowerCase();
  const exact = voices.filter((v) => v.lang.replace("_", "-") === langCode);
  const loose = voices.filter((v) => v.lang.toLowerCase().startsWith(base));
  const pool = exact.length ? exact : loose;
  return pool.find((v) => /female|neerja|heera|swara|google/i.test(v.name)) ?? pool[0] ?? null;
}

/**
 * Pull complete sentences out of a streaming buffer so we can start
 * speaking before the full reply has arrived.
 */
export function takeSentences(buffer) {
  const sentences = [];
  let rest = buffer;
  const re = /^([\s\S]*?[.!?।\n]+)(?=\s)/;
  let m;
  while ((m = re.exec(rest))) {
    const s = m[1].trim();
    if (s) sentences.push(s);
    rest = rest.slice(m[0].length).replace(/^\s+/, "");
  }
  return { sentences, rest };
}