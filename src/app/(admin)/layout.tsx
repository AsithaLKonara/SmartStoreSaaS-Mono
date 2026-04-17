import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platform Administration | SmartStore SaaS',
  description: 'Enterprise-grade platform management and multi-tenant monitoring for the SmartStore ecosystem.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
