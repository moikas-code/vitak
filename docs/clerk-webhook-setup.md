# Clerk Webhook Setup Guide

To enable automatic user syncing between Clerk and your database, you need to configure a webhook in your Clerk dashboard.

## Steps to Configure

1. **Go to Clerk Dashboard**
   - Log in to your Clerk dashboard at https://dashboard.clerk.com
   - Select your VitaK Tracker application

2. **Navigate to Webhooks**
   - In the left sidebar, go to "Webhooks"
   - Click "Add Endpoint"

3. **Configure Webhook Endpoint**
   - **Endpoint URL**: `https://your-domain.com/api/clerk/webhook`
   - For local development with ngrok: `https://your-ngrok-url.ngrok.io/api/clerk/webhook`
   - For production: `https://vitaktracker.com/api/clerk/webhook`

4. **Select Events**
   Enable the following events:
   - `user.created`
   - `user.updated`
   - `user.deleted` (optional)

5. **Copy Webhook Secret**
   - After creating the webhook, Clerk will provide a signing secret
   - Copy this secret and add it to your `.env.local` file:
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

6. **Test the Webhook**
   - Use Clerk's webhook testing feature to send test events
   - Check your application logs to ensure events are being received

## Local Development with ngrok

For testing webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js app
bun dev

# In another terminal, expose your local server
ngrok http 3000

# Use the ngrok URL for your webhook endpoint
```

## Verifying Webhook is Working

1. Create a new user account in your app
2. Check your database to see if a record was created in the `users` table
3. Update user profile in Clerk and verify changes sync to database

## Troubleshooting

- **400 Error**: Check that `CLERK_WEBHOOK_SECRET` is set correctly
- **User not syncing**: Ensure webhook events are enabled in Clerk dashboard
- **Database errors**: Check Supabase logs and ensure migrations have run