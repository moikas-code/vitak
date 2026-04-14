/**
 * Environment variable validation for Cloudflare Workers + D1 deployment.
 * No more Supabase or Upstash Redis — those are replaced by D1 and CF KV.
 */

import { createLogger } from "@/lib/logger";

const logger = createLogger('env-validation');

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  sensitive?: boolean;
}

const ENV_VARS: EnvVar[] = [
  // Clerk Auth
  {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    required: true,
    description: 'Clerk publishable key for client-side auth',
  },
  {
    name: 'CLERK_SECRET_KEY',
    required: true,
    description: 'Clerk secret key for server-side auth',
    sensitive: true,
  },
  {
    name: 'CLERK_WEBHOOK_SECRET',
    required: false,
    description: 'Clerk webhook secret for user sync',
    sensitive: true,
  },

  // Stripe (optional for donations)
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key for client-side payments',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key for server-side operations',
    sensitive: true,
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    description: 'Stripe webhook secret for payment events',
    sensitive: true,
  },

  // Discord (optional for feedback)
  {
    name: 'DISCORD_FEEDBACK_WEBHOOK_URL',
    required: false,
    description: 'Discord webhook URL for feedback notifications',
    sensitive: true,
  },

  // App
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'App URL for callbacks and CORS',
  },
];

/**
 * Validate all environment variables
 */
export function validateEnvironment() {
  const results = {
    valid: true,
    missing: [] as string[],
    warnings: [] as string[],
  };

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];

    if (!value && envVar.required) {
      results.valid = false;
      results.missing.push(envVar.name);
      logger.error(`Missing required environment variable: ${envVar.name}`, {
        description: envVar.description,
      });
    } else if (!value && !envVar.required) {
      results.warnings.push(envVar.name);
      logger.warn(`Optional environment variable not set: ${envVar.name}`, {
        description: envVar.description,
      });
    } else if (value && !envVar.sensitive) {
      logger.info(`Environment variable set: ${envVar.name}`);
    } else if (value && envVar.sensitive) {
      logger.info(`Environment variable set: ${envVar.name} (sensitive - value hidden)`);
    }
  }

  return results;
}

/**
 * Check if running in production mode
 */
export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Validate environment on startup
 */
export function validateEnvOnStartup() {
  const results = validateEnvironment();

  if (!results.valid) {
    logger.error('Environment validation failed', {
      missing: results.missing,
      warnings: results.warnings,
    });

    if (isProduction()) {
      throw new Error(
        `Missing required environment variables: ${results.missing.join(', ')}`
      );
    } else {
      logger.warn('Running with missing environment variables — some features may not work');
    }
  } else {
    logger.info('Environment validation passed', {
      warnings: results.warnings.length > 0 ? results.warnings : undefined,
    });
  }

  return results;
}