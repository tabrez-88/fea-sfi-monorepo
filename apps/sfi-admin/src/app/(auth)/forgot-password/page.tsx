import type { Metadata } from 'next';

import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

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
