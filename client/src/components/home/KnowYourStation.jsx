import { Search } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SectionHeader from "../ui/SectionHeader";
import SearchInput from "../ui/SearchInput";

export default function KnowYourStation() {
  return (
    <Card tone="mint" className="p-4">
      <SectionHeader icon={<Search className="h-6 w-6 text-green-400" />} title="Know Your Station" />
      <SearchInput placeholder="Search Metro Station" className="mt-3 [&_input]:py-2.5" />
      <div className="mt-4 flex justify-end">
        <Button variant="teal">Advanced Search</Button>
      </div>
    </Card>
  );
}
