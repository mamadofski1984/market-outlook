import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export function demoHref(href: string) {
  const [path, query] = href.split("?", 2);
  return "/market-outlook" + (path.endsWith("/") ? path : path + "/") + (query ? "?" + query : "");
}

export function AppLink({ href, ...props }: ComponentPropsWithoutRef<"a"> & { href: string }) {
  if (process.env.NEXT_PUBLIC_PAGES_DEMO === "1") return <a href={demoHref(href)} {...props} />;
  return <Link href={href} {...props} />;
}
