import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
});

type EnvVars = z.infer<typeof envSchema>;

/**
 * Lazily validated env: only parsed on first access so that `next build`
 * can prerender static pages without requiring `NEXT_PUBLIC_API_URL` at
 * build time (it's only needed at runtime / in client bundles).
 */
let _env: EnvVars | undefined;

export function getEnv(): EnvVars {
  if (!_env) {
    _env = envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    });
  }
  return _env;
}

/** @deprecated Use `getEnv()`. Kept as a proxy for backwards compatibility. */
export const env: EnvVars = new Proxy({} as EnvVars, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof EnvVars];
  },
});

export type Env = EnvVars;
