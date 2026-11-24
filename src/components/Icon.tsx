const paths = {
  logo: "M3 17l5-5 4 3 8-9m-5 0h5v5",
  home: "m3 10 9-7 9 7v10H3z M9 20v-6h6v6",
  macro: "M3 20h18M6 17v-4m4 4V9m4 8v-6m4 6V5",
  charts: "M4 4v16h16M7 14l4-5 4 3 5-6",
  gold: "m12 3 9 6-9 12L3 9z M3 9h18M9 9l3 12 3-12",
  flow: "M3 8h17m-4-4 4 4-4 4m5 4H4m4-4-4 4 4 4",
  equities: "M4 20h16M7 4v13m5-9v9m5-14v14",
  housing: "M4 20h16M6 20V5h8v15m0-10h4v10M9 9h2m-2 4h2",
  scenarios: "M5 4v16h14M8 15h3l4-8h4m-8 8h3l3 3h2",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zm5-2 5 5",
  light: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-5v2m0 14v2M3 12h2m14 0h2M6 6l1 1m10 10 1 1M6 18l1-1M17 7l1-1",
  midtone: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 0v18",
  dark: "M20 15a8 8 0 0 1-11-11 8.5 8.5 0 1 0 11 11z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M18 6 6 18",
  book: "M3 5h6l3 2 3-2h6v13h-6l-3 2-3-2H3zm9 2v13",
  play: "m9 5 11 7-11 7z",
  arrow: "M19 12H5m6-6-6 6 6 6",
  news: "M4 5h16v14H4zm4 4h8m-8 4h8m-8 3h4",
} as const;

export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    <path d={paths[name]} />
  </svg>;
}
