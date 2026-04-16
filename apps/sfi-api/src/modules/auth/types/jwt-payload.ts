export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
  role: 'ADMIN' | 'USER';
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string; // user id
  jti: string; // refresh token id (matches RefreshToken.id)
  type: 'refresh';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}
