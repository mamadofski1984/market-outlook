import type { Observation, ObservationStatus } from "../types/market";

const formatter = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 });
export const formatNumber = (value: number) => formatter.format(value);

export function StatusBadge({ status }: { status: ObservationStatus }) {
  const labels = { "قطعی": "رسمی", "تخمینی": "برآورد هوش مصنوعی", "تأییدنشده": "تأییدنشده" };
  return <span className={"badge " + (status === "قطعی" ? "official" : status === "تخمینی" ? "pending" : "unverified")}>{labels[status]}</span>;
}

export function StatusCard({ label, observation, trend }: { label: string; observation?: Observation; trend?: "up" | "down" | "flat" }) {
  return <article className="panel kpi">
    <div className="kpi-header"><h3>{label}</h3>{trend && <span className={"trend " + trend}
      aria-label={trend === "up" ? "افزایش نسبت به مشاهدهٔ قطعی قبل" : trend === "down" ? "کاهش نسبت به مشاهدهٔ قطعی قبل" : "بدون تغییر"}>{trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}</span>}</div>
    {observation ? <>
      <div className="kpi-number"><bdi>{formatNumber(observation.value)}</bdi> <small>{observation.unit}</small></div>
      <footer><StatusBadge status={observation.status} /><time dir="ltr">{observation.date}</time></footer>
    </> : <p>داده در دسترس نیست</p>}
  </article>;
}
