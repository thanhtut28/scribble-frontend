import apiClient from "../axios";
import {
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
} from "../types/auth";
import Cookies from "js-cookie";

// Cookie options
const cookieOptions = {
  expires: 7, // 7 days
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/signin",
      credentials,
    );

    // Store tokens in cookies
    Cookies.set("accessToken", response.data.accessToken, cookieOptions);
    Cookies.set("refreshToken", response.data.refreshToken, {
      ...cookieOptions,
      expires: 30, // 30 days for refresh token
    });

    return response.data;
  },

  // Register user
  signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/signup",
      credentials,
    );

    // Store tokens in cookies
    Cookies.set("accessToken", response.data.accessToken, cookieOptions);
    Cookies.set("refreshToken", response.data.refreshToken, {
      ...cookieOptions,
      expires: 30, // 30 days for refresh token
    });

    return response.data;
  },

  // Logout user
  logout: () => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    window.location.href = "/login";
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!Cookies.get("accessToken");
  },
};
