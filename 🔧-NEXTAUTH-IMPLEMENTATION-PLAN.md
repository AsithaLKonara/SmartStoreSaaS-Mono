# 🔧 NextAuth Implementation Plan & Fixes

## 📋 **CURRENT ISSUES IDENTIFIED**

### 1. **Prisma Model Name Mismatch** ❌
- **Problem**: NextAuth is looking for `prisma.user` but database table is `users`
- **Impact**: Authentication fails because user lookup returns null
- **Fix**: Update NextAuth configuration to use correct model name

### 2. **Environment Variables** ⚠️
- **Problem**: Missing `NEXTAUTH_URL` and `NEXTAUTH_SECRET` in current environment
- **Impact**: NextAuth can't generate proper tokens and sessions
- **Fix**: Set proper environment variables

### 3. **Login Form Credentials Mismatch** ❌
- **Problem**: Login form has old credentials that don't match seeded test users
- **Impact**: Users can't login with the provided test credentials
- **Fix**: Update login form to use correct seeded credentials

### 4. **NextAuth API Routes** ❌
- **Problem**: NextAuth API routes returning 404 errors
- **Impact**: Authentication requests fail completely
- **Fix**: Ensure NextAuth routes are properly configured for App Router

---

## 🚀 **IMPLEMENTATION PLAN**

### **Phase 1: Fix Core NextAuth Configuration** (Priority: HIGH)

#### 1.1 Fix Prisma Model Name
```typescript
// In src/app/api/auth/[...nextauth]/route.ts
const user = await prisma.users.findUnique({ // Change from 'user' to 'users'
  where: { email: credentials.email },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    password: true,
    isActive: true,
    organizationId: true,
  },
});
```

#### 1.2 Update Environment Variables
```bash
# Add to .env.local
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-for-testing"
```

#### 1.3 Fix Login Form Credentials
Update test credentials to match seeded users:
- SUPER_ADMIN: `superadmin@smartstore.com` / `SuperAdmin123!`
- TENANT_ADMIN: `admin@demo.com` / `Admin123!`
- STAFF: `sales@demo.com` / `Sales123!`
- CUSTOMER: `customer@demo.com` / `Customer123!`

### **Phase 2: Verify NextAuth Routes** (Priority: HIGH)

#### 2.1 Check Route Structure
- Ensure `src/app/api/auth/[...nextauth]/route.ts` exists
- Verify exports: `{ handler as GET, handler as POST }`
- Check NextAuth configuration is complete

#### 2.2 Test API Endpoints
- `/api/auth/signin` - Should return login form
- `/api/auth/callback/credentials` - Should handle credential login
- `/api/auth/session` - Should return current session
- `/api/auth/csrf` - Should return CSRF token

### **Phase 3: Test Authentication Flow** (Priority: MEDIUM)

#### 3.1 Frontend Login Test
- Test login form submission
- Verify redirect to dashboard
- Check session persistence

#### 3.2 API Authentication Test
- Test protected API endpoints
- Verify JWT token generation
- Check role-based access

### **Phase 4: RBAC Integration** (Priority: MEDIUM)

#### 4.1 Run RBAC Audit
- Execute `npm run audit:rbac`
- Verify all routes return proper status codes
- Check role-based permissions

#### 4.2 Fix Any RBAC Issues
- Update route permissions if needed
- Ensure proper error handling
- Verify organization scoping

---

## 🔧 **DETAILED FIXES**

### **Fix 1: Prisma Model Name**
```typescript
// Before (BROKEN)
const user = await prisma.user.findUnique({

// After (FIXED)
const user = await prisma.users.findUnique({
```

### **Fix 2: Environment Variables**
```bash
# .env.local
DATABASE_URL="postgresql://asithalakmal@localhost:5432/smartstore_dev?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-for-testing"
```

### **Fix 3: Login Form Credentials**
```typescript
// Update default credentials in LoginForm.tsx
const [email, setEmail] = useState('superadmin@smartstore.com');
const [password, setPassword] = useState('SuperAdmin123!');
```

### **Fix 4: NextAuth Configuration**
```typescript
// Ensure proper NextAuth setup
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      // ... existing config
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // ... existing callbacks
  },
};
```

---

## ✅ **VERIFICATION CHECKLIST**

### **Phase 1 Verification**
- [ ] Prisma model name fixed (`users` instead of `user`)
- [ ] Environment variables set correctly
- [ ] Login form credentials updated
- [ ] NextAuth configuration complete

### **Phase 2 Verification**
- [ ] NextAuth API routes accessible (no 404 errors)
- [ ] Login form submits successfully
- [ ] User authentication works
- [ ] Session creation successful

### **Phase 3 Verification**
- [ ] Login redirects to dashboard
- [ ] Session persists across page reloads
- [ ] Logout functionality works
- [ ] Protected routes require authentication

### **Phase 4 Verification**
- [ ] RBAC audit passes (all routes return correct status codes)
- [ ] Role-based access works correctly
- [ ] Organization scoping functions properly
- [ ] Permission system operational

---

## 🎯 **EXPECTED OUTCOMES**

After implementing these fixes:

1. **Authentication Flow**: ✅ Working login/logout
2. **API Routes**: ✅ NextAuth endpoints accessible
3. **Session Management**: ✅ JWT tokens generated correctly
4. **RBAC System**: ✅ Role-based access control functional
5. **Database Integration**: ✅ User lookup working
6. **Frontend Integration**: ✅ Login form functional

---

## 🚨 **CRITICAL SUCCESS FACTORS**

1. **Prisma Model Name**: Must match actual database table name
2. **Environment Variables**: Must be set correctly for NextAuth
3. **Credentials Match**: Login form credentials must match seeded users
4. **Route Configuration**: NextAuth routes must be properly configured
5. **Database Connection**: Must use local PostgreSQL database

---

**Status**: 🔧 **READY FOR IMPLEMENTATION**  
**Priority**: 🚨 **CRITICAL** (Blocks all authentication)  
**Estimated Time**: 30-45 minutes

