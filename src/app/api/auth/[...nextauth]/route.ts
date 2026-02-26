import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// App Router handler configuration for NextAuth v4
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
