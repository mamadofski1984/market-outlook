import type { Observation } from "../../types/market";

export function groupSeries(rows: readonly Observation[]) {
  const groups = new Map<string, Observation[]>();
  for (const row of rows) {
    const key = JSON.stringify([row.market, row.indicator, row.entity]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return [...groups.values()].map((group) => group.sort((a, b) => a.date.localeCompare(b.date)));
}
