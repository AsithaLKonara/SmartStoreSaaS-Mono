import { MongoDBConnectionTester } from './test-mongodb-connection';
import { DatabaseConnectionTester } from './comprehensive-db-test';

async function compareDatabases() {
  console.log('🔄 SmartStore SaaS Database Comparison');
  console.log('======================================\n');

  const results = {
    postgresql: null as any,
    mongodb: null as any
  };

  // Test PostgreSQL
  console.log('🐘 Testing PostgreSQL (Local)...');
  console.log('-----------------------------------');
  try {
    const pgTester = new DatabaseConnectionTester(
      'postgresql://asithalakmal@localhost:5432/smartstore'
    );
    results.postgresql = await pgTester.healthCheck();
    console.log('✅ PostgreSQL test completed');
  } catch (error: any) {
    results.postgresql = {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    console.log('❌ PostgreSQL test failed:', error.message);
  }

  console.log('\n🌿 Testing MongoDB Atlas (Vercel)...');
  console.log('-------------------------------------');
  try {
    const mongoTester = new MongoDBConnectionTester(
      'mongodb+srv://asviaai2025_db_user:1234@cluster0.1tpj8te.mongodb.net/smartstore?retryWrites=true&w=majority'
    );
    results.mongodb = await mongoTester.healthCheck();
    console.log('✅ MongoDB test completed');
  } catch (error: any) {
    results.mongodb = {
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    console.log('❌ MongoDB test failed:', error.message);
  }

  // Display comparison
  console.log('\n📊 DATABASE COMPARISON RESULTS');
  console.log('==============================\n');

  const comparison = [
    {
      metric: 'Status',
      postgresql: results.postgresql.status === 'healthy' ? '✅ Healthy' : '❌ Error',
      mongodb: results.mongodb.status === 'healthy' ? '✅ Healthy' : '❌ Error'
    },
    {
      metric: 'Type',
      postgresql: 'PostgreSQL (Local)',
      mongodb: 'MongoDB Atlas (Cloud)'
    },
    {
      metric: 'Location',
      postgresql: 'localhost:5432',
      mongodb: 'cluster0.1tpj8te.mongodb.net'
    },
    {
      metric: 'Connection Time',
      postgresql: results.postgresql.details?.connectionTime ? `${results.postgresql.details.connectionTime}ms` : 'N/A',
      mongodb: results.mongodb.details?.connectionTime ? `${results.mongodb.details.connectionTime}ms` : 'N/A'
    },
    {
      metric: 'Tables/Collections',
      postgresql: results.postgresql.details?.schemaTables || 'N/A',
      mongodb: results.mongodb.details?.collections?.length || 'N/A'
    },
    {
      metric: 'Database',
      postgresql: results.postgresql.details?.database || 'N/A',
      mongodb: results.mongodb.details?.database || 'N/A'
    },
    {
      metric: 'Schema',
      postgresql: '63 relational tables',
      mongodb: 'Document-based (flexible)'
    }
  ];

  console.table(comparison);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================\n');

  const pgHealthy = results.postgresql.status === 'healthy';
  const mongoHealthy = results.mongodb.status === 'healthy';

  if (pgHealthy && mongoHealthy) {
    console.log('Both databases are operational! Choose based on your needs:\n');

    console.log('🐘 PostgreSQL (Local) - Recommended for:');
    console.log('  • Complex relational data');
    console.log('  • ACID transactions');
    console.log('  • Structured schemas');
    console.log('  • Local development');
    console.log('  • Existing Prisma setup\n');

    console.log('🌿 MongoDB Atlas (Vercel) - Recommended for:');
    console.log('  • Flexible document schemas');
    console.log('  • Cloud-native deployment');
    console.log('  • Horizontal scaling');
    console.log('  • JSON-like data structures');
    console.log('  • Vercel integration\n');

  } else if (pgHealthy && !mongoHealthy) {
    console.log('✅ PostgreSQL is working, MongoDB has issues.');
    console.log('Recommendation: Stick with PostgreSQL for now.');
  } else if (!pgHealthy && mongoHealthy) {
    console.log('✅ MongoDB Atlas is working, PostgreSQL has issues.');
    console.log('Recommendation: Use MongoDB Atlas for deployment.');
  } else {
    console.log('❌ Both databases have issues.');
    console.log('Check network connectivity and credentials.');
  }

  console.log('\n🔄 To switch between databases:');
  console.log('1. Update DATABASE_URL in environment variables');
  console.log('2. Update Prisma schema provider if using Prisma');
  console.log('3. Migrate data if needed');
  console.log('4. Update application code for database operations');
}

// Run comparison if called directly
if (require.main === module) {
  compareDatabases().catch(console.error);
}

export { compareDatabases };
