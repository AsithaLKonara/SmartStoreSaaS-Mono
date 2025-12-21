import { config } from 'dotenv'
import { dbHelpers } from './src/lib/supabase'

// Load environment variables
config()

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...')

  try {
    // Test basic connection
    const result = await dbHelpers.testConnection()
    console.log('✅ Connection test:', result)

    // Test getting users (if table exists)
    try {
      const { supabase } = await import('./src/lib/supabase')
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, name')
        .limit(5)

      if (error) {
        console.log('⚠️  Users table query failed:', error.message)
      } else {
        console.log('✅ Users table accessible:', users?.length || 0, 'records found')
      }
    } catch (err) {
      console.log('⚠️  Users table test failed:', err)
    }

    // Test getting products (if table exists)
    try {
      const { supabase } = await import('./src/lib/supabase')
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price')
        .limit(5)

      if (error) {
        console.log('⚠️  Products table query failed:', error.message)
      } else {
        console.log('✅ Products table accessible:', products?.length || 0, 'records found')
      }
    } catch (err) {
      console.log('⚠️  Products table test failed:', err)
    }

    console.log('🎉 Supabase setup verification complete!')

  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    process.exit(1)
  }
}

testSupabaseConnection()
