// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  // Game stats
  gamesPlayed?: number;
  gamesWon?: number;
  totalScore?: number;
}

// Auth Types
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  usernameOrEmail?: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  username: string;
  password: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}
