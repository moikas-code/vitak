/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  RATE_LIMIT_KV: KVNamespace;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  DISCORD_FEEDBACK_WEBHOOK_URL: string;
  NEXT_PUBLIC_APP_URL: string;
}

declare module "@opennextjs/cloudflare" {
  export function getCloudflareContext(): {
    env: CloudflareEnv;
  };
}