/**
 * Environment variable validation
 * Ensures all required environment variables are present
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
  
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key for client access',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key for admin operations',
    sensitive: true,
  },
  
  // Redis (optional)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'Upstash Redis URL for rate limiting',
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Upstash Redis token for authentication',
    sensitive: true,
  },
  
  // Stripe (optional for donations)
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
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
  
  // Discord (optional for notifications)
  {
    name: 'DISCORD_WEBHOOK_URL',
    required: false,
    description: 'Discord webhook URL for notifications',
    sensitive: true,
  },
];

/**
 * Validate all environment variables
 * @returns Object with validation results
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
 * Get environment variable with fallback
 */
export function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!value && !fallback) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value || fallback!;
}

/**
 * Validate environment on startup
 * Call this in your app initialization
 */
export function validateEnvOnStartup() {
  const results = validateEnvironment();
  
  if (!results.valid) {
    logger.error('Environment validation failed', {
      missing: results.missing,
      warnings: results.warnings,
    });
    
    if (isProduction()) {
      // In production, fail fast
      throw new Error(
        `Missing required environment variables: ${results.missing.join(', ')}`
      );
    } else {
      // In development, just warn
      logger.warn('Running with missing environment variables - some features may not work');
    }
  } else {
    logger.info('Environment validation passed', {
      warnings: results.warnings.length > 0 ? results.warnings : undefined,
    });
  }
  
  return results;
}