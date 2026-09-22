import React from "react";
import { VariableSizeList as List } from "react-window";
import { MarketItem } from "./MarketItem";
import { useMarkets } from "@/app/hooks/use-markets";

export function VirtualMarketList() {
  const { data: markets = [], isLoading, isError } = useMarkets();

  if (isLoading) return <div className="text-center py-8">Loading markets...</div>;
  if (isError) return <div className="text-center py-8 text-red-500">Error loading markets</div>;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const market = markets[index];
    if (!market) return null;
    return (
      <div style={style}>
        <MarketItem market={market} key={market.id} />
      </div>
    );
  };

  return (
    <List
      height={600}
      itemCount={markets.length}
      itemSize={120} // Fixed height for each market item
      width="100%"
    >
      {Row}
    </List>
  );
}