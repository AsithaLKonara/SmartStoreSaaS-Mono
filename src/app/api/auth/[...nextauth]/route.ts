export const dynamic = 'force-dynamic';
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  // Add CSRF configuration
  cookies: {
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('🔍 NextAuth: Missing credentials');
          return null;
        }

        try {
          console.log('🔍 NextAuth: Starting authentication...');
          console.log('🔍 NextAuth: Email:', credentials.email);
          console.log('🔍 NextAuth: Prisma client initialized:', !!prisma);
          console.log('🔍 NextAuth: Prisma client user property:', !!prisma?.user);

          const user = await prisma.user.findUnique({
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

          console.log('🔍 NextAuth: User found:', !!user);
          console.log('🔍 NextAuth: User active:', user?.isActive);
          
          if (!user || !user.isActive) {
            console.log('🔍 NextAuth: User not found or inactive');
            return null;
          }

          if (!user.password) {
            console.log('🔍 NextAuth: User has no password');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log('🔍 NextAuth: Password valid:', isValid);
          
          if (!isValid) {
            console.log('🔍 NextAuth: Invalid password');
            return null;
          }

          const userObject = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          };
          
          console.log('🔍 NextAuth: Authentication successful for user:', user.email);
          console.log('🔍 NextAuth: Returning user object:', userObject);
          return userObject;
        } catch (error) {
          console.error('🔍 NextAuth: Error in authorize:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔍 NextAuth: JWT callback - user:', !!user, 'token.id:', token.id);
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
        console.log('🔍 NextAuth: JWT callback - updated token with user data');
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔍 NextAuth: Session callback - token.id:', token.id, 'token.role:', token.role);
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        console.log('🔍 NextAuth: Session callback - updated session with token data');
      }
      return session;
    },
  },
  debug: true, // Enable debug logging
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

