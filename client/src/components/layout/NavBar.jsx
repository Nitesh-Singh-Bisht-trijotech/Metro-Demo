import { NAV_LINKS } from "../../data/content";

export default function NavBar({ active = "Home" }) {
  return (
    <nav aria-label="Primary" className="flex flex-wrap justify-end gap-x-5 gap-y-1 text-sm text-dmrc-ink">
      {NAV_LINKS.map((link) => (
        <a
          key={link}
          href="#"
          aria-current={link === active ? "page" : undefined}
          className={`py-1 hover:text-dmrc-red ${link === active ? "font-semibold text-dmrc-red" : ""}`}
        >
          {link}
        </a>
      ))}
    </nav>
  );
}
