import { Train } from "lucide-react";
import { useEffect, useState } from "react";

export default function Carousel({ slides, interval = 4500 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(id);
  }, [paused, slides.length, interval]);

  return (
    <div
      className="relative h-56 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div
        className="flex h-full transition-transform duration-500 motion-reduce:transition-none"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            aria-hidden={i !== index}
            className={`relative flex h-full w-full shrink-0 flex-col justify-end bg-gradient-to-br p-5 text-white ${s.bg}`}
          >
            <Train className="absolute right-4 top-4 h-24 w-24 text-white/20" aria-hidden="true" />
            <h3 className="text-2xl font-bold leading-tight">{s.title}</h3>
            <p className="mt-1 text-sm text-white/85">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="absolute bottom-2 right-4 flex gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}