import { Icon } from "../../components/Icon";

type NewsItem = { headline: string; approval: "admin" | "ai" };

export function EconomicNewsFeed({ items }: { items: readonly NewsItem[] }) {
  return <section className="panel">
    <div className="panel-heading"><span className="panel-icon"><Icon name="news" /></span><h2>اخبار اقتصادی</h2></div>
    {items.length ? <ul className="news">{items.map(({ headline, approval }) => <li key={headline}>
      <span>{headline}</span><span className={"badge " + (approval === "admin" ? "official" : "pending")}>{approval === "admin" ? "تایید مدیر" : "فوری هوش مصنوعی"}</span>
    </li>)}</ul> : <p>هنوز خبری منتشر نشده است.</p>}
  </section>;
}
