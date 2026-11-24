import type { JalaliDate, Observation, OfficialObservation } from "../../types/market";

export function isOfficial(row: Observation): row is OfficialObservation {
  return row.status === "قطعی" && Number.isFinite(row.value);
}

type GrowthInput = Pick<Observation, "date" | "value" | "status">;

export function percentageGrowth(rows: readonly GrowthInput[], start: JalaliDate, end: JalaliDate) {
  if (start >= end) return [];
  const official = rows.filter((row) => row.status === "قطعی" && Number.isFinite(row.value))
    .sort((a, b) => a.date.localeCompare(b.date));
  const base = official.findLast((row) => row.date <= start)
    ?? official.find((row) => row.date <= end && row.date >= start);
  if (!base || base.value === 0) return [];

  const later = official.filter((row) => row.date > base.date && row.date >= start && row.date <= end)
    .flatMap((row) => {
      const value = (row.value / base.value - 1) * 100;
      return Number.isFinite(value) ? [{ date: row.date, value }] : [];
    });
  if (!later.length) return [];

  // A prior observation supplies the denominator, but its original date stays visible in the tooltip.
  return [{ date: base.date < start ? start : base.date, value: 0, baselineDate: base.date }, ...later];
}

export function flowShare(flow: Observation, depth: Observation): number | null {
  if (!isOfficial(flow) || !isOfficial(depth) || flow.date !== depth.date || flow.unit !== depth.unit ||
      flow.market !== depth.market || flow.entity !== depth.entity ||
      flow.frequency !== "daily" || depth.frequency !== "daily" || depth.value <= 0) return null;
  const percent = (flow.value / depth.value) * 100;
  return Number.isFinite(percent) ? percent : null;
}
