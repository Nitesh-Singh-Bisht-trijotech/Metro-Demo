import { MetroBadge } from "./Icons";

export default function Logo() {
  return (
    <a
      href="/"
      className="flex items-center gap-3 select-none"
      aria-label="Delhi Metro home"
    >
      {/* Badge */}
      <MetroBadge className="h-14 w-14 flex-shrink-0 drop-shadow-md" />

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        {/* DMRC label */}
        <span
          style={{ color: "#dc2626", letterSpacing: "0.18em" }}
          className="text-[10px] font-semibold uppercase"
        >
          DMRC
        </span>

        {/* Main name */}
        <div className="flex items-baseline gap-0.5">
          <span
            style={{ color: "#dc2626" }}
            className="text-2xl font-extrabold tracking-tight leading-none"
          >
            Delhi
          </span>
          <span
            style={{ color: "#991b1b" }}
            className="text-2xl font-extrabold tracking-tight leading-none"
          >
            &nbsp;Metro
          </span>
        </div>

        {/* Tagline */}
        <span
          style={{ color: "#6b7280", letterSpacing: "0.08em" }}
          className="text-[9px] font-medium uppercase mt-0.5"
        >
          AI&nbsp;Powered&nbsp;Assistant
        </span>
      </div>
    </a>
  );
}
