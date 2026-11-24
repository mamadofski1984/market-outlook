import Link from "next/link";
import { notFound } from "next/navigation";
import { SeriesPanel } from "../../../components/SeriesPanel";
import { StatusCard, formatNumber } from "../../../components/StatusCard";
import { flowShare, isOfficial } from "../../../lib/market/calculations";
import { indicatorHref } from "../../../lib/market/navigation";
import { getRouteRows, getTickers, groupSeries, marketRoutes, type MarketRoute } from "../../../lib/market/service";
import type { Observation } from "../../../types/market";

export const dynamic = "force-dynamic";

function IndicatorStats({ rows }: { rows: readonly Observation[] }) {
  const official = rows.filter(isOfficial);
  const latest = official.at(-1);
  const prior = official.at(-2);
  const delta = latest && prior ? latest.value - prior.value : undefined;
  return <dl className="panel indicator-stats" aria-label="آخرین مشاهدهٔ قطعی">
    <div><dt>آخرین مقدار قطعی</dt><dd>{latest ? <><bdi>{formatNumber(latest.value)}</bdi> <small>{latest.unit}</small></> : "در دسترس نیست"}</dd></div>
    <div><dt>دورهٔ آخرین مشاهدهٔ قطعی</dt><dd>{latest ? <bdi>{latest.date}</bdi> : "—"}</dd></div>
    <div><dt>تغییر نسبت به مشاهدهٔ قطعی قبل</dt><dd>{delta === undefined || !Number.isFinite(delta) ? "—" : <>
      <span className={"trend " + (delta > 0 ? "up" : delta < 0 ? "down" : "flat")} aria-hidden="true">{delta > 0 ? "↗" : delta < 0 ? "↘" : "→"}</span>
      <bdi>{delta > 0 ? "+" : ""}{formatNumber(delta)}</bdi> <small>{latest?.unit}</small>
    </>}</dd></div>
    <div><dt>منبع</dt><dd>{latest?.source_url ? <a href={latest.source_url}>{latest.source_name}</a> : latest?.source_name ?? "—"}</dd></div>
  </dl>;
}

export default async function MarketPage({ params, searchParams }: {
  params: Promise<{ market: string }>;
  searchParams: Promise<{ trade?: string | string[]; entity?: string | string[]; indicator?: string | string[] }>;
}) {
  const { market } = await params;
  if (!Object.hasOwn(marketRoutes, market)) notFound();
  const route = marketRoutes[market as MarketRoute];
  const { trade, entity, indicator } = await searchParams;
  if (Array.isArray(trade) || Array.isArray(entity) || Array.isArray(indicator)) notFound();
  const path = "/markets/" + market;
  const allRows = await getRouteRows(market as MarketRoute);
  const tradeFilter = market === "equities" && trade ? trade : undefined;
  const rows = tradeFilter ? allRows.filter((row) => row.market === tradeFilter) : allRows;
  const groups = groupSeries(rows).sort(([a], [b]) => a.indicator.localeCompare(b.indicator, "fa") || a.entity.localeCompare(b.entity, "fa"));
  const uniqueGroups = [...new Map(groups.map((group) => [indicatorHref(path, group[0].indicator, group[0].entity), group])).values()];
  const hrefFor = (row: Observation) => indicatorHref(path, row.indicator, row.entity, tradeFilter);
  const overviewHref = tradeFilter ? path + "?" + new URLSearchParams({ trade: tradeFilter, ...(entity ? { entity } : {}) }) : path;

  if (indicator !== undefined) {
    const selected = uniqueGroups.find(([row]) => row.indicator === indicator && (entity === undefined || row.entity === entity));
    if (!selected) notFound();
    const first = selected[0];
    const depth = first.market === "money_flow" && first.indicator === "خالص جریان پول"
      ? new Map(allRows.filter((row) => row.market === "money_flow" && row.indicator === "ارزش معاملات" && row.entity === first.entity)
        .map((row) => [row.date, row]))
      : undefined;
    const flowRatios = depth ? new Map(selected.map((flow) => {
      const denominator = depth.get(flow.date);
      return [flow.date, denominator ? flowShare(flow, denominator) : null] as const;
    })) : undefined;
    return <div className="stack">
      <header className="indicator-header">
        <div className="indicator-breadcrumb"><Link href={overviewHref}>{route.title}</Link><span aria-hidden="true">←</span><span>{first.indicator}</span></div>
        <h1>{first.indicator} <small>({first.entity})</small></h1>
        <nav className="indicator-switcher" aria-label="انتخاب شاخص بازار">
          {uniqueGroups.map(([row]) => <Link key={hrefFor(row)} href={hrefFor(row)}
            aria-current={row === first ? "page" : undefined}>{row.indicator} <small>· {row.entity}</small></Link>)}
        </nav>
      </header>
      <IndicatorStats rows={selected} />
      <SeriesPanel key={hrefFor(first)} rows={selected} timeframes flowRatios={flowRatios} />
    </div>;
  }

  const visibleGroups = tradeFilter && entity ? uniqueGroups.filter(([row]) => row.entity === entity) : uniqueGroups;
  const tickers = market === "equities" && !tradeFilter ? await getTickers() : [];
  return <div className="stack">
    <div className="section-title"><h1>{route.title}</h1><span className="badge pending">حاوی دادهٔ نمونهٔ ساختگی</span></div>
    {tickers.length > 0 && <nav className="indicator-switcher" aria-label="نمادهای سهام">
      {tickers.map((ticker) => <Link href={"/markets/equities/" + ticker.id} key={ticker.id}>{ticker.entity}</Link>)}
    </nav>}
    {visibleGroups.length ? <div className="market-card-grid">{visibleGroups.map((group) => {
      const latest = group.at(-1)!;
      return <Link href={hrefFor(latest)} key={hrefFor(latest)} className="indicator-card-link"
        aria-label={latest.indicator + "، " + latest.entity}>
        <StatusCard label={latest.indicator + " · " + latest.entity} observation={latest} />
      </Link>;
    })}</div> : <section className="panel"><p>{market === "scenarios" ? "هنوز سناریویی تعریف نشده است." : "مشاهده‌ای برای این بخش پیدا نشد."}</p></section>}
  </div>;
}
