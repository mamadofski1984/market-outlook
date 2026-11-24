import { isValidJalaaliDate, j2d, jalaaliMonthLength } from "jalaali-js";
import type { JalaliDate } from "../../types/market";

export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => String(digit.charCodeAt(0) & 15));
}

export function parseJalaliDate(value: unknown): JalaliDate {
  if (typeof value !== "string") throw new Error("تاریخ باید متن باشد");
  const normalized = normalizeDigits(value);
  if (normalized.length !== 10 || !/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/.test(normalized)) {
    throw new Error("قالب تاریخ باید YYYY/MM/DD باشد");
  }
  const [year, month, day] = normalized.split("/").map(Number);
  if (year < 1 || !isValidJalaaliDate(year, month, day)) {
    throw new Error("تاریخ جلالی نامعتبر است");
  }
  return normalized as JalaliDate;
}

export function compareJalaliDates(a: JalaliDate, b: JalaliDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function jalaliDayNumber(date: JalaliDate): number {
  const [year, month, day] = date.split("/").map(Number);
  return j2d(year, month, day);
}

export function subtractJalaliMonths(date: JalaliDate, months: number): JalaliDate {
  const [year, month, day] = date.split("/").map(Number);
  const totalMonths = Math.max(12, year * 12 + month - 1 - months);
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths % 12 + 1;
  const targetDay = Math.min(day, jalaaliMonthLength(targetYear, targetMonth));
  return parseJalaliDate([String(targetYear).padStart(4, "0"), String(targetMonth).padStart(2, "0"),
    String(targetDay).padStart(2, "0")].join("/"));
}
