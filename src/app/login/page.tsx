import LoginForm from '@/components/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - SmartStore SaaS',
  description: 'Sign in to your SmartStore SaaS account to manage your business operations.',
  keywords: 'login, sign in, smartstore, saas, business management',
  openGraph: {
    title: 'Login - SmartStore SaaS',
    description: 'Sign in to your SmartStore SaaS account to manage your business operations.',
    type: 'website',
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
