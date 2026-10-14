import { MetroBadge } from "./Icons";

export default function Logo() {
  return (
    <a href="/" className="flex items-center gap-2 text-dmrc-red" aria-label="Delhi Metro home">
      <MetroBadge className="h-16 w-16" />
      <div className="text-2xl font-extrabold leading-none tracking-wide">
        <div>DELHI</div>
        <div>METRO</div>
      </div>
    </a>
  );
}
