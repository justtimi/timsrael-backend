export interface AccessTokenPayload {
  id: string;
  isAdmin: boolean;
  email: string;
}

export interface RefreshTokenPayload {
  id: string;
}
