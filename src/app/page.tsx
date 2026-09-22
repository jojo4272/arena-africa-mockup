import type { Metadata } from "next";
import MarketingSite from "@/components/MarketingSite";
import { getUsers, getMarkets, getChamas } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arena Africa | Africa-First, Global Prediction Markets",
  description:
    "Forecast local, pan-African and global outcomes through web, mobile and USSD. Explore an API-first prediction platform with mobile-money-ready wallets and community pools.",
  openGraph: {
    title: "Arena Africa — Forecast what’s next",
    description:
      "Africa-first prediction infrastructure for local and global markets, available through web, mobile, USSD and mobile-money-ready wallets.",
    type: "website",
    locale: "en",
    siteName: "Arena Africa",
  },
};

export default async function MarketingPage() {
  const [usersList, marketsList, chamasList] = await Promise.all([
    getUsers(),
    getMarkets(),
    getChamas(),
  ]);

  const openMarkets = marketsList.filter((market) => market.status === "OPEN");

  // Top six open markets by volume — feeds the "Live Markets" board.
  const featured = openMarkets
    .slice()
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 6)
    .map((market) => ({
      id: market.id,
      title: market.title,
      category: market.category,
      locale: market.locale,
      oddsYes: market.oddsYes,
      oddsNo: market.oddsNo,
      volume: market.volume,
    }));

  return (
    <MarketingSite
      stats={{
        markets: marketsList.length,
        openMarkets: openMarkets.length,
        chamas: chamasList.length,
        countries: new Set(usersList.map((user) => user.country)).size,
        totalVolume: marketsList.reduce((total, market) => total + market.volume, 0),
      }}
      featuredMarkets={featured}
      demoUsers={usersList.map((user) => ({
        id: user.id,
        name: user.name,
        country: user.country,
        currency: user.currency,
        phoneNumber: user.phoneNumber,
        role: user.role,
        balance: user.balance,
      }))}
    />
  );
}
