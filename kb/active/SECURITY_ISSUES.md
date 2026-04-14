# VitaK Tracker — Security Audit

**Date:** 2026-04-13  
**Full Report:** `kb/active/AUDIT_REPORT.md`

## Critical Issue (Fixed)

### 🔴 Regex Global Flag Bug in Input Validation
**Status:** ✅ FIXED

The regex patterns `SQL_INJECTION_PATTERN`, `SCRIPT_INJECTION_PATTERN`, and `HTML_TAG_PATTERN` in `lib/security/input-validation.ts` used the `g` (global) flag. This caused `lastIndex` to persist across `.test()` calls, making validation stateful and inconsistent.

**Fix:** Removed `g` flag from all three patterns. Changed `/gi` → `/i` and `/g` → removed.

## Open Issues

| # | Severity | Issue | File | Status |
|---|----------|-------|------|--------|
| 1 | 🟠 High | Admin route DB lookup in middleware | `middleware.ts` | Open |
| 2 | 🟠 High | Overly aggressive SQL injection regex | `lib/security/input-validation.ts` | Open |
| 3 | 🟠 High | Hardcoded encryption salt | `lib/offline/encryption.ts` | Open |
| 4 | 🟡 Medium | Self-demotion prevention incomplete | `lib/trpc/routers/admin.ts` | Open |
| 5 | 🟡 Medium | Food search LIKE interpolation | `lib/trpc/routers/food.ts` | Open |
| 6 | 🟡 Medium | Weekly period calculation bug | `lib/trpc/routers/credit.ts` | Open |
| 7 | 🟡 Medium | Sync race condition | `lib/offline/sync-manager.ts` | Open |
| 8 | 🟡 Medium | No request size limiting | `app/api/` | Open |
| 9 | 🟢 Low | Inconsistent naming convention | All tRPC routers | Open |
| 10 | 🟢 Low | `any` casts in admin router | `lib/trpc/routers/admin.ts` | Open |