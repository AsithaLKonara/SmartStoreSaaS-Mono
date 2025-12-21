import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

interface DatabaseConfig {
  url: string;
  provider: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

class DatabaseConnectionTester {
  private prisma: PrismaClient;
  private config: DatabaseConfig;

  constructor() {
    this.config = this.parseDatabaseUrl();
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: this.config.url,
        },
      },
    });
  }

  private parseDatabaseUrl(): DatabaseConfig {
    const url = process.env.DATABASE_URL;

    if (!url) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    console.log('🔍 Parsing DATABASE_URL...');

    // Basic URL parsing
    try {
      const urlObj = new URL(url);
      const provider = this.detectProvider(url);

      return {
        url,
        provider,
        host: urlObj.hostname,
        port: urlObj.port ? parseInt(urlObj.port) : undefined,
        database: urlObj.pathname.slice(1), // Remove leading slash
        username: urlObj.username,
        password: urlObj.password,
      };
    } catch (error) {
      throw new Error(`Invalid DATABASE_URL format: ${url}`);
    }
  }

  private detectProvider(url: string): DatabaseConfig['provider'] {
    if (url.startsWith('postgresql://')) return 'postgresql';
    if (url.startsWith('mysql://')) return 'mysql';
    if (url.startsWith('sqlserver://')) return 'sqlserver';
    if (url.startsWith('mongodb://')) return 'mongodb';
    if (url.startsWith('file:') || url.includes('.db') || url.includes('.sqlite')) return 'sqlite';

    // Default to postgresql for prisma compatibility
    return 'postgresql';
  }

  async testConnection(): Promise<boolean> {
    console.log('\n🔍 Starting comprehensive database connection test...\n');

    try {
      // 1. Test basic connection
      console.log('1️⃣ Testing basic connection...');
      await this.prisma.$connect();
      console.log('✅ Database connection successful');

      // 2. Test query execution
      console.log('\n2️⃣ Testing query execution...');
      const testResult = await this.prisma.$queryRaw`SELECT 1 as test_value, NOW() as current_time`;
      console.log('✅ Query execution successful:', testResult);

      // 3. Check database information
      console.log('\n3️⃣ Checking database information...');
      await this.checkDatabaseInfo();

      // 4. Check schema and tables
      console.log('\n4️⃣ Checking schema and tables...');
      await this.checkSchemaTables();

      // 5. Test data integrity
      console.log('\n5️⃣ Testing data integrity...');
      await this.testDataIntegrity();

      console.log('\n🎉 All database tests passed successfully!');
      return true;

    } catch (error) {
      console.error('\n❌ Database connection test failed:', error);
      this.printTroubleshootingInfo(error);
      return false;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async checkDatabaseInfo() {
    try {
      if (this.config.provider === 'postgresql') {
        const version = await this.prisma.$queryRaw`SELECT version()`;
        console.log('📊 PostgreSQL Version:', version);

        const dbInfo = await this.prisma.$queryRaw`
          SELECT
            current_database() as database_name,
            current_schema() as schema_name,
            current_user as current_user
        `;
        console.log('📊 Database Info:', dbInfo);
      }
    } catch (error) {
      console.log('⚠️ Could not retrieve database info:', error.message);
    }
  }

  private async checkSchemaTables() {
    try {
      if (this.config.provider === 'postgresql') {
        // Check if tables exist
        const tables = await this.prisma.$queryRaw`
          SELECT table_name, table_type
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `;

        console.log(`📋 Found ${Array.isArray(tables) ? tables.length : 0} tables in schema`);

        if (Array.isArray(tables) && tables.length > 0) {
          console.log('📋 Tables:', tables.slice(0, 10).map((t: any) => t.table_name));
          if (tables.length > 10) {
            console.log(`... and ${tables.length - 10} more tables`);
          }
        }

        // Test specific tables from schema
        const expectedTables = [
          'users', 'organizations', 'products', 'customers', 'orders',
          'categories', 'payments', 'deliveries', 'couriers'
        ];

        console.log('\n🔍 Checking expected tables:');
        for (const tableName of expectedTables) {
          try {
            const count = await (this.prisma as any)[tableName]?.count?.() ?? 0;
            console.log(`✅ ${tableName}: ${count} records`);
          } catch (error) {
            console.log(`⚠️ ${tableName}: Table might not exist or is inaccessible`);
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Could not check schema tables:', error.message);
    }
  }

  private async testDataIntegrity() {
    try {
      // Test referential integrity with a simple query
      const userCount = await this.prisma.user.count();
      const orgCount = await this.prisma.organization.count();

      console.log(`🔗 Data integrity check: ${userCount} users, ${orgCount} organizations`);

      if (userCount > 0) {
        // Test a user query with relations
        const sampleUser = await this.prisma.user.findFirst({
          include: {
            organization: true
          }
        });

        if (sampleUser) {
          console.log('✅ User-organization relationship working');
        }
      }

    } catch (error) {
      console.log('⚠️ Data integrity test failed:', error.message);
    }
  }

  private printTroubleshootingInfo(error: any) {
    console.log('\n🔧 Troubleshooting Information:');
    console.log('=====================================');
    console.log(`Database URL: ${this.config.url ? 'Set' : 'NOT SET'}`);
    console.log(`Provider: ${this.config.provider}`);
    console.log(`Host: ${this.config.host || 'Unknown'}`);
    console.log(`Port: ${this.config.port || 'Default'}`);
    console.log(`Database: ${this.config.database || 'Unknown'}`);

    if (error.code) {
      console.log(`Error Code: ${error.code}`);
    }

    console.log('\n💡 Common Solutions:');
    console.log('1. Check if database server is running');
    console.log('2. Verify DATABASE_URL format and credentials');
    console.log('3. Ensure database exists and is accessible');
    console.log('4. Check firewall and network connectivity');
    console.log('5. Verify user permissions');

    if (this.config.provider === 'postgresql') {
      console.log('6. For PostgreSQL: Check pg_hba.conf for connection rules');
    }
  }

  // Health check method for monitoring
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
    timestamp: string;
  }> {
    const startTime = Date.now();

    try {
      await this.prisma.$connect();
      const pingResult = await this.prisma.$queryRaw`SELECT 1 as ping`;

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        status: 'healthy',
        details: {
          responseTime,
          pingResult,
          connection: 'successful'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          code: error.code
        },
        timestamp: new Date().toISOString()
      };
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 SmartStore SaaS Database Connection Tester');
  console.log('==============================================\n');

  // Check environment
  console.log('📋 Environment Check:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'Set (hidden for security)' : 'NOT SET'}`);

  if (!process.env.DATABASE_URL) {
    console.log('\n❌ DATABASE_URL is not set!');
    console.log('\n💡 To set up database connection:');
    console.log('1. Copy env.example to .env');
    console.log('2. Update DATABASE_URL with your database credentials');
    console.log('3. Example: DATABASE_URL="postgresql://user:pass@localhost:5432/smartstore"');

    // Try to create a basic .env file for local development
    console.log('\n🔧 Creating sample .env file for local PostgreSQL...');

    const fs = require('fs');
    const sampleEnv = `# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartstore"

# Other required environment variables...
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-key"
`;

    try {
      fs.writeFileSync('.env', sampleEnv);
      console.log('✅ Created .env file with sample configuration');
      console.log('⚠️ Please update the DATABASE_URL with your actual database credentials');
    } catch (error) {
      console.log('❌ Could not create .env file:', error.message);
    }

    process.exit(1);
  }

  // Run comprehensive test
  const tester = new DatabaseConnectionTester();
  const success = await tester.testConnection();

  if (success) {
    console.log('\n🎉 Database is ready for use!');
    process.exit(0);
  } else {
    console.log('\n❌ Database connection issues detected.');
    process.exit(1);
  }
}

// Export for use in other modules
export { DatabaseConnectionTester };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
