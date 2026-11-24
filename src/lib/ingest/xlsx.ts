import ExcelJS from "exceljs";
import { fields, parseObservation, type InputRow } from "./observation-schema";
import type { Observation } from "../../types/market";

export async function readWorkbook(path: string): Promise<Observation[]> {
  if (!/\.xlsx$/i.test(path)) throw new Error("فایل باید پسوند xlsx داشته باشد");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.getWorksheet("داده‌ها") ?? workbook.worksheets[0];
  if (!sheet) throw new Error("برگهٔ داده پیدا نشد");
  const header = (row: number) => fields.every((field, index) => {
    const text = sheet.getRow(row).getCell(index + 1).text.trim();
    return text === field || text.endsWith("(" + field + ")");
  });
  const template = header(4);
  if (!template && !header(1)) throw new Error("سرستون‌های قالب ۱۲ ستونی معتبر نیست");
  const result: Observation[] = [];
  const errors: string[] = [];
  sheet.eachRow((row, number) => {
    if (number < (template ? 6 : 2)) return;
    try {
      const input: InputRow = {};
      fields.forEach((field, index) => {
        const value = row.getCell(index + 1).value;
        if (value && typeof value === "object" && "richText" in value) {
          input[field] = value.richText.map(({ text }) => text).join("");
        } else if (field === "Source_URL" && value && typeof value === "object" && "hyperlink" in value) {
          input[field] = value.hyperlink;
        } else {
          input[field] = value;
        }
      });
      if (Object.values(input).every((value) => value == null || value === "")) return;
      result.push(parseObservation(input));
    } catch (error) {
      errors.push("ردیف " + number + ": " + (error instanceof Error ? error.message : String(error)));
    }
  });
  if (errors.length) throw new Error(errors.join("\n"));
  if (!result.length) throw new Error("ردیف داده‌ای برای انتشار وجود ندارد");
  return result;
}
