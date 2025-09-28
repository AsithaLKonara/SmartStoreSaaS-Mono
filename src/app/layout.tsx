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
        {children}
      </body>
    </html>
  );
}