import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/LoginForm';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return (
    <AuthSplitLayout
      imageSide="left"
      imageSrc="/images/auth/login.png"
      imageAlt="Person working at a desk"
      subtitle="Create your own deals here"
    >
      <LoginForm />
    </AuthSplitLayout>
  );
}
