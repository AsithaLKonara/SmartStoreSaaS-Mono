import { MongoClient, Db } from 'mongodb';

interface MongoDBTestResult {
  success: boolean;
  connectionTime?: number;
  database?: string;
  collections?: string[];
  serverInfo?: any;
  error?: string;
  connectionString?: string;
}

class MongoDBConnectionTester {
  private client: MongoClient | null = null;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async testConnection(): Promise<MongoDBTestResult> {
    const startTime = Date.now();

    try {
      console.log('🔍 Testing MongoDB connection...');
      console.log(`📍 Connection String: ${this.maskConnectionString(this.connectionString)}`);

      // Create MongoDB client with connection options
      this.client = new MongoClient(this.connectionString, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 10000, // 10 second connection timeout
        socketTimeoutMS: 10000, // 10 second socket timeout
      });

      // Test basic connection
      console.log('1️⃣ Testing basic connection...');
      await this.client.connect();
      console.log('✅ MongoDB connection successful');

      const connectionTime = Date.now() - startTime;
      console.log(`⏱️ Connection established in ${connectionTime}ms`);

      // Get database info
      console.log('\n2️⃣ Checking database information...');
      const db = this.client.db();
      const dbName = db.databaseName;
      console.log(`📊 Database Name: ${dbName}`);

      // Get server info
      console.log('\n3️⃣ Retrieving server information...');
      const serverInfo = await db.admin().serverInfo();
      console.log(`🖥️ Server Version: ${serverInfo.version}`);
      console.log(`🏗️ Server Architecture: ${serverInfo.bits} bit`);

      // List collections
      console.log('\n4️⃣ Checking collections...');
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      console.log(`📁 Collections (${collectionNames.length}): ${collectionNames.join(', ') || 'None'}`);

      // Test basic operations
      console.log('\n5️⃣ Testing database operations...');

      // Test ping
      const pingResult = await db.admin().ping();
      console.log('✅ Database ping successful');

      // Test simple query on a test collection
      const testCollection = db.collection('connection_test');
      const testDoc = { test: 'connection', timestamp: new Date(), version: '1.0' };
      await testCollection.insertOne(testDoc);
      console.log('✅ Insert operation successful');

      const count = await testCollection.countDocuments();
      console.log(`✅ Count operation successful (${count} documents)`);

      // Clean up test data
      await testCollection.deleteMany({ test: 'connection' });
      console.log('✅ Cleanup successful');

      console.log('\n🎉 All MongoDB tests passed successfully!');

      return {
        success: true,
        connectionTime,
        database: dbName,
        collections: collectionNames,
        serverInfo: {
          version: serverInfo.version,
          architecture: `${serverInfo.bits} bit`,
          host: serverInfo.host,
          port: serverInfo.port,
        },
        connectionString: this.maskConnectionString(this.connectionString),
      };

    } catch (error: any) {
      const connectionTime = Date.now() - startTime;

      console.error('\n❌ MongoDB connection test failed:', error.message);

      this.printTroubleshootingInfo(error);

      return {
        success: false,
        connectionTime,
        error: error.message,
        connectionString: this.maskConnectionString(this.connectionString),
      };

    } finally {
      if (this.client) {
        await this.client.close();
        console.log('\n🔌 Connection closed');
      }
    }
  }

  private maskConnectionString(connectionString: string): string {
    // Mask password in connection string for security
    return connectionString.replace(/:([^:@]{4})[^:@]*@/, ':$1****@');
  }

  private printTroubleshootingInfo(error: any) {
    console.log('\n🔧 Troubleshooting Information:');
    console.log('=====================================');

    if (error.name) {
      console.log(`Error Type: ${error.name}`);
    }

    if (error.code) {
      console.log(`Error Code: ${error.code}`);
    }

    console.log('\n💡 Common MongoDB Connection Issues:');

    if (error.code === 'ECONNREFUSED') {
      console.log('1. MongoDB server is not running or not accessible');
      console.log('2. Check if the host and port are correct');
      console.log('3. Verify network connectivity and firewall settings');
    } else if (error.code === 'ENOTFOUND') {
      console.log('1. Hostname cannot be resolved - check the connection string');
      console.log('2. DNS issues or incorrect cluster URL');
    } else if (error.code === 18) {
      console.log('1. Authentication failed - check username/password');
      console.log('2. User may not have access to the database');
    } else if (error.code === 13) {
      console.log('1. Authorization failed - user lacks permissions');
      console.log('2. Check database user roles and permissions');
    } else if (error.message.includes('SSL')) {
      console.log('1. SSL/TLS connection issues');
      console.log('2. Check SSL configuration and certificates');
    } else {
      console.log('1. Verify connection string format');
      console.log('2. Check network connectivity');
      console.log('3. Ensure MongoDB Atlas cluster is running');
      console.log('4. Verify IP whitelist allows your connection');
    }

    console.log('\n🔍 For MongoDB Atlas:');
    console.log('1. Check cluster status in MongoDB Atlas dashboard');
    console.log('2. Verify connection string is correct');
    console.log('3. Ensure IP whitelist includes your IP (or 0.0.0.0/0 for testing)');
    console.log('4. Check database user credentials and permissions');
  }

  // Health check method for monitoring
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: any;
    timestamp: string;
  }> {
    const result = await this.testConnection();

    return {
      status: result.success ? 'healthy' : 'unhealthy',
      details: result,
      timestamp: new Date().toISOString(),
    };
  }
}

// Main execution
async function main() {
  console.log('🚀 SmartStore SaaS MongoDB Connection Tester');
  console.log('=============================================\n');

  // Get connection string from command line or environment
  const connectionString = process.argv[2] || process.env.MONGODB_URI;

  if (!connectionString) {
    console.log('❌ No MongoDB connection string provided!');
    console.log('\n💡 Usage:');
    console.log('  npx tsx test-mongodb-connection.ts "mongodb+srv://username:password@cluster.mongodb.net/database"');
    console.log('  or set MONGODB_URI environment variable');
    console.log('\n🔍 Your Vercel MongoDB connection string:');
    console.log('  mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smartstore?retryWrites=true&w=majority');

    process.exit(1);
  }

  // Run comprehensive test
  const tester = new MongoDBConnectionTester(connectionString);
  const result = await tester.testConnection();

  if (result.success) {
    console.log('\n🎉 MongoDB is ready for use!');
    console.log('\n📊 Summary:');
    console.log(`- Database: ${result.database}`);
    console.log(`- Collections: ${result.collections?.length || 0}`);
    console.log(`- Connection Time: ${result.connectionTime}ms`);
    process.exit(0);
  } else {
    console.log('\n❌ MongoDB connection issues detected.');
    process.exit(1);
  }
}

// Export for use in other modules
export { MongoDBConnectionTester };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
