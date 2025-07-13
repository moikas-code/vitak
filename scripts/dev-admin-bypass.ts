#!/usr/bin/env bun
/**
 * Development-only script to temporarily bypass admin checks
 * DO NOT USE IN PRODUCTION
 */

console.log(`
⚠️  DEVELOPMENT ADMIN BYPASS ⚠️

To temporarily bypass admin checks in development:

1. Set this environment variable:
   export DEV_ADMIN_BYPASS=true

2. Add to your .env.local:
   DEV_ADMIN_BYPASS=true
   DEV_ADMIN_USER_ID=user_2z1cH3lhoskyreB4U08scDsP5gQ

3. Update middleware.ts to check for this flag (DEVELOPMENT ONLY):

if (process.env.NODE_ENV === 'development' && 
    process.env.DEV_ADMIN_BYPASS === 'true' && 
    user?.userId === process.env.DEV_ADMIN_USER_ID) {
  console.log('[Middleware] DEV BYPASS - Admin access granted');
  // Skip the publicMetadata check
} else {
  // Normal admin check
}

⚠️  NEVER commit this bypass to production!
`);