"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import type { SidebarCatalog } from "../lib/market/service";
import { indicatorHref, navigation } from "../lib/market/navigation";
import { Icon } from "./Icon";

const icons = ["home", "macro", "charts", "gold", "flow", "equities", "housing", "scenarios"] as const;

export function Sidebar({ catalog }: { catalog: SidebarCatalog }) {
  const path = usePathname();
  const query = useSearchParams();
  const instance = useId();
  const drawer = useRef<HTMLDialogElement>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  function links(scope: string, close?: () => void) {
    return <>
      <Link href="/" className="brand" onClick={close}>
        <span className="brand-mark"><Icon name="logo" size={24} /></span>
        <span>چشم‌انداز بازارها<small>داشبورد بین‌بازاری</small></span>
      </Link>
      <nav className="sidebar-nav" aria-label="ناوبری اصلی">
        {navigation.map(([href, label], index) => {
          const active = path === href || (href !== "/" && path.startsWith(href + "/"));
          const entries = catalog[href] ?? [];
          const divider = index === 1 || index === 7 || undefined;
          if (!entries.length) return <Link href={href} key={href} data-divider={divider}
            aria-current={active ? "page" : undefined} onClick={close}>
            <Icon name={icons[index]} />{label}
          </Link>;

          const panelId = instance + "-" + scope + "-" + index;
          const overrideKey = path + "|" + href;
          const expanded = overrides[overrideKey] ?? active;
          const selected = path === href ? entries.find(({ indicator, entity }) => indicator === query.get("indicator") &&
            (!query.has("entity") || entity === query.get("entity"))) : undefined;
          return <div className="sidebar-group" key={href} data-divider={divider}>
            <button type="button" className="sidebar-toggle" aria-expanded={expanded}
              aria-controls={panelId} data-active={active || undefined}
              onClick={() => setOverrides((current) => ({ ...current, [overrideKey]: !expanded }))}>
              <Icon name={icons[index]} /><span>{label}</span>
              <svg className="sidebar-chevron" aria-hidden="true" width="14" height="14" viewBox="0 0 16 16">
                <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <ul className="sidebar-indicators" id={panelId} hidden={!expanded}>
              <li><Link href={href} onClick={close} aria-current={path === href && !query.size ? "page" : undefined}>نمای کلی بازار</Link></li>
              {entries.map((entry) => <li key={JSON.stringify([entry.indicator, entry.entity])}>
                <Link href={indicatorHref(href, entry.indicator, entry.entity)} onClick={close}
                  aria-current={entry === selected ? "page" : undefined}>
                  <span>{entry.indicator}</span><small>{entry.entity}</small>
                </Link>
              </li>)}
            </ul>
          </div>;
        })}
      </nav>
    </>;
  }

  return <>
    <aside className="sidebar">{links("desktop")}</aside>
    <button type="button" className="menu-trigger" aria-label="باز کردن منو" aria-haspopup="dialog"
      onClick={() => drawer.current?.showModal()}><Icon name="menu" size={22} /></button>
    <dialog className="drawer" ref={drawer} aria-label="منوی داشبورد" onClick={(event) => {
      if (event.target === event.currentTarget) drawer.current?.close();
    }}>
      <div className="drawer-content">
        <button className="menu-close" type="button" aria-label="بستن منو" onClick={() => drawer.current?.close()}>
          <Icon name="close" />
        </button>
        {links("mobile", () => drawer.current?.close())}
      </div>
    </dialog>
  </>;
}
