import type { NextConfig } from "next";

const pagesDemo = process.env.GITHUB_PAGES_EXPORT === "1";

const config: NextConfig = {
  agentRules: false,
  env: { NEXT_PUBLIC_PAGES_DEMO: pagesDemo ? "1" : "0" },
  ...(pagesDemo ? {
    output: "export",
    basePath: "/market-outlook",
    trailingSlash: true,
  } : {
    outputFileTracingIncludes: { "/*": ["./data/published/**/*.json"] },
  }),
};

export default config;
