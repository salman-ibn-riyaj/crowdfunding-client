import { Suspense } from "react";
import DashboardShell from "../../components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="dashboard-loading">Loading your dashboard…</main>}>
      <DashboardShell />
    </Suspense>
  );
}