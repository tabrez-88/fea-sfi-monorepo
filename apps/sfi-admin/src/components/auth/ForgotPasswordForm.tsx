'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, RequiredMark } from '@/components/ui/label';
import { FieldError, FormError } from '@/components/auth/FormError';
import { ROUTES } from '@/constants/routes';
import { useForgotPassword } from '@/hooks/auth/useForgotPassword';
import type { ApiErrorBody } from '@/types/api.types';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);
  const forgot = useForgotPassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: ForgotFormValues) => {
    setFormError(null);
    forgot.mutate(values, {
      onSuccess: (response) => setSentToEmail(response.email),
      onError: (error) => {
        if (error instanceof AxiosError) {
          const body = error.response?.data as ApiErrorBody | undefined;
          setFormError(
            Array.isArray(body?.message)
              ? body.message.join(', ')
              : body?.message ?? 'Something went wrong. Please try again.',
          );
          return;
        }
        setFormError('Network error — please try again.');
      },
    });
  };

  const handleResend = () => {
    if (!sentToEmail) return;
    forgot.mutate({ email: sentToEmail });
  };

  const handleTryDifferent = () => {
    setSentToEmail(null);
    reset();
  };

  if (sentToEmail) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3 rounded-[8px] border border-border bg-white p-4">
          <MailCheck className="mt-0.5 size-5 text-foreground" />
          <div>
            <p className="text-[16px] font-semibold leading-[20px] text-foreground">
              Check your inbox
            </p>
            <p className="mt-1 text-[14px] leading-[20px] tracking-[0.2px] text-neutral">
              We sent a password reset link to{' '}
              <span className="font-semibold text-foreground">{sentToEmail}</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[14px] leading-[20px] text-neutral">
            Didn&apos;t receive it?
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleResend}
              disabled={forgot.isPending}
            >
              {forgot.isPending ? 'Resending…' : 'Resend'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleTryDifferent}
            >
              Try different email
            </Button>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1 text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
          Back to
          <Link
            href={ROUTES.LOGIN}
            className="border-b border-foreground py-[2px] font-semibold text-foreground"
          >
            Sign In
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormError message={formError ?? undefined} />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">
            Email <RequiredMark />
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email..."
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <Button type="submit" className="w-full" disabled={forgot.isPending}>
          {forgot.isPending ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1 text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
        Back to
        <Link
          href={ROUTES.LOGIN}
          className="border-b border-foreground py-[2px] font-semibold text-foreground"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
