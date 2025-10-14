import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata = {
  title: 'SmartStore SaaS - AI-Powered Commerce Platform',
  description: 'AI-powered multi-channel commerce automation platform',
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