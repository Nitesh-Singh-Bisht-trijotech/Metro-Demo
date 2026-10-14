import { CreditCard, Tag } from "lucide-react";
import Card from "../ui/Card";

const ICONS = { tag: Tag, card: CreditCard };

export default function CollapsibleCard({ title, icon = "tag", children }) {
  const Icon = ICONS[icon];
  return (
    <Card className="border border-pink-200">
      <details>
        <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4">
          <Icon className="h-6 w-6 text-pink-300" />
          <span className="border-l border-gray-300 pl-4 text-[17px] text-dmrc-ink">{title}</span>
        </summary>
        {children && <div className="px-4 pb-4">{children}</div>}
      </details>
    </Card>
  );
}
