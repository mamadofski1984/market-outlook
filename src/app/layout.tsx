import { Suspense } from "react";
import { getSidebarCatalog } from "../lib/market/service";
import type { Metadata } from "next";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import "./globals.css";

export const metadata: Metadata = { title: "چشم‌انداز بازارها", description: "داشبورد فارسی پایش بین‌بازاری" };

const initializeTheme = `try {
  var theme = localStorage.getItem("market-outlook-theme");
  if (theme === "light" || theme === "midtone" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
  }
} catch {}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getSidebarCatalog();
  return <html lang="fa" dir="rtl" data-theme="light" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{ __html: initializeTheme }} /></head>
    <body><div className="shell">
      <Suspense><Sidebar catalog={catalog} /></Suspense>
      <div className="workspace">
        <Topbar />
        <main>{children}</main>
      </div>
    </div></body>
  </html>;
}
