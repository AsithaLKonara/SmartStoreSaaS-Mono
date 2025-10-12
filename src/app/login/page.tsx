import LoginForm from '@/components/LoginForm';
import Head from 'next/head';

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - SmartStore SaaS</title>
        <meta name="description" content="Sign in to your SmartStore SaaS account to manage your business operations." />
        <meta name="keywords" content="login, sign in, smartstore, saas, business management" />
        <meta property="og:title" content="Login - SmartStore SaaS" />
        <meta property="og:description" content="Sign in to your SmartStore SaaS account to manage your business operations." />
        <meta property="og:type" content="website" />
      </Head>
      <LoginForm />
    </>
  );
}
