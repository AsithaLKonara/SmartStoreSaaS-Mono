import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Define proper types for our user and session
interface ExtendedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
}

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
      async authorize(credentials): Promise<ExtendedUser | null> {
        console.log('🔐 Auth attempt:', { email: credentials?.email, hasPassword: !!credentials?.password });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { organization: true }
          });
          
          console.log('👤 User found:', !!user);

          if (!user) {
            console.log('❌ User not found');
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            console.log('❌ User account is inactive');
            return null;
          }

          // Verify password
          if (user.password) {
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
            console.log('🔑 Password valid:', isPasswordValid);

            if (!isPasswordValid) {
              console.log('❌ Invalid password');
              return null;
            }
          } else {
            console.log('❌ No password set for user');
            return null;
          }

          console.log('✅ Authentication successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role || 'USER',
            organizationId: user.organizationId || '',
          };
        } catch (error) {
          console.error('❌ Database error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.role = extendedUser.role;
        token.organizationId = extendedUser.organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        return {
          ...session,
          user: {
            ...session.user,
            id: token.sub!,
            role: token.role as string,
            organizationId: token.organizationId as string,
          }
        };
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