import { z } from 'zod';
import { logger } from './logger';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection URL'),
  NEXTAUTH_SECRET: z.string().min(8, 'NEXTAUTH_SECRET must be at least 8 characters long'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
});

export function validateConfig() {
  if (process.env.NODE_ENV === 'production') {
    try {
      EnvSchema.parse(process.env);
      logger.info({ message: 'Environment configuration validated successfully.' });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const missingVars = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        logger.error({
          message: 'CRITICAL CONFIGURATION ERROR: Missing or invalid required environment variables in production.',
          context: { errors: err.errors }
        });
        console.error(`\n==================================================`);
        console.error(`❌ CRITICAL PRODUCTION STARTUP FAILURE:`);
        console.error(`Missing or invalid environment variables:`);
        console.error(missingVars);
        console.error(`==================================================\n`);
        process.exit(1);
      } else {
        logger.error({ message: 'Unexpected config validation error', error: err });
        process.exit(1);
      }
    }
  } else {
    const result = EnvSchema.safeParse(process.env);
    if (!result.success) {
      logger.warn({
        message: 'Development warning: Missing some production-required environment variables.',
        context: { errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`) }
      });
    }
  }
}

// Auto-execute on module import to ensure fail-fast safety
validateConfig();
