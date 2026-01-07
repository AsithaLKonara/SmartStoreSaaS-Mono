import * as fs from 'fs';
import * as path from 'path';

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate required environment variables for e2e tests
 */
export function validateTestEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check if .env.test exists
  const envPath = path.join(process.cwd(), '.env.test');
  if (!fs.existsSync(envPath)) {
    result.errors.push('.env.test file not found. Copy env.test.example to .env.test');
    result.valid = false;
    return result;
  }

  // Load environment variables from .env.test
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars: Record<string, string> = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key.trim()] = value.trim();
      }
    }
  });

  // Check required variables
  const requiredVars = {
    DATABASE_URL: 'Database connection string',
    NEXTAUTH_URL: 'NextAuth base URL',
    NEXTAUTH_SECRET: 'NextAuth secret key',
  };

  for (const [key, description] of Object.entries(requiredVars)) {
    const value = process.env[key] || envVars[key];
    if (!value || value.trim() === '') {
      result.errors.push(`${key} (${description}) is required but not set`);
      result.valid = false;
    } else {
      // Validate DATABASE_URL format
      if (key === 'DATABASE_URL') {
        if (!value.startsWith('postgresql://')) {
          result.errors.push(`DATABASE_URL must be a PostgreSQL connection string (postgresql://...)`);
          result.valid = false;
        }
        if (!value.includes('smartstore_test')) {
          result.warnings.push('DATABASE_URL does not point to test database (smartstore_test). Make sure this is intentional.');
        }
      }

      // Validate NEXTAUTH_SECRET length
      if (key === 'NEXTAUTH_SECRET' && value.length < 32) {
        result.warnings.push('NEXTAUTH_SECRET should be at least 32 characters long for security');
      }
    }
  }

  // Check optional but recommended variables
  const recommendedVars = {
    JWT_SECRET: 'JWT secret key',
    E2E_BASE_URL: 'E2E test base URL (defaults to http://localhost:3000)',
  };

  for (const [key, description] of Object.entries(recommendedVars)) {
    const value = process.env[key] || envVars[key];
    if (!value || value.trim() === '') {
      result.warnings.push(`${key} (${description}) is recommended but not set`);
    }
  }

  return result;
}

/**
 * Print validation results
 */
export function printValidationResults(result: EnvValidationResult): void {
  if (result.valid && result.errors.length === 0) {
    console.log('✅ Environment validation passed');
  }

  if (result.errors.length > 0) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => {
      console.error(`   - ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }
}

/**
 * Validate and throw if invalid
 */
export function requireValidEnvironment(): void {
  const result = validateTestEnvironment();
  printValidationResults(result);
  
  if (!result.valid) {
    throw new Error('Environment validation failed. Please fix the errors above.');
  }
}

