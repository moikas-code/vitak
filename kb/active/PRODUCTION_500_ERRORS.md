# Production 500 Errors - tRPC Endpoints

## Issue
All tRPC endpoints are returning 500 errors in production:
- `credit.getAllBalances`
- `mealLog.getToday`
- `mealPreset.getAll`

## Root Causes

### 1. RLS Policy / Clerk Authentication Mismatch
The Supabase RLS policies were designed for Supabase Auth (`auth.uid()`), but we're using Clerk for authentication. This mismatch causes all database queries to fail with permission errors.

### 2. Missing Clerk JWT Template
The code was trying to use a non-existent "supabase" JWT template from Clerk, which would fail in production.

### 3. Missing Redis Credentials
Rate limiting was failing due to missing Redis credentials, potentially causing cascading failures.

### 4. Indentation Issues (Fixed)
Some tRPC routers had incorrect indentation that broke the async/await chain.

## Resolution

### ✅ Completed Fixes

1. **Created new RLS migration** (`20250114000000_fix_rls_policies_for_clerk.sql`)
   - Added `get_clerk_user_id()` function to extract Clerk ID from JWT
   - Added `is_admin()` helper function
   - Updated all RLS policies to use Clerk user IDs

2. **Updated Supabase client** 
   - Temporarily using service role client for consistent access
   - Removed dependency on non-existent Clerk JWT template

3. **Enhanced error logging**
   - Added structured logging with correlation IDs
   - Logs include user context and error details

4. **Added Redis fallback**
   - Rate limiting gracefully degrades when Redis is unavailable
   - Logs warnings but allows requests to proceed

5. **Fixed indentation issues**
   - Corrected all tRPC router formatting

## Deployment Steps

1. **Apply the RLS migration to production:**
   ```bash
   bunx supabase migration up --db-url $PRODUCTION_DB_URL
   ```

2. **Ensure environment variables are set:**
   - `SUPABASE_SERVICE_ROLE_KEY` (required)
   - `UPSTASH_REDIS_REST_URL` (optional but recommended)
   - `UPSTASH_REDIS_REST_TOKEN` (optional but recommended)

3. **Deploy the updated code**

## Future Improvements

- Implement proper Clerk JWT integration with Supabase RLS
- Add comprehensive environment variable validation on startup
- Consider implementing a custom Clerk JWT template for Supabase