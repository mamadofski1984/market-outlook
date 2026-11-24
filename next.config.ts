import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  outputFileTracingIncludes: { "/*": ["./data/published/**/*.json"] },
};

export default config;
