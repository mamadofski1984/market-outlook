import type { JalaliDate, Observation } from "../types/market";
import { MarketChart } from "./MarketChart";
import { formatNumber, StatusBadge } from "./StatusCard";

export function SeriesPanel({ rows, timeframes = false, flowRatios }: {
  rows: readonly Observation[];
  timeframes?: boolean;
  flowRatios?: ReadonlyMap<JalaliDate, number | null>;
}) {
  const first = rows[0];
  const title = first.indicator + " · " + first.entity;
  return <section className="stack">
    <MarketChart title={title} note={"واحد: " + first.unit + " · نقاط توخالی نشان‌دهندهٔ دادهٔ غیرقطعی‌اند."}
      mode={timeframes ? "history" : "value"} series={[{ label: first.indicator, points: rows }]}/>
    <section className="panel history-panel">
      <h2>تاریخچهٔ مشاهدات</h2>
      <div className="table-scroll"><table aria-label={title}><thead><tr>
        <th scope="col">دوره</th><th scope="col">مقدار</th><th scope="col">تاریخ انتشار</th>
        <th scope="col">وضعیت</th><th scope="col">منبع</th>
        {flowRatios && <th scope="col">نسبت به ارزش معاملات روز</th>}
      </tr></thead><tbody>{[...rows].reverse().map((row) => {
        const ratio = flowRatios?.get(row.date);
        return <tr key={row.observation_id}>
          <td><bdi>{row.date}</bdi></td><td>{formatNumber(row.value)} {row.unit}</td>
          <td><bdi>{row.publish_date}</bdi></td><td><StatusBadge status={row.status}/></td>
          <td>{row.source_url ? <a href={row.source_url}>{row.source_name}</a> : row.source_name}</td>
          {flowRatios && <td>{ratio == null ? "دادهٔ قطعی کافی نیست" : <bdi>{formatNumber(ratio)}٪</bdi>}</td>}
        </tr>;
      })}</tbody></table></div>
    </section>
  </section>;
}
