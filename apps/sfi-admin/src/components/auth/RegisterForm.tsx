'use client';

import { useRouter } from 'next/navigation';
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
import { useRegister } from '@/hooks/auth/useRegister';
import type { ApiErrorBody } from '@/types/api.types';

const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required').max(100, 'Full name is too long'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setFormError(null);
    registerMutation.mutate(
      {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          toast.success('Account created! Welcome aboard.');
          router.push(ROUTES.DASHBOARD);
        },
        onError: (error) => {
          if (error instanceof AxiosError) {
            const body = error.response?.data as ApiErrorBody | undefined;
            if (error.response?.status === 409) {
              const msg = 'An account with this email already exists.';
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
      },
    );
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormError message={formError ?? undefined} />

      <div className="flex flex-col gap-4">
        {/* Full Name */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="fullName">
            Full Name <RequiredMark />
          </Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Enter your full name..."
            aria-invalid={Boolean(errors.fullName)}
            {...register('fullName')}
          />
          <FieldError message={errors.fullName?.message} />
        </div>

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
            autoComplete="new-password"
            placeholder="Enter your password..."
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="confirmPassword">
            Confirm Password <RequiredMark />
          </Label>
          <PasswordField
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password..."
            aria-invalid={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
      </Button>

      <p className="flex items-center justify-center gap-1 text-[16px] leading-[20px] tracking-[0.032px] text-foreground">
        Already have an account?
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
