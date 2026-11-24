import { MarketChart } from "../components/MarketChart";
import { StatusCard, formatNumber } from "../components/StatusCard";
import { Icon } from "../components/Icon";
import { DailyMarketBrief } from "../features/daily-market-brief/DailyMarketBrief";
import { EconomicNewsFeed } from "../features/economic-news/EconomicNewsFeed";
import { getOverview } from "../lib/market/service";

export const dynamic = "force-dynamic";

type ComparisonGroup = Pick<Awaited<ReturnType<typeof getOverview>>, "cards" | "comparison">;

function MarketComparison({ cards, comparison, title }: ComparisonGroup & { title: string }) {
  return <>
    <div className="kpis">{cards.map(({ key, latest }) => {
      const points = comparison.find(({ label }) => label === key.indicator)?.points;
      const current = points?.at(-1);
      const previous = points?.at(-2);
      const trend = latest?.status === "قطعی" && current && previous && current.date === latest.date
        ? current.value > previous.value ? "up" : current.value < previous.value ? "down" : "flat"
        : undefined;
      return <StatusCard key={key.indicator} label={key.indicator} observation={latest} trend={trend} />;
    })}</div>
    <MarketChart title={title} series={comparison} mode="growth"
      note="رشد هر سری نسبت به مبنای همان بازه، فقط با مشاهدات قطعی" />
  </>;
}

export default async function Home() {
  const { global, macroCards, ...domestic } = await getOverview();
  const cards = [...domestic.cards, ...global.cards, ...macroCards];
  const official = cards.filter(({ latest }) => latest?.status === "قطعی").length;
  const estimates = cards.filter(({ latest }) => latest?.status === "تخمینی").length;
  const latestDate = cards.flatMap(({ latest }) => latest ? [latest.date] : []).sort().at(-1);
  return <div className="stack dashboard">
    <section className="hero">
      <div className="hero-content">
        <span className="hero-context"><Icon name="logo" size={17} /> نمای کلی بازارها</span>
        <h1>به پلتفرم هوشمند<br className="hero-break" /> چشم‌انداز بازارها خوش آمدید</h1>
        <p>روند بازارهای ایران و جهان را در یک نگاه دنبال کنید.</p>
        <div className="actions"><a href="#text-guide"><Icon name="book" />راهنمای متنی</a><a href="#video-guide"><Icon name="play" />راهنمای ویدیویی</a></div>
      </div>
      <dl className="pulse" aria-label="نبض بازار">
        <div><dt>شاخص رسمی</dt><dd>{formatNumber(official)}</dd></div>
        <div><dt>برآورد هوش مصنوعی</dt><dd>{formatNumber(estimates)}</dd></div>
        {latestDate && <div><dt>آخرین دورهٔ مشاهده</dt><dd><bdi>{latestDate}</bdi></dd></div>}
      </dl>
    </section>
    <section className="stack market-section" aria-labelledby="domestic-title">
      <header className="market-banner market-banner-domestic">
        <h2 id="domestic-title">بازارهای داخلی</h2>
        <p>بورس، اخزا، شاخص قیمت مصرف‌کننده، طلا، ارز و مسکن</p>
        <span className="badge pending">دادهٔ نمونهٔ ساختگی</span>
      </header>
      <MarketComparison {...domestic} title="مقایسهٔ روند بازارهای داخلی" />
      <p className="market-note">در دادهٔ نمونه، میانگین نرخ اخزا به‌صورت شاخص با پایهٔ ۱۰۰ در اردیبهشت ۱۴۰۵ نمایش داده شده است.</p>
    </section>
    <section className="stack market-section" aria-labelledby="global-title">
      <header className="market-banner market-banner-global">
        <h2 id="global-title">بازارهای جهانی</h2>
        <p>کالاهای پایه و داده‌های مرجع اقتصاد آمریکا</p>
        <span className="badge pending">دادهٔ نمونهٔ ساختگی</span>
      </header>
      <MarketComparison {...global} title="مقایسهٔ روند کالاهای جهانی" />
      <section className="stack macro-strip" aria-labelledby="global-macro-title">
        <h3 id="global-macro-title">شاخص‌های مرجع اقتصاد آمریکا</h3>
        <div className="kpis kpis-reference">{macroCards.map(({ key, latest }) =>
          <StatusCard key={key.indicator} label={key.indicator} observation={latest} />
        )}</div>
      </section>
    </section>
    <div className="two-columns"><DailyMarketBrief /><EconomicNewsFeed items={[
      { headline: "نمونهٔ ساختگی: گزارش ماهانهٔ شاخص قیمت منتشر شد", approval: "admin" },
      { headline: "نمونهٔ ساختگی: گزارش معاملات صندوق‌های طلا منتشر شد", approval: "ai" },
    ]} /></div>
    <div className="two-columns"><section className="panel guide" id="text-guide"><h2>راهنمای متنی</h2><p>از منوی سمت راست یک بازار را انتخاب کنید. در جدول هر بازار می‌توانید واحد، تاریخ انتشار و وضعیت هر مشاهده را ببینید.</p></section>
      <section className="panel guide" id="video-guide"><h2>راهنمای ویدیویی</h2><p>ویدیوی راهنما هنوز منتشر نشده است.</p></section></div>
  </div>;
}
