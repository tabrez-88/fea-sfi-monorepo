'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, RequiredMark } from '@/components/ui/label';
import { FieldError, FormError } from '@/components/auth/FormError';
import { PasswordField } from '@/components/auth/PasswordField';
import { ROUTES } from '@/constants/routes';
import { useLogin } from '@/hooks/auth/useLogin';
import type { ApiErrorBody } from '@/types/api.types';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: LoginFormValues) => {
    setFormError(null);
    login.mutate(values, {
      onSuccess: () => {
        toast.success('Signed in successfully!');
        const next = searchParams.get('next');
        router.push(next && next.startsWith('/') ? next : ROUTES.DASHBOARD);
      },
      onError: (error) => {
        if (error instanceof AxiosError) {
          const body = error.response?.data as ApiErrorBody | undefined;
          if (error.response?.status === 401) {
            const msg = 'Invalid email or password.';
            setFormError(msg);
            toast.error(msg);
            return;
          }
          const msg = Array.isArray(body?.message)
            ? body.message.join(', ')
            : (body?.message ?? 'Something went wrong. Please try again.');
          setFormError(msg);
          toast.error(msg);
          return;
        }
        const msg = 'Network error — please try again.';
        setFormError(msg);
        toast.error(msg);
      },
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormError message={formError ?? undefined} />

      <div className="flex flex-col gap-4">
        {/* Email */}
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

        {/* Password */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">
            Password <RequiredMark />
          </Label>
          <PasswordField
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password..."
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>
      </div>

      {/* Forget password link + Sign In button */}
      <div className="flex flex-col items-start gap-2">
        <Link
          href={ROUTES.FORGOT_PASSWORD}
          className="border-b border-foreground py-[2px] text-[16px] leading-[20px] tracking-[0.032px] text-foreground"
        >
          Forgot password?
        </Link>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign In'}
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1 text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
        Don&apos;t have an account?
        <Link
          href={ROUTES.REGISTER}
          className="border-b border-foreground py-[2px] font-semibold text-foreground"
        >
          Sign Up
        </Link>
      </p>
    </form>
  );
}
