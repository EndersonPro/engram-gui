import { Sheet } from "@/components/ui/sheet";
import { RuntimeStatusPanel } from "@features/engram-status/ui/runtime-status-panel";

const DashboardPage = () => {
  return (
    <section
      className="space-y-5 transition-[transform,opacity] duration-[var(--motion-duration-medium)] ease-[var(--motion-ease)] motion-reduce:transition-none"
      data-dashboard-motion="reduce-safe"
    >
      <Sheet depth="panel">
        <RuntimeStatusPanel />
      </Sheet>
    </section>
  );
};

export default DashboardPage;
