const HANDLES = ["OfficialDMRC", "OfficialDMRC", "OfficialDMRC"];

export default function PromoBanner() {
  return (
    <figure className="relative overflow-hidden rounded-md bg-gradient-to-br from-indigo-950 via-indigo-800 to-purple-700 p-4 text-white shadow-card">
      <div className="text-[10px] font-bold leading-tight text-red-300">
        DELHI
        <br />
        METRO
      </div>
      <h2 className="mt-1 text-center text-4xl font-extrabold leading-none">
        Join the
        <span className="block text-5xl">Digital Journey</span>
      </h2>

      <ul className="mt-3 flex flex-wrap justify-center gap-1.5 text-[8px]">
        {HANDLES.map((h, i) => (
          <li key={i} className="rounded-full bg-white px-2 py-0.5 text-dmrc-ink">{h}</li>
        ))}
      </ul>

      <figcaption className="mt-8 max-w-[11rem] text-xs font-semibold leading-snug">
        Follow Delhi Metro’s Social Media Platforms and stay connected with the latest updates
      </figcaption>

      <div className="absolute bottom-3 right-4 h-24 w-14 rotate-12 rounded-xl border-2 border-white/60 bg-white/10" aria-hidden="true" />
    </figure>
  );
}
