import { useMemo } from "react";

const N = 21;
const inFinder = (x, y) =>
  (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
const finderOn = (x, y) => {
  const lx = x >= N - 7 ? x - (N - 7) : x;
  const ly = y >= N - 7 ? y - (N - 7) : y;
  const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
  const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
  return ring || core;
};

/** Decorative, deterministic pseudo-QR. NOT scannable — replace with a real QR lib. */
export default function FakeQr({ value, size = 112 }) {
  const cells = useMemo(() => {
    let seed = [...value].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const out = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (inFinder(x, y) ? finderOn(x, y) : rnd() > 0.5) out.push([x, y]);
      }
    return out;
  }, [value]);

  return (
    <svg viewBox={`0 0 ${N} ${N}`} width={size} height={size} role="img" aria-label="Ticket QR code (demo)" shapeRendering="crispEdges">
      <rect width={N} height={N} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#111" />
      ))}
    </svg>
  );
}