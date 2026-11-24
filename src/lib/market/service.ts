import { cache } from "react";
import { jsonRepository, listTickers, readEquitySeries, readMarket } from "./json-repository";
import { isOfficial } from "./calculations";
import type { Market, Observation, ObservationQuery, SeriesKey } from "../../types/market";

const overview: readonly SeriesKey[] = [
  { market: "macro", indicator: "شاخص قیمت مصرف‌کننده", entity: "کل کشور" },
  { market: "equities", indicator: "شاخص کل بورس", entity: "کل بازار" },
  { market: "money_flow", indicator: "میانگین نرخ اخزا", entity: "اخزا" },
  { market: "gold_fx", indicator: "قیمت طلای ۱۸ عیار", entity: "ایران" },
  { market: "gold_fx", indicator: "دلار بازار آزاد", entity: "USD" },
  { market: "housing", indicator: "میانگین قیمت هر مترمربع", entity: "تهران" },
];

const globalCommodities: readonly SeriesKey[] = [
  { market: "gold_fx", indicator: "انس جهانی طلا", entity: "جهان" },
  { market: "commodities", indicator: "انس جهانی نقره", entity: "جهان" },
  { market: "commodities", indicator: "انس جهانی مس", entity: "جهان" },
  { market: "energy", indicator: "نفت برنت", entity: "جهان" },
  { market: "commodities", indicator: "شاخص کامودیتی‌ها", entity: "جهان" },
];

const globalMacro: readonly SeriesKey[] = [
  { market: "macro", indicator: "نرخ بهره بین بانکی آمریکا", entity: "آمریکا" },
  { market: "macro", indicator: "بازده اوراق ۱۰ ساله", entity: "آمریکا" },
  { market: "macro", indicator: "نرخ CPI آمریکا", entity: "آمریکا" },
];

export const getObservations = (query: ObservationQuery) => jsonRepository.list(query);
export const getTickers = listTickers;
export const getMarketRows = (market: Market, entity?: string) => readMarket(market, entity);

export function groupSeries(rows: readonly Observation[]) {
  const groups = new Map<string, Observation[]>();
  for (const row of rows) {
    const key = JSON.stringify([row.market, row.indicator, row.entity]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return [...groups.values()].map((group) => group.sort((a, b) => a.date.localeCompare(b.date)));
}

export const marketRoutes = {
  macro: { title: "کلان", domains: ["macro"] },
  "data-charts": { title: "داده‌ها و نمودارها", domains: ["macro", "housing", "gold_fx", "commodities", "energy", "money_flow", "equities"] },
  "gold-fx": { title: "طلا، ارز و کامودیتی", domains: ["gold_fx", "commodities"] },
  "money-flow": { title: "جریان پول", domains: ["money_flow"] },
  equities: { title: "سهام، کالا و انرژی", domains: ["equities", "commodities", "energy"] },
  housing: { title: "مسکن", domains: ["housing"] },
  scenarios: { title: "سناریوها", domains: [] },
} as const satisfies Record<string, { title: string; domains: readonly Market[] }>;

export type MarketRoute = keyof typeof marketRoutes;
export type IndicatorLink = Pick<SeriesKey, "indicator" | "entity">;
export type SidebarCatalog = Readonly<Record<string, readonly IndicatorLink[]>>;

const readDomain = cache((market: Market) => market === "equities" ? readEquitySeries() : getMarketRows(market));

export async function getRouteRows(route: MarketRoute): Promise<readonly Observation[]> {
  return (await Promise.all(marketRoutes[route].domains.map(readDomain))).flat();
}

export async function getSidebarCatalog(): Promise<SidebarCatalog> {
  const entries = await Promise.all((Object.keys(marketRoutes) as MarketRoute[]).map(async (route) => {
    const rows = await getRouteRows(route);
    const indicators = new Map<string, IndicatorLink>();
    for (const { indicator, entity } of rows) indicators.set(JSON.stringify([indicator, entity]), { indicator, entity });
    const links = [...indicators.values()].sort((a, b) => a.indicator.localeCompare(b.indicator, "fa") || a.entity.localeCompare(b.entity, "fa"));
    return ["/markets/" + route, links] as const;
  }));
  return Object.fromEntries(entries);
}

async function getComparisonGroup(keys: readonly SeriesKey[]) {
  const series = await Promise.all(keys.map(getObservations));
  return {
    cards: keys.map((key, index) => ({ key, latest: series[index].at(-1) })),
    comparison: keys.map(({ indicator }, index) => ({
      label: indicator,
      points: series[index].filter(isOfficial).map(({ date, value, status }) => ({ date, value, status })),
    })),
  };
}

export async function getOverview() {
  const [domestic, global, macroCards] = await Promise.all([
    getComparisonGroup(overview),
    getComparisonGroup(globalCommodities),
    Promise.all(globalMacro.map(async (key) => ({ key, latest: (await getObservations(key)).at(-1) }))),
  ]);
  return { ...domestic, global, macroCards };
}
