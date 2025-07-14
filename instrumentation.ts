/**
 * Next.js instrumentation file
 * Runs once when the server starts
 */

import { validateEnvOnStartup } from '@/lib/config/env-validation';

export async function register() {
  // Validate environment variables on startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnvOnStartup();
  }
}