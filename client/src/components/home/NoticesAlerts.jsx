import { Megaphone } from "lucide-react";
import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import NoticeItem from "./NoticeItem";
import { NOTICES } from "../../data/content";

export default function NoticesAlerts() {
  return (
    <Card tone="cream" className="p-4">
      <SectionHeader icon={<Megaphone className="h-6 w-6 text-dmrc-gold" />} title="Notices & Alerts" />
      <ul className="mt-2">
        {NOTICES.map((n) => (
          <NoticeItem key={n.id} {...n} />
        ))}
      </ul>
      <div className="mt-1 text-right">
        <a href="#" className="text-sm font-semibold text-dmrc-ink hover:text-dmrc-red">View All</a>
      </div>
    </Card>
  );
}
