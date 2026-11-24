import { createHash } from "node:crypto";
import { parseJalaliDate } from "../dates/jalali";
import { frequencies, markets, statuses, type Observation, type SeriesKey } from "../../types/market";

export const fields = [
  "Market", "Indicator", "Entity", "Value", "Unit", "Date", "Frequency",
  "Source", "Source_URL", "Publish_Date", "Status", "Notes",
] as const;
export type InputRow = Partial<Record<(typeof fields)[number], unknown>>;

const marketLabels: Record<string, string> = {
  "اقتصاد کلان": "macro", "کلان": "macro", "بازار بورس": "equities", "بورس": "equities",
  "بازار مسکن": "housing", "مسکن": "housing", "طلا و ارز": "gold_fx", "بورس کالا": "commodities",
  "بورس انرژی": "energy", "جریان پول": "money_flow",
};
const frequencyLabels: Record<string, string> = {
  "روزانه": "daily", "هفتگی": "weekly", "ماهانه": "monthly",
  "فصلی": "quarterly", "سالانه": "annual",
};

function label(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(field + " باید متن غیرخالی باشد");
  return value.normalize("NFC").replace(/ي/g, "ی").replace(/ك/g, "ک").trim();
}

function choice<T extends string>(values: readonly T[], value: string, field: string): T {
  const result = values.find((entry) => entry === value);
  if (!result) throw new Error(field + " نامعتبر است: " + value);
  return result;
}

export function parseObservation(row: InputRow): Observation {
  const marketInput = label(row.Market, "Market");
  const frequencyInput = label(row.Frequency, "Frequency");
  const market = choice(markets, marketLabels[marketInput] ?? marketInput, "Market");
  const indicator = label(row.Indicator, "Indicator");
  const entity = label(row.Entity, "Entity");
  const date = parseJalaliDate(row.Date);
  const publish_date = parseJalaliDate(row.Publish_Date);
  if (typeof row.Value !== "number" || !Number.isFinite(row.Value)) {
    throw new Error("Value باید یک سلول عددی متناهی باشد");
  }
  // Estimates can be published before the close of their reference period.
  const source_url = row.Source_URL == null || row.Source_URL === "" ? "" : label(row.Source_URL, "Source_URL");
  if (source_url && !["http:", "https:"].includes(new URL(source_url).protocol)) {
    throw new Error("Source_URL باید http یا https باشد");
  }
  return {
    observation_id: createHash("sha256").update(JSON.stringify([market, indicator, entity, date])).digest("hex"),
    market, indicator, entity, date, publish_date, value: row.Value,
    unit: label(row.Unit, "Unit"), source_name: label(row.Source, "Source"), source_url,
    frequency: choice(frequencies, frequencyLabels[frequencyInput] ?? frequencyInput, "Frequency"),
    status: choice(statuses, label(row.Status, "Status"), "Status"),
    notes: row.Notes == null || row.Notes === "" ? "" : label(row.Notes, "Notes"),
  };
}

export function tickerId(entity: string): string {
  return createHash("sha256").update(entity).digest("hex").slice(0, 24);
}

export function seriesId(series: SeriesKey): string {
  return JSON.stringify([series.market, series.indicator, series.entity]);
}
