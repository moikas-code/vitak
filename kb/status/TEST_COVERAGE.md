# VitaK Tracker — Test Coverage Status

**Last Updated:** 2026-04-13  
**Status:** 🟡 Initial test suite created — 285 tests passing

## Test Suite Summary

| Test File | Tests | Status | Coverage Area |
|-----------|-------|--------|---------------|
| security/sanitize.test.ts | 28 | ✅ | Input sanitization (XSS, HTML, email, URL, username) |
| security/input-validation.test.ts | 25 | ✅ | Feedback validation, preset validation, search sanitization |
| security/rate-limit.test.ts | 14 | ✅ | Rate limiting constants and logic |
| security/headers.test.ts | 14 | ✅ | Security headers generation and application |
| security/sanitize-html.test.ts | 14 | ✅ | DOMPurify HTML sanitization |
| config/constants.test.ts | 18 | ✅ | App constants, vitamin K thresholds, color helpers |
| config/env-validation.test.ts | 6 | ✅ | Environment variable validation |
| config/config.test.ts | 11 | ✅ | Offline, rate limit, API, security configs |
| db/mappers.test.ts | 11 | ✅ | CamelCase → snake_case mapping functions |
| db/schema.test.ts | 8 | ✅ | Schema column definitions |
| types/index.test.ts | 20 | ✅ | Zod schema validation (food, meal log, credit, preset) |
| logger/logger.test.ts | 11 | ✅ | Logger creation, log levels, child loggers |
| offline/encryption.test.ts | 13 | ✅ | AES encryption, PBKDF2 key derivation, key storage |
| utils/rss-parser.test.ts | 6 | ✅ | RSS parsing, error handling, CDATA support |
| utils/cn.test.ts | 9 | ✅ | Tailwind class merging utility |
| hooks/use-debounce.test.ts | 6 | ✅ | React debounce hook |
| trpc/routers.test.ts | 12 | ✅ | Router and context exports |
| api/rate-limit.test.ts | 1 | ✅ | API rate limit module export |

## Not Yet Tested (Future Work)

- **tRPC router integration tests** — Need mocked Clerk auth + D1 database
- **Component/UI tests** — No React component tests yet
- **API route handlers** — Stripe webhook, Clerk webhook, feedback endpoint
- **Middleware auth flow** — Integration test for Clerk → role check
- **Offline sync manager** — Complex browser-dependent code
- **Token storage v2** — WebCrypto API dependent
- **E2E tests** — No Playwright/Cypress setup

## Running Tests

```bash
bun run test            # Run all tests once
bun run test:watch      # Watch mode
bun run test:coverage   # Run with coverage report
```