import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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
    },
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
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
          logger.info({
            message: 'NextAuth: Missing credentials',
            context: { service: 'NextAuth', operation: 'authorize' }
          });
          return null;
        }

        try {
          logger.info({
            message: 'NextAuth: Starting authentication',
            context: { service: 'NextAuth', operation: 'authorize', email: credentials.email }
          });

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

          if (!user || !user.isActive) {
            logger.warn({
              message: 'NextAuth: User not found or inactive',
              context: { service: 'NextAuth', operation: 'authorize', email: credentials.email }
            });
            return null;
          }

          if (!user.password) {
            logger.warn({
              message: 'NextAuth: User has no password',
              context: { service: 'NextAuth', operation: 'authorize', email: credentials.email, userId: user.id }
            });
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            logger.warn({
              message: 'NextAuth: Invalid password',
              context: { service: 'NextAuth', operation: 'authorize', email: credentials.email, userId: user.id }
            });
            return null;
          }

          const userObject = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
          };
          
          logger.info({
            message: 'NextAuth: Authentication successful',
            context: { service: 'NextAuth', operation: 'authorize', email: user.email, userId: user.id, role: user.role }
          });
          return userObject;
        } catch (error) {
          logger.error({
            message: 'NextAuth: Error in authorize',
            error: error instanceof Error ? error : new Error(String(error)),
            context: { service: 'NextAuth', operation: 'authorize', email: credentials?.email }
          });
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
      if (user) {
        token.id = user.id;
        token.sub = user.id; // Set sub for getToken compatibility
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.organizationId = user.organizationId;
        logger.debug({
          message: 'NextAuth: JWT callback - updated token with user data',
          context: { service: 'NextAuth', operation: 'jwt', userId: user.id, role: user.role }
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        logger.debug({
          message: 'NextAuth: Session callback - updated session with token data',
          context: { service: 'NextAuth', operation: 'session', userId: token.id, role: token.role }
        });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      // If redirecting to a relative URL, use baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If redirecting to the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default to dashboard
      return `${baseUrl}/dashboard`;
    },
  },
  debug: true, // Enable debug logging
};
