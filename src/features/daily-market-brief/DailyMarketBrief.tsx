import { Icon } from "../../components/Icon";

export function DailyMarketBrief() {
  return <section className="panel">
    <div className="panel-heading"><span className="panel-icon"><Icon name="logo" /></span><h2>خلاصهٔ روز بازار</h2></div>
    <p className="brief-copy">خلاصهٔ روزانه پس از انتشار گزارش بازار در این بخش نمایش داده می‌شود.</p>
  </section>;
}
