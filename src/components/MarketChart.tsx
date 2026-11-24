"use client";

import { useState } from "react";
import type { JalaliDate, ObservationStatus } from "../types/market";
import { jalaliDayNumber, parseJalaliDate, subtractJalaliMonths } from "../lib/dates/jalali";
import { percentageGrowth } from "../lib/market/calculations";
import { formatNumber } from "./StatusCard";
import { Icon } from "./Icon";

type Point = { date: JalaliDate; value: number; status?: ObservationStatus; baselineDate?: JalaliDate };
type ChartSeries = { label: string; points: readonly Point[] };
const preciseNumber = new Intl.NumberFormat("fa-IR", { maximumSignificantDigits: 17 });
const width = 900;
const left = 90;
const right = 856;
const top = 24;
const bottom = 214;

const color = (index: number) => "var(--chart-" + (index % 6 + 1) + ")";

const timeframes = [[1, "۱ ماهه"], [3, "۳ ماهه"], [6, "۶ ماهه"], [12, "۱ ساله"], [36, "۳ ساله"], ["custom", "بازه دلخواه"]] as const;
type Timeframe = (typeof timeframes)[number][0];
type DateRange = { start: JalaliDate; end: JalaliDate };

function formatGrowth(value: number): string {
  const magnitude = formatNumber(Math.abs(value));
  const sign = magnitude === formatNumber(0) ? "" : value < 0 ? "-" : "+";
  return sign + magnitude + "٪";
}

export function MarketChart({ title, series: source, note, mode = "value" }: {
  title: string; series: readonly ChartSeries[]; note?: string; mode?: "value" | "growth" | "history";
}) {
  const growth = mode === "growth";
  const hasTimeframes = mode !== "value";
  const [timeframe, setTimeframe] = useState<Timeframe>(3);
  const [custom, setCustom] = useState<DateRange>();
  const [dateError, setDateError] = useState("");
  const availableDates = hasTimeframes ? source.flatMap(({ points }) => points
    .filter(({ status, value }) => (!growth || status === "قطعی") && Number.isFinite(value)).map(({ date }) => date)).sort() : [];
  const latest = availableDates.at(-1);
  const preset = latest && timeframe !== "custom" ? { start: subtractJalaliMonths(latest, timeframe), end: latest } : undefined;
  const range = timeframe === "custom" ? custom : preset;
  const series: readonly ChartSeries[] = hasTimeframes ? source.map(({ label, points }) => {
    if (!range) return { label, points: [] };
    if (growth) return { label, points: percentageGrowth(points.flatMap(({ date, value, status }) =>
      status === "قطعی" ? [{ date, value, status }] : []), range.start, range.end) };
    const inRange = points.filter(({ date, value }) => date >= range.start && date <= range.end && Number.isFinite(value));
    return { label, points: inRange };
  }) : source;
  const [hidden, setHidden] = useState<readonly string[]>([]);
  const [selected, setSelected] = useState<JalaliDate>();
  const visible = series.filter(({ label }) => !hidden.includes(label));
  const points = visible.flatMap((line) => line.points);
  const dates = [...new Set(points.map(({ date }) => date))].sort();
  const first = range?.start ?? dates[0];
  const earliest = first ? jalaliDayNumber(first) : 0;
  const last = range?.end ?? dates.at(-1);
  const elapsed = last ? jalaliDayNumber(last) - earliest : 0;
  let low = growth ? 0 : Infinity;
  let high = growth ? 0 : -Infinity;
  for (const { value } of points) {
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  if (growth && low === high) { low = -1; high = 1; }
  const span = high - low;
  const x = (date: JalaliDate) => elapsed ? left + (jalaliDayNumber(date) - earliest) / elapsed * (right - left) : (left + right) / 2;
  const y = (value: number) => span > 0 ? bottom - ((value - low) / span) * (bottom - top) : (top + bottom) / 2;
  const tickDates = hasTimeframes && range ? [...new Set([range.start, ...dates, range.end])] : dates;
  const lastTick = tickDates.at(-1);
  const ticks: JalaliDate[] = [];
  for (const date of tickDates) {
    const previous = ticks.at(-1);
    if (date === lastTick || !previous || (x(date) - x(previous) >= 150 && x(lastTick!) - x(date) >= 105)) ticks.push(date);
  }
  const focused = selected && dates.includes(selected) ? selected : undefined;

  function moveTo(position: number) {
    const nearest = dates.reduce<JalaliDate | undefined>((best, date) =>
      !best || Math.abs(x(date) - position) < Math.abs(x(best) - position) ? date : best, undefined);
    setSelected(nearest);
  }

  return <section className="panel chart">
    <div className="panel-heading"><span className="panel-icon"><Icon name="charts" /></span>
      <div><h2>{title}</h2>{note && <p>{note}</p>}</div>
    </div>
    {hasTimeframes && latest && <div className="chart-controls">
      <div className="timeframes" role="group" aria-label={"بازه زمانی " + title}>
        {timeframes.map(([value, label]) => <button type="button" key={value} aria-pressed={timeframe === value}
          onClick={() => {
            if (value === "custom" && !custom && range) setCustom(range);
            setTimeframe(value);
            setSelected(undefined);
            setDateError("");
          }}>{label}</button>)}
      </div>
      {timeframe === "custom" && <form className="chart-date-form" onSubmit={(event) => {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        try {
          const start = parseJalaliDate(String(fields.get("start") ?? "").trim());
          const end = parseJalaliDate(String(fields.get("end") ?? "").trim());
          if (start >= end) throw new Error("تاریخ پایان باید بعد از تاریخ شروع باشد.");
          setCustom({ start, end });
          setSelected(undefined);
          setDateError("");
        } catch (error) {
          setDateError(error instanceof Error ? error.message : "بازهٔ تاریخ نامعتبر است.");
        }
      }}>
        <label>از تاریخ<input name="start" dir="ltr" placeholder="YYYY/MM/DD" defaultValue={range?.start} required maxLength={10} /></label>
        <label>تا تاریخ<input name="end" dir="ltr" placeholder="YYYY/MM/DD" defaultValue={range?.end} required maxLength={10} /></label>
        <button type="submit">اعمال بازه</button>
        {dateError && <p role="alert">{dateError}</p>}
      </form>}
      {range && <p className="active-range"><bdi>{range.start}</bdi> تا <bdi>{range.end}</bdi></p>}
    </div>}
    {series.length > 0 && <div className="legend" role="group" aria-label="سری‌های نمودار">
      {series.map(({ label, points }, index) => <button key={label} type="button" disabled={!points.length}
        title={growth && !points.length ? "مشاهدات قطعی کافی برای این بازه نیست" : undefined}
        aria-pressed={!hidden.includes(label) && points.length > 0} onClick={() => {
          setHidden((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
          setSelected(undefined);
        }}><i style={{ background: color(index) }} />{label}</button>)}
    </div>}
    {points.length ? <div className="chart-scroll">
      <div className="chart-stage" dir="ltr" tabIndex={0} aria-label={title + "، برای حرکت بین تاریخ‌ها از کلیدهای جهت‌دار استفاده کنید"}
        onPointerLeave={() => setSelected(undefined)}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setSelected(undefined); return; }
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          const index = focused ? dates.indexOf(focused) + (event.key === "ArrowRight" ? 1 : -1) : 0;
          setSelected(dates[Math.max(0, Math.min(index, dates.length - 1))]);
        }}>
        <svg viewBox="0 0 900 255" role="img" aria-label={title}
          onPointerMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            moveTo((event.clientX - rect.left) / rect.width * width);
          }}
          onPointerDown={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            moveTo((event.clientX - rect.left) / rect.width * width);
          }}>
          {[0, 1, 2, 3, 4].map((step) => {
            const tick = high - span * step / 4;
            if (growth && Math.abs(tick) < span / 9) return null;
            const py = top + step * (bottom - top) / 4;
            return <g key={step}>
              <line className="gridline" x1={left} x2={right} y1={py} y2={py} />
              {(span > 0 || step === 2) && <text x={left - 11} y={py + 4} textAnchor="end">{growth ? formatGrowth(tick) : formatNumber(tick)}</text>}
            </g>;
          })}
          {growth && <g>
            <line className="zero-reference" x1={left} x2={right} y1={y(0)} y2={y(0)} />
            <text x={left - 11} y={y(0) + 4} textAnchor="end">{formatGrowth(0)}</text>
          </g>}
          {ticks.map((date) => <text x={x(date)} y="241" textAnchor="middle" key={date}>{date}</text>)}
          {focused && <line className="crosshair" x1={x(focused)} x2={x(focused)} y1={top} y2={bottom} />}
          {series.map(({ label, points }, index) => hidden.includes(label) ? null : <g key={label} stroke={color(index)}>
            {points.slice(1).map((point, i) => {
              const prior = points[i];
              const provisional = [point.status, prior.status].some((status) => status && status !== "قطعی");
              return <line key={point.date} x1={x(prior.date)} y1={y(prior.value)} x2={x(point.date)} y2={y(point.value)}
                strokeWidth="2.6" strokeLinecap="round" strokeDasharray={provisional ? "5 5" : undefined} />;
            })}
            {points.map((point) => <circle key={point.date} cx={x(point.date)} cy={y(point.value)}
              r={point.date === focused ? 5 : 3} strokeWidth="1.8"
              fill={point.status && point.status !== "قطعی" ? "var(--surface)" : color(index)} />)}
          </g>)}
        </svg>
        {focused && <div className="chart-tooltip" dir="rtl" style={{ left: x(focused) / width * 100 + "%",
          transform: x(focused) > width / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}>
          <time dir="ltr">{focused}</time>
          <ul>{series.map(({ label, points }, index) => {
            if (hidden.includes(label)) return null;
            const point = points.find(({ date }) => date === focused);
            return <li key={label}><i style={{ background: color(index) }} /><span>{label}
              {point?.status && <small>{point.status}</small>}
              {point?.baselineDate && <small>مبنا <bdi>{point.baselineDate}</bdi></small>}</span>
              <b>{point ? growth ? formatGrowth(point.value) : preciseNumber.format(point.value) : "—"}</b></li>;
          })}</ul>
        </div>}
      </div>
    </div> : <p className="chart-empty">{series.some(({ points }) => points.length) ? "یک سری را برای نمایش انتخاب کنید."
      : growth ? "برای نمایش رشد در این بازه، دست‌کم دو مشاهدهٔ قطعی و مقدار مبنای غیرصفر لازم است."
      : hasTimeframes && range ? "در این بازه مشاهده‌ای برای نمایش وجود ندارد."
      : "داده‌ای برای نمایش وجود ندارد."}</p>}
  </section>;
}
