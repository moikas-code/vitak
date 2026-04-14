#!/bin/bash
# VitaK Production Secrets Setup
# Run each command — it will prompt you to paste the value

echo "═══════════════════════════════════════════════════════════"
echo "  VITAK — Set Cloudflare Production Secrets"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Get your Clerk keys from: https://dashboard.clerk.com"
echo "  API Keys → Copy pk_test_... and sk_test_..."
echo "  Webhooks → Copy signing secret (whsec_...)"
echo "  JWT Template → Copy the public key"
echo ""
echo "═══ REQUIRED ══════════════════════════════════════════════"
echo ""

# Clerk — Authentication (REQUIRED)
echo "1. Clerk Publishable Key (starts with pk_test_ or pk_live_):"
wrangler secret put NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

echo ""
echo "2. Clerk Secret Key (starts with sk_test_ or sk_live_):"
wrangler secret put CLERK_SECRET_KEY

echo ""
echo "3. Clerk Webhook Secret (starts with whsec_):"
wrangler secret put CLERK_WEBHOOK_SECRET

echo ""
echo "4. Clerk JWT Key (public key for Bearer token verification):"
wrangler secret put CLERK_JWT_KEY

echo ""
echo "5. App URL (e.g., https://vitaktracker.com or https://vitak.your-domain.workers.dev):"
wrangler secret put NEXT_PUBLIC_APP_URL

echo ""
echo "═══ OPTIONAL ══════════════════════════════════════════════"
echo ""
echo "6. Stripe Publishable Key (only if accepting donations):"
wrangler secret put NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

echo ""
echo "7. Stripe Secret Key (only if accepting donations):"
wrangler secret put STRIPE_SECRET_KEY

echo ""
echo "8. Stripe Webhook Secret (only if accepting donations):"
wrangler secret put STRIPE_WEBHOOK_SECRET

echo ""
echo "9. Discord Webhook URL (only if using feedback feature):"
wrangler secret put DISCORD_FEEDBACK_WEBHOOK_URL

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Secrets configured!"
echo ""
echo "  Next steps:"
echo "    bun run build:cf        # Build for Cloudflare"
echo "    bun run deploy          # Deploy to Cloudflare"
echo "═══════════════════════════════════════════════════════════"