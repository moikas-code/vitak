# Production 500 Errors - tRPC Endpoints

## Issue
All tRPC endpoints are returning 500 errors in production:
- `credit.getAllBalances`
- `mealLog.getToday`
- `mealPreset.getAll`

## Root Cause
Incorrect indentation in the tRPC router files was causing TypeScript to misinterpret the code structure. The inconsistent indentation made it appear that we were trying to access `.from()` on a Promise rather than on the awaited Supabase client.

```typescript
// WRONG - Inconsistent indentation breaking the await chain
        const supabase = await createSupabaseClientWithUser(ctx.session.userId);
      const { data } = await supabase
        .from("user_settings")...

// CORRECT - Proper indentation
        const supabase = await createSupabaseClientWithUser(ctx.session.userId);
        const { data } = await supabase
          .from("user_settings")...
```

## Files Affected
- `lib/trpc/routers/credit.ts` - Multiple indentation issues fixed

## Resolution
✅ Fixed all indentation issues in the credit.ts router
✅ Verified other router files had correct indentation
✅ TypeScript compilation now passes without errors
✅ The production 500 errors should be resolved once deployed

The issue was purely formatting-related but critical as it broke the TypeScript interpretation of the async/await chain.