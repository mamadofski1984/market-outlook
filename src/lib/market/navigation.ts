export const navigation = [
  ["/", "صفحه اصلی", "⌂"],
  ["/markets/macro", "کلان", "◫"],
  ["/markets/data-charts", "داده‌ها و نمودارها", "▥"],
  ["/markets/gold-fx", "طلا، ارز و کامودیتی", "◇"],
  ["/markets/money-flow", "جریان پول", "⇄"],
  ["/markets/equities", "سهام، کالا و انرژی", "▤"],
  ["/markets/housing", "مسکن", "⌑"],
  ["/markets/scenarios", "سناریوها", "⋯"],
] as const;

export function indicatorHref(path: string, indicator: string, entity: string, trade?: string): string {
  const query = new URLSearchParams({ indicator, entity });
  if (trade) query.set("trade", trade);
  return path + "?" + query;
}
