import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { AuthenticatedUser } from '../types/jwt-payload';

/**
 * Resolves the authenticated user attached to the request by JwtStrategy.
 * Usage:
 *   @Get('me')
 *   me(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
