import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { readWorkbook } from "../src/lib/ingest/xlsx";
import { seriesId, tickerId } from "../src/lib/ingest/observation-schema";
import { compareJalaliDates } from "../src/lib/dates/jalali";
import type { Observation } from "../src/types/market";
import type { Ticker } from "../src/lib/market/json-repository";

async function publish(path: string, root: string) {
  const rows = await readWorkbook(path);
  await mkdir(root, { recursive: true });
  const lock = join(root, ".import-lock");
  await mkdir(lock);
  try {
    const partitions = new Map<string, Map<string, Observation>>();
    const incoming = new Map<string, Observation>();
    for (const row of rows) {
      const prior = incoming.get(row.observation_id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(row)) {
        throw new Error("ردیف‌های ورودی متعارض: " + row.indicator + " / " + row.date);
      }
      incoming.set(row.observation_id, row);
    }
    for (const row of incoming.values()) {
      const file = join(root, row.market === "equities" ? "equities/" + tickerId(row.entity) + ".json" : row.market + ".json");
      if (!partitions.has(file)) {
        const existing: Observation[] = await readFile(file, "utf8").then(JSON.parse).catch((error) => {
          if (error.code === "ENOENT") return [];
          throw error;
        });
        partitions.set(file, new Map(existing.map((item) => [item.observation_id, item])));
      }
      const partition = partitions.get(file)!;
      const prior = partition.get(row.observation_id);
      if (prior?.status === "قطعی" && row.status !== "قطعی") {
        throw new Error("دادهٔ قطعی با دادهٔ غیرقطعی جایگزین نمی‌شود: " + row.indicator + " / " + row.date);
      }
      if (prior && compareJalaliDates(row.publish_date, prior.publish_date) < 0) {
        throw new Error("تاریخ انتشار اصلاحیه قدیمی‌تر است: " + row.indicator + " / " + row.date);
      }
      partition.set(row.observation_id, row);
    }
    const outputs = new Map<string, string>();
    for (const [file, partition] of partitions) {
      const definitions = new Map<string, string>();
      const ordered = [...partition.values()].sort((a, b) => compareJalaliDates(a.date, b.date));
      for (const row of ordered) {
        const key = seriesId(row);
        const definition = JSON.stringify([row.unit, row.frequency]);
        if (definitions.has(key) && definitions.get(key) !== definition) {
          throw new Error("واحد یا تناوب سری ناهماهنگ است: " + row.indicator);
        }
        definitions.set(key, definition);
      }
      outputs.set(file, JSON.stringify(ordered, null, 2) + "\n");
    }
    const equities = rows.filter((row) => row.market === "equities");
    if (equities.length) {
      const file = join(root, "equities", "index.json");
      const existing: Ticker[] = await readFile(file, "utf8").then(JSON.parse).catch((error) => {
        if (error.code === "ENOENT") return [];
        throw error;
      });
      const tickers = new Map(existing.map((ticker) => [ticker.id, ticker]));
      for (const { entity } of equities) {
        const id = tickerId(entity);
        if (!tickers.has(id)) tickers.set(id, { id, entity, tradeMarkets: [] });
      }
      outputs.set(file, JSON.stringify([...tickers.values()], null, 2) + "\n");
    }
    const staged: [string, string][] = [];
    try {
      for (const [file, content] of outputs) {
        await mkdir(dirname(file), { recursive: true });
        const temp = file + "." + randomUUID() + ".tmp";
        staged.push([temp, file]);
        await writeFile(temp, content, { flag: "wx" });
      }
      for (const [temp, file] of staged) await rename(temp, file);
    } finally {
      await Promise.all(staged.map(([temp]) => rm(temp, { force: true })));
    }
    console.log(rows.length + " ردیف در " + partitions.size + " فایل منتشر شد.");
  } finally {
    await rm(lock, { force: true, recursive: true });
  }
}

const [, , workbook, output = "data/published"] = process.argv;
if (!workbook) {
  console.error("npm run import:xlsx -- workbook.xlsx [output-directory]");
  process.exitCode = 1;
} else {
  publish(workbook, output).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
