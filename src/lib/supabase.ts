import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client (safe for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side Supabase client with service role (for admin operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database helper functions
export const dbHelpers = {
  // Test connection
  async testConnection() {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1)
      if (error) throw error
      return { success: true, message: 'Supabase connection successful' }
    } catch (error) {
      return { success: false, message: `Supabase connection failed: ${error}` }
    }
  },

  // Get user by ID
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  // Get products with pagination
  async getProducts(limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  },

  // Create product
  async createProduct(product: any) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export default supabase
