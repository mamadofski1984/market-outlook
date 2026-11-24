import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tickerId } from "../ingest/observation-schema";
import type { Market, Observation, ObservationRepository } from "../../types/market";
import { compareJalaliDates } from "../dates/jalali";

const root = join(process.cwd(), "data", "published");

async function read<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(join(root, file), "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
}

export interface Ticker {
  id: string;
  entity: string;
  tradeMarkets: readonly ("commodities" | "energy")[];
}

export const listTickers = () => read<readonly Ticker[]>("equities/index.json", []);

export async function readEquitySeries(): Promise<readonly Observation[]> {
  const files = await readdir(join(root, "equities")).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  });
  const partitions = await Promise.all(files.filter((file) => /^[0-9a-f]{24}\.json$/.test(file))
    .map((file) => read<Observation[]>("equities/" + file, [])));
  return partitions.flat();
}

export function readMarket(market: Market, entity?: string): Promise<readonly Observation[]> {
  if (market === "equities" && !entity) return Promise.resolve([]);
  const file = market === "equities" ? "equities/" + tickerId(entity!) + ".json" : market + ".json";
  return read(file, []);
}

export const jsonRepository: ObservationRepository = {
  async list(query) {
    const rows = await readMarket(query.market, query.entity);
    return rows.filter((row) => row.indicator === query.indicator && row.entity === query.entity &&
      (!query.from || row.date >= query.from) && (!query.to || row.date <= query.to))
      .sort((a, b) => compareJalaliDates(a.date, b.date));
  },
};
