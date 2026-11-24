import Link from "next/link";
import { notFound } from "next/navigation";
import { SeriesPanel } from "../../../../components/SeriesPanel";
import { getMarketRows, getTickers, groupSeries } from "../../../../lib/market/service";

export const dynamic = "force-dynamic";

export default async function TickerPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const entry = (await getTickers()).find((item) => item.id === ticker);
  if (!entry) notFound();
  const rows = await getMarketRows("equities", entry.entity);
  return <div className="stack">
    <div className="section-title"><h1>{entry.entity}</h1><span className="badge pending">حاوی دادهٔ نمونهٔ ساختگی</span></div>
    {entry.tradeMarkets.length > 0 && <section className="panel"><h2>معاملات مرتبط</h2><ul>{entry.tradeMarkets.map((trade) =>
      <li key={trade}><Link href={"/markets/equities?" + new URLSearchParams({ trade, entity: entry.entity })}>
        {trade === "commodities" ? "بورس کالا" : "بورس انرژی"}
      </Link></li>)}</ul></section>}
    {groupSeries(rows).map((group) => <SeriesPanel rows={group} key={group[0].observation_id}/>)}
    {!rows.length && <section className="panel"><p>داده‌ای برای این نماد منتشر نشده است.</p></section>}
  </div>;
}
