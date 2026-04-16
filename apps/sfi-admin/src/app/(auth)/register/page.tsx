import type { Metadata } from 'next';

import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      imageSide="right"
      imageSrc="/images/auth/register.png"
      imageAlt="Person working at a home office"
      subtitle="Create your own deals here"
    >
      <RegisterForm />
    </AuthSplitLayout>
  );
}
