import type { Metadata } from 'next';

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';

export const metadata: Metadata = {
  title: 'Forgot Password',
};

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout
      imageSide="right"
      imageSrc="/images/auth/forgot-password.png"
      imageAlt="Team working together"
      subtitle="Forgot Password"
    >
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
