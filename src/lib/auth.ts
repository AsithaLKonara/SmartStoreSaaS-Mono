import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

// Mock user data for development (using plain text for now)
const mockUsers = [
  {
    id: '1',
    email: 'admin@smartstore.ai',
    password: 'admin123', // Plain text for testing
    name: 'Admin User',
    role: 'ADMIN',
    organizationId: 'org-1',
  },
  {
    id: '2',
    email: 'user@smartstore.ai',
    password: 'user123', // Plain text for testing
    name: 'Test User',
    role: 'USER',
    organizationId: 'org-1',
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 Auth attempt:', { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        // Find user in mock data
        const user = mockUsers.find(u => u.email === credentials.email);
        console.log('👤 User found:', !!user);

        if (!user) {
          console.log('❌ User not found');
          return null;
        }

        // Simple password comparison for testing
        const isPasswordValid = credentials.password === user.password;
        console.log('🔑 Password valid:', isPasswordValid);

        if (!isPasswordValid) {
          console.log('❌ Invalid password');
          return null;
        }

        console.log('✅ Authentication successful for:', user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown).role;
        token.organizationId = (user as unknown).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as unknown).id = token.sub!;
        (session.user as unknown).role = token.role as string;
        (session.user as unknown).organizationId = token.organizationId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'smartstore-nextauth-secret-key-2024',
  debug: true, // Enable debugging
}; 