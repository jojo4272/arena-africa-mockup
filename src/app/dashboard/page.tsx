import type { Metadata } from "next";
import { getUsers, getMarkets, getChamas } from "../actions";
import PredictionDashboard from "../PredictionDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prediction Dashboard | Arena Africa",
  description: "Explore Africa and global prediction markets, manage your wallet, join community pools, and simulate USSD access.",
};

export default async function DashboardPage() {
  const [usersList, marketsList, chamasList] = await Promise.all([
    getUsers(),
    getMarkets(),
    getChamas(),
  ]);

  return (
    <main className="min-h-screen bg-slate-900">
      <PredictionDashboard
        initialUsers={usersList}
        initialMarkets={marketsList}
        initialChamas={chamasList}
      />
    </main>
  );
}
