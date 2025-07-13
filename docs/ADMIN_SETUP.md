# Admin Role Management Guide

## Overview
VitaK Tracker uses a dual-role system where admin status must be set in both:
1. **Clerk publicMetadata** - Used by middleware for route protection
2. **Supabase database** - Used by tRPC procedures and server-side checks

## Development Setup

### Setting Admin Role
Use the provided script to set a user as admin:

```bash
# Check current admin status
bun run scripts/check-admin.ts <clerk-user-id>

# Set user as admin
bun run scripts/set-admin-complete.ts <clerk-user-id>
```

**Important**: After running the script, the user must log out and log back in for changes to take effect.

## Production Setup Options

### Option 1: Manual Script (Recommended for Small Teams)
- Use the same scripts as in development
- Requires server/console access
- Most secure option
- Good when admins rarely change

```bash
# SSH into your production server
bun run scripts/set-admin-complete.ts user_xxxxx
```

### Option 2: Environment-Based Admin List
Add to your `.env.production`:

```env
# Comma-separated list of admin emails
ADMIN_EMAIL_LIST=admin@example.com,owner@company.com
```

Then modify the user sync to check this list and auto-assign admin role.

### Option 3: First User as Admin
The first user to sign up automatically becomes admin. This is useful for:
- New deployments
- Self-hosted instances
- SaaS where the first user is the account owner

### Option 4: Admin Management UI
Build an admin page where existing admins can:
- View all users
- Grant/revoke admin status
- See audit logs of admin changes

## Security Considerations

1. **Always require both Clerk and database roles** - This provides defense in depth
2. **Log admin role changes** - Keep an audit trail
3. **Limit admin privileges** - Only give admin access to those who need it
4. **Regular audits** - Periodically review who has admin access

## Troubleshooting

### User can't access admin pages
1. Check both Clerk and database roles:
   ```bash
   bun run scripts/check-admin.ts <user-id>
   ```

2. Ensure user has logged out and back in after role change

3. Clear browser cookies if issues persist

### Admin role not persisting
- Verify CLERK_SECRET_KEY is set correctly
- Check webhook is properly configured
- Ensure database migrations have run

## Implementation Details

### Middleware Check (Route Protection)
```typescript
// Checks Clerk publicMetadata
const publicMetadata = user?.sessionClaims?.publicMetadata;
if (publicMetadata?.role !== 'admin') {
  return redirect('/dashboard');
}
```

### Database Check (API Protection)
```typescript
// Checks database role
const { data } = await supabase
  .from("user_settings")
  .select("role")
  .eq("user_id", userId)
  .single();
if (data?.role !== 'admin') {
  throw new Error('Unauthorized');
}
```

## Future Enhancements

1. **Role-based permissions** - Add more granular roles (viewer, editor, admin)
2. **Temporary admin access** - Time-limited admin privileges
3. **Admin action logging** - Track all admin actions for compliance
4. **Two-factor for admin** - Require 2FA for admin accounts