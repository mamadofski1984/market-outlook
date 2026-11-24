import { AppLink as Link } from "./AppLink";
import { notFound } from "next/navigation";
import { SeriesPanel } from "./SeriesPanel";
import { StatusCard, formatNumber } from "./StatusCard";
import { flowShare, isOfficial } from "../lib/market/calculations";
import { indicatorHref } from "../lib/market/navigation";
import { groupSeries } from "../lib/market/series";
import type { Ticker } from "../lib/market/json-repository";
import type { Observation } from "../types/market";

export type MarketQuery = { trade?: string | string[]; entity?: string | string[]; indicator?: string | string[] };

export interface MarketViewProps {
  market: string;
  title: string;
  allRows: readonly Observation[];
  tickers: readonly Ticker[];
}

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

export function MarketView({ market, title, allRows, tickers, query, browserQuery = false }: MarketViewProps & {
  query: MarketQuery;
  browserQuery?: boolean;
}) {
  const { trade, entity, indicator } = query;
  const path = "/markets/" + market;
  function missingIndicator() {
    if (!browserQuery) notFound();
    return <section className="panel stack"><h1>شاخص پیدا نشد</h1><Link href={path}>بازگشت به نمای کلی بازار</Link></section>;
  }
  if (Array.isArray(trade) || Array.isArray(entity) || Array.isArray(indicator)) return missingIndicator();
  const tradeFilter = market === "equities" && trade ? trade : undefined;
  const rows = tradeFilter ? allRows.filter((row) => row.market === tradeFilter) : allRows;
  const groups = groupSeries(rows).sort(([a], [b]) => a.indicator.localeCompare(b.indicator, "fa") || a.entity.localeCompare(b.entity, "fa"));
  const uniqueGroups = [...new Map(groups.map((group) => [indicatorHref(path, group[0].indicator, group[0].entity), group])).values()];
  const hrefFor = (row: Observation) => indicatorHref(path, row.indicator, row.entity, tradeFilter);
  const overviewHref = tradeFilter ? path + "?" + new URLSearchParams({ trade: tradeFilter, ...(entity ? { entity } : {}) }) : path;

  if (indicator !== undefined) {
    const selected = uniqueGroups.find(([row]) => row.indicator === indicator && (entity === undefined || row.entity === entity));
    if (!selected) return missingIndicator();
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
        <div className="indicator-breadcrumb"><Link href={overviewHref}>{title}</Link><span aria-hidden="true">←</span><span>{first.indicator}</span></div>
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
  return <div className="stack">
    <div className="section-title"><h1>{title}</h1><span className="badge pending">حاوی دادهٔ نمونهٔ ساختگی</span></div>
    {!tradeFilter && tickers.length > 0 && <nav className="indicator-switcher" aria-label="نمادهای سهام">
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
