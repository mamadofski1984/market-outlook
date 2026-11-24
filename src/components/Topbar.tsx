"use client";

import { AppLink as Link, demoHref } from "./AppLink";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { navigation } from "../lib/market/navigation";
import { Icon } from "./Icon";

const themes = [["light", "روشن"], ["midtone", "بینابینی"], ["dark", "تیره"]] as const;
type Theme = (typeof themes)[number][0];
const themeStorageKey = "market-outlook-theme";

const normalize = (value: string) => value.trim().toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\s‌]+/g, " ");

export function Topbar() {
  const [theme, setTheme] = useState<Theme>("light");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const router = useRouter();
  const results = navigation.filter(([href, label]) => normalize(label + " " + href).includes(normalize(query)));

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (themes.some(([id]) => id === current)) setTheme(current as Theme);
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  function selectTheme(value: Theme) {
    document.documentElement.dataset.theme = value;
    setTheme(value);
    try { localStorage.setItem(themeStorageKey, value); } catch { /* The active theme still works. */ }
  }

  function closeSearch() {
    setOpen(false);
    setQuery("");
  }

  return <header className="topbar">
    <form className="quick-search" role="search" onSubmit={(event) => {
      event.preventDefault();
      if (results[0]) {
        const href = results[0][0];
        if (process.env.NEXT_PUBLIC_PAGES_DEMO === "1") window.location.assign(demoHref(href));
        else router.push(href);
        closeSearch();
        input.current?.blur();
      }
    }} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onFocus={() => setOpen(true)} onKeyDown={(event) => {
      if (event.key === "Escape") { input.current?.focus(); setOpen(false); }
      if (event.key === "ArrowDown" && event.target === input.current) {
        event.preventDefault();
        event.currentTarget.querySelector("a")?.focus();
      }
    }}>
      <Icon name="search" />
      <input ref={input} type="search" aria-label="جست‌وجوی صفحات" aria-controls={open ? resultsId : undefined}
        placeholder="جست‌وجو یا رفتن به یک بازار…" value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} />
      <kbd dir="ltr">Ctrl K</kbd>
      {open && <div className="search-results" id={resultsId}>
        {results.length ? results.map(([href, label]) => <Link href={href} key={href} onClick={closeSearch}>
          {label}<Icon name="arrow" size={15} />
        </Link>) : <p role="status">صفحه‌ای پیدا نشد.</p>}
      </div>}
    </form>
    <div className="topbar-end">
      <div className="themes" role="group" aria-label="پوستهٔ داشبورد">
        {themes.map(([id, label]) => <button type="button" key={id} aria-pressed={theme === id}
          aria-label={label} title={label} onClick={() => selectTheme(id)}><Icon name={id} size={16} /><span>{label}</span></button>)}
      </div>
      <span className="environment"><i /> نسخهٔ آزمایشی</span>
    </div>
  </header>;
}
