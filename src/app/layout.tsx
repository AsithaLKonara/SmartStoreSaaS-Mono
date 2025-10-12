import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';

export const metadata = {
  title: 'SmartStore SaaS',
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
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}