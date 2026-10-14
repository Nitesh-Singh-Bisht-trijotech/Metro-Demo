import { Languages } from "lucide-react";
import { SOCIAL_LINKS, TOP_LINKS } from "../../data/content";

export default function TopBar() {
  return (
    <div className="bg-gradient-to-r from-sky-200 via-pink-200 to-yellow-100 text-xs text-dmrc-ink">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-1.5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="font-medium">Follow us on :</span>
          {SOCIAL_LINKS.map((s) => (
            <span key={s} className="flex h-4 w-4 items-center justify-center rounded-sm bg-dmrc-ink text-[9px] font-bold text-white">
              {s[0].toUpperCase()}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Languages className="h-4 w-4" />
          <button className="hover:underline">हिन्दी</button>
          <span>|</span>
          <button className="font-medium hover:underline">English</button>
          <nav className="ml-4 hidden items-center gap-3 sm:flex">
            {TOP_LINKS.map((l, i) => (
              <span key={l} className="flex items-center gap-3">
                {i > 0 && <span>|</span>}
                <a href="#" className="font-medium hover:underline">{l}</a>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
