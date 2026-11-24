import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MarketView, type MarketQuery } from "../../../components/MarketView";
import { StaticMarketView } from "../../../components/StaticMarketView";
import { getRouteRows, getTickers, marketRoutes, type MarketRoute } from "../../../lib/market/service";

export function generateStaticParams() {
  return process.env.NEXT_PUBLIC_PAGES_DEMO === "1" ? Object.keys(marketRoutes).map((market) => ({ market })) : [];
}

export default async function MarketPage({ params, searchParams }: {
  params: Promise<{ market: string }>;
  searchParams: Promise<MarketQuery>;
}) {
  const { market } = await params;
  if (!Object.hasOwn(marketRoutes, market)) notFound();
  const route = marketRoutes[market as MarketRoute];
  const [allRows, tickers] = await Promise.all([getRouteRows(market as MarketRoute), market === "equities" ? getTickers() : []]);
  const props = { market, title: route.title, allRows, tickers };

  if (process.env.NEXT_PUBLIC_PAGES_DEMO === "1") {
    return <Suspense fallback={<MarketView {...props} query={{}} browserQuery />}>
      <StaticMarketView {...props} />
    </Suspense>;
  }
  return <MarketView {...props} query={await searchParams} />;
}
