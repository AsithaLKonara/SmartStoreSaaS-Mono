# Supabase Setup Instructions

## 1. Create Supabase Project
- Go to https://supabase.com
- Create account and new project
- Choose your region (Asia South recommended for better latency)

## 2. Get Connection Details
- Go to Settings → Database
- Copy the connection string
- Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

## 3. Update Vercel Environment
```bash
# Remove old Aiven DB
vercel env rm DATABASE_URL production

# Add Supabase DB URL
echo 'postgresql://postgres:YOUR_SUPABASE_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres' | vercel env add DATABASE_URL production

# Redeploy
vercel --prod
```

## 4. Enable Row Level Security (Optional)
- Go to Authentication → Policies
- Configure RLS for multi-tenant data isolation

## 5. Seed Database
```bash
curl -X POST https://smart-store-saas-demo.vercel.app/api/seed \
  -H 'Authorization: Bearer smartstore-seed-token'
```

## Benefits of Supabase:
✅ Free tier: 500MB DB, 50MB files
✅ Built-in dashboard and API
✅ Real-time capabilities  
✅ Better developer experience
✅ Automatic API generation
✅ Row Level Security features
