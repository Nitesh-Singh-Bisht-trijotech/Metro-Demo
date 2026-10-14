import { AlertTriangle, Bell, BellRing, MessageCircle } from "lucide-react";

const VARIANTS = {
  info: { Icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-100" },
  bell: { Icon: Bell, color: "text-amber-500", bg: "bg-amber-100" },
  alert: { Icon: BellRing, color: "text-red-600", bg: "bg-red-100" },
  warning: { Icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-100" },
};

export default function NoticeItem({ date, title, type = "info" }) {
  const { Icon, color, bg } = VARIANTS[type] ?? VARIANTS.info;
  return (
    <li className="flex gap-3 border-b border-amber-200 py-3 last:border-0">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <time className="text-sm text-gray-500">{date}</time>
        <p className="text-sm font-medium leading-snug text-dmrc-ink">{title}</p>
      </div>
    </li>
  );
}
