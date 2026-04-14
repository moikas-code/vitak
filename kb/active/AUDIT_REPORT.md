# VitaK Tracker — Security & Code Quality Audit

**Date:** 2026-04-13  
**Auditor:** Shalom 🐉  
**Scope:** Full codebase security and quality review  

---

## Executive Summary

VitaK Tracker is a Next.js 15 PWA for Vitamin K intake management. The audit found **9 issues** ranging from a critical regex bug to medium-severity security concerns.

---

## Critical Findings

### 🔴 CRITICAL: Regex Global Flag Bug in Input Validation
**File:** `lib/security/input-validation.ts`  
**Lines:** 7-10 (SQL_INJECTION_PATTERN, SCRIPT_INJECTION_PATTERN, HTML_TAG_PATTERN)  
**Severity:** Critical  

**Issue:** The `SQL_INJECTION_PATTERN`, `SCRIPT_INJECTION_PATTERN`, and `HTML_TAG_PATTERN` regexes used the `g` (global) flag. This causes `lastIndex` to persist across `.test()` calls, making validation **inconsistent** — the same input may pass or fail validation depending on previous calls.

**Impact:** An attacker could craft a malicious input that passes validation if the regex was recently used to match something else. This directly affects `validateFeedback()`, `validatePresetName()`, and the Zod schemas `feedbackSchema` and `mealPresetSchema`.

**Remediation:** ✅ **FIXED** — Removed the `g` flag from all three regex constants. Changed `/gi` → `/i` and `/g` → no flags (line-level matching doesn't need global).

---

## High Severity Findings

### 🟠 HIGH: Admin Route Protection Depends on Database Lookup in Middleware
**File:** `middleware.ts`  
**Severity:** High  

**Issue:** The middleware performs a database query (`getDb()`) on every admin route request to check the user's role. This:
1. Creates a DB round-trip on every admin page load
2. Has no caching — repeated DB hits
3. If the DB is slow/unavailable, all admin pages become inaccessible

**Remediation:** Cache the user role in Clerk session claims or a short-lived KV cache. Avoid DB queries in middleware.

---

### 🟠 HIGH: SQL Injection Pattern is Overly Aggressive
**File:** `lib/security/input-validation.ts`  
**Severity:** High  

**Issue:** The `SQL_INJECTION_PATTERN` matches common English words like "select", "set", "create", "table", "update" — making it impossible to submit legitimate feedback containing phrases like "I want to select more foods" or "create a new meal".

**Remediation:** Replace regex-based SQL injection detection with tRPC's Zod validation (already in place). The regex pattern creates false positives and provides minimal security benefit since:
- tRPC validates all inputs with Zod schemas
- Drizzle ORM uses parameterized queries
- D1/SQLite doesn't support multi-statement execution

---

### 🟠 HIGH: Encryption Key Hardcoded Salt
**File:** `lib/offline/encryption.ts`, line in `generate_encryption_key()`  
**Severity:** High  

**Issue:** The encryption salt defaults to `'vitak-tracker-salt'` when `NEXT_PUBLIC_ENCRYPTION_SALT` isn't set. This:
1. Is a client-side constant visible in the source code
2. Is the same for all users
3. Weakens PBKDF2 key derivation significantly

**Remediation:** Generate a unique salt per user and store it in IndexedDB alongside encrypted data. Remove the hardcoded default.

---

## Medium Severity Findings

### 🟡 MEDIUM: Self-Demotion Prevention Incomplete
**File:** `lib/trpc/routers/admin.ts` (update_user_role mutation)  
**Severity:** Medium  

**Issue:** Only prevents self-demotion (`user_id === ctx.session.userId && role !== 'admin'`). Doesn't prevent:
1. The last admin from being demoted by another admin
2. Role escalation from user to admin (should require additional verification)

**Remediation:** Add a check that at least one admin remains after role changes. Consider requiring a separate admin-sessions for role changes.

---

### 🟡 MEDIUM: Missing Input Validation for Food Search LIKE Pattern
**File:** `lib/trpc/routers/food.ts` (search query)  
**Severity:** Medium  

**Issue:** The search query uses `like(foods.name, \`%${input.query}%\`)` with input transformed via `.replace(/[%_\\]/g, "\\$&")`. While special chars are escaped, the `like()` function with string interpolation is fragile. The Zod transform does the escaping, but if the transform is bypassed, SQL injection could occur.

**Remediation:** Use parameterized queries instead of string interpolation for LIKE patterns, or ensure the Zod transform is always applied.

---

### 🟡 MEDIUM: Credit Period Calculation Bug for Weekly
**File:** `lib/trpc/routers/credit.ts` (get_period_dates function)  
**Severity:** Medium  

**Issue:** The weekly period calculation uses `now.getDate() - day` which doesn't correctly handle week start across month boundaries. If today is the 2nd and the week starts on Sunday (day 0), `setDate(2 - 0) = setDate(2)` is correct, but `setDate(2 - 6) = setDate(-4)` would go to the previous month.

**Remediation:** Use `startOfWeek()` from `date-fns` (already installed) instead of manual calculation.

---

### 🟡 MEDIUM: Race Condition in Offline Sync
**File:** `lib/offline/sync-manager.ts`  
**Severity:** Medium  

**Issue:** The `SyncManager.sync()` method sets `is_syncing` flag but doesn't handle the case where sync is interrupted (tab closed, browser crash). The `is_syncing` flag is a local variable that resets on page reload, so this is not a data integrity issue, but it could cause duplicate syncs.

**Remediation:** Use IndexedDB to persist sync state, or add idempotency checks to the sync endpoints.

---

### 🟡 MEDIUM: No Request Size Limiting
**File:** API routes (`app/api/`)  
**Severity:** Medium  

**Issue:** The API routes for feedback, Stripe webhooks, and clerk webhooks don't enforce request body size limits. An attacker could send extremely large payloads.

**Remediation:** Add `export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }` to API routes or use Next.js middleware to enforce limits.

---

## Low Severity Findings

### 🟢 LOW: Inconsistent Name Casing in tRPC Routers
**Files:** All tRPC routers  
**Severity:** Low (Code Quality)

**Issue:** Router names use camelCase (`mealLog`, `mealPreset`) but procedure names within routers use snake_case (`add`, `get_by_date_range`). The admin router uses snake_case for procedures (`get_foods`, `create_food`). This inconsistency makes the API harder to learn.

**Remediation:** Standardize on one convention. Given the Zod schemas use snake_case, consider snake_case for tRPC procedures.

---

### 🟢 LOW: `any` Type Casts in Admin Router
**File:** `lib/trpc/routers/admin.ts`  
**Severity:** Low  

**Issue:** Multiple `as any` casts in the admin router's filter conditions:
```typescript
conditions.push(like(foods.name as any, `%${input.search}%`));
conditions.push(eq(foods.category as any, input.category));
```

**Remediation:** Remove the `as any` casts — they suppress TypeScript's type checking. The Drizzle column types should be compatible.

---

## Positive Findings

1. ✅ **Good:** tRPC with Zod validation on all inputs
2. ✅ **Good:** Row-level security via Clerk auth middleware  
3. ✅ **Good:** Rate limiting on all tRPC mutations and queries
4. ✅ **Good:** Encrypted offline storage for sensitive data
5. ✅ ✅ **Good:** Audit logging for admin food operations
6. ✅ **Good:** Self-demotion prevention in admin role changes
7. ✅ **Good:** Security headers module with CSP, HSTS, X-Frame-Options
8. ✅ **Good:** Input sanitization module (sanitize.html, sanitize.ts)
9. ✅ **Good:** Environment validation on startup

---

## Recommendations

1. **Immediately:** Remove `g` flag from regex patterns ✅ (FIXED)
2. **This sprint:** Cache admin role lookups, fix weekly period calculation
3. **Next sprint:** Replace regex SQL injection detection with Zod-only validation
4. **Next sprint:** Add request size limits to API routes
5. **Ongoing:** Remove `any` casts, standardize naming conventions