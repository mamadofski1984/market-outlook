"use client";

import { useSearchParams } from "next/navigation";
import { MarketView, type MarketQuery, type MarketViewProps } from "./MarketView";

export function StaticMarketView(props: MarketViewProps) {
  const params = useSearchParams();
  const query: MarketQuery = {};
  for (const key of ["trade", "entity", "indicator"] as const) {
    const values = params.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }
  return <MarketView {...props} query={query} browserQuery />;
}
