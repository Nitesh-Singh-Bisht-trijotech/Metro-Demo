import { Search } from "lucide-react";

export default function SearchInput({ placeholder = "Search", className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        placeholder={placeholder}
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 pr-9 text-sm text-dmrc-ink placeholder:text-gray-500 focus:border-dmrc-red focus:outline-none"
        {...props}
      />
      <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}
