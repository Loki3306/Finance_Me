import { NetWorthCard } from "@/components/dashboard/NetWorthCard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { EnhancedQuickAddModal } from "@/components/transactions/EnhancedQuickAddModal";

export default function Index() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NetWorthCard />
        </div>
        <div>
          <QuickStats />
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </section>
      <EnhancedQuickAddModal />
    </div>
  );
}
