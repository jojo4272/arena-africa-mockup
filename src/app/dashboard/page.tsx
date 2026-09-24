import type { Metadata } from "next";
import PredictionDashboard from "../PredictionDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prediction Dashboard | Arena Africa",
  description: "Explore Africa and global prediction markets, manage your wallet, join community pools, and simulate USSD access.",
};

export default async function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <PredictionDashboard />
    </main>
  );
}
