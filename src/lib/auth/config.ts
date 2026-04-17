import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
              mfaEnabled: true,
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
            mfaEnabled: user.mfaEnabled,
          };

          logger.info({
            message: 'NextAuth: Authentication successful',
            context: { service: 'NextAuth', operation: 'authorize', email: user.email, userId: user.id, role: user.role, mfaEnabled: user.mfaEnabled }
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
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NEXT_PUBLIC_DOMAIN 
          ? `.${process.env.NEXT_PUBLIC_DOMAIN.replace('http://', '').replace('https://', '').split(':')[0]}`
          : undefined, // Let it default for localhost development
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id; // Set sub for getToken compatibility
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.activeOrganizationId = user.organizationId;
        token.mfaEnabled = (user as any).mfaEnabled;
        token.mfaVerified = false; // Initially false if MFA is enabled

        logger.debug({
          message: 'NextAuth: JWT callback - updated token with user data',
          context: { service: 'NextAuth', operation: 'jwt', userId: user.id, role: user.role, mfaEnabled: (user as any).mfaEnabled }
        });
      }

      if (trigger === 'update' && session?.mfaVerified) {
        token.mfaVerified = session.mfaVerified;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
        session.user.mfaVerified = token.mfaVerified as boolean;
        
        logger.debug({
          message: 'NextAuth: Session callback - updated session with token data',
          context: { service: 'NextAuth', operation: 'session', userId: token.id, role: token.role, mfaVerified: token.mfaVerified }
        });
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return `${baseUrl}/dashboard`;
    },
  },
  debug: true, // Enable debug logging
};
