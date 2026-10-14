import Logo from "../ui/Logo";
import SearchInput from "../ui/SearchInput";
import Button from "../ui/Button";
import HelplineBadge from "./HelplineBadge";
import NavBar from "./NavBar";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Logo />

        <div className="flex flex-1 flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button className="!px-8 !py-3">For Feedback/Complaints Click Here</Button>
            <HelplineBadge />
            <SearchInput className="w-64" />
            <Button variant="soft" className="max-w-[9rem] text-left leading-tight">
              Click here for Service Status
            </Button>
          </div>
          <NavBar />
        </div>
      </div>
    </header>
  );
}
