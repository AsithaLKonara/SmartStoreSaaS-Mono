import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata = {
  title: {
    default: 'SmartStore SaaS | AI-Powered Commerce Platform',
    template: '%s | SmartStore SaaS'
  },
  description: 'The world\'s most advanced AI-powered multi-channel commerce automation platform for modern retail.',
  openGraph: {
    title: 'SmartStore SaaS - AI-Powered Commerce',
    description: 'AI-powered multi-channel commerce automation platform',
    type: 'website',
    locale: 'en_US',
    siteName: 'SmartStore SaaS'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartStore SaaS',
    description: 'AI-powered multi-channel commerce automation platform'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <QueryProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}