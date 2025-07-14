"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  socketService,
  SOCKET_AUTH_ERROR_EVENT,
  SocketError,
} from "@/lib/services/socket.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.service";
import {
  LoginCredentials,
  SignupCredentials,
  User,
  AuthResponse,
  TokenPayload,
} from "../types/auth";
import { jwtDecode } from "jwt-decode";
import { toast } from "sonner";

interface AuthContextType {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  login: ReturnType<typeof useMutation<AuthResponse, Error, LoginCredentials>>;
  signup: ReturnType<
    typeof useMutation<AuthResponse, Error, SignupCredentials>
  >;
  logout: () => void;
  handleAuthError: (error: SocketError) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isAuthenticated: false,
  isLoadingUser: false,
  login: {} as ReturnType<
    typeof useMutation<AuthResponse, Error, LoginCredentials>
  >,
  signup: {} as ReturnType<
    typeof useMutation<AuthResponse, Error, SignupCredentials>
  >,
  logout: () => {},
  handleAuthError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const authRoutes = [
  "/login",
  "/signup",
  "/forget-password",
  "/reset-password",
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Extract user from token
  useEffect(() => {
    // Skip token check on auth routes
    if (typeof window !== "undefined" && authRoutes.includes(pathname)) {
      setIsLoadingUser(false);
      return;
    }

    const token = Cookies.get("accessToken");
    setIsLoadingUser(true);

    if (token) {
      console.log("Auth token found:", token.substring(0, 10) + "...");
      try {
        // Get user info from the JWT token
        const decoded = jwtDecode<TokenPayload>(token);
        console.log("Token decoded, user ID:", decoded.sub);
        const userFromToken = {
          id: decoded.sub,
          email: decoded.email,
          username: decoded.email.split("@")[0], // Use email prefix as username if not in token
        };

        setUser(userFromToken);
        queryClient.setQueryData(["currentUser"], userFromToken);
      } catch (error) {
        console.error("Failed to decode token:", error);
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
      }
    } else {
      console.log("No auth token found");
    }

    setIsLoadingUser(false);
  }, [queryClient]);

  // Login mutation
  const login = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["currentUser"], data.user);
      console.log("Login successful, token received");
      router.push("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });

  // Signup mutation
  const signup = useMutation<AuthResponse, Error, SignupCredentials>({
    mutationFn: (credentials: SignupCredentials) =>
      authService.signup(credentials),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(["currentUser"], data.user);
      console.log("Signup successful, token received");
      router.push("/");
    },
  });

  const logout = () => {
    console.log("Logging out, clearing tokens");
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    setUser(undefined);
    socketService.disconnect();
    queryClient.removeQueries({ queryKey: ["currentUser"] });
    router.push("/login");
  };

  useEffect(() => {
    // Listen for socket authentication errors
    const handleSocketAuthError = (event: CustomEvent<SocketError>) => {
      handleAuthError(event.detail);
    };

    // Register global event listener for socket auth errors
    if (typeof window !== "undefined") {
      window.addEventListener(
        SOCKET_AUTH_ERROR_EVENT,
        handleSocketAuthError as EventListener,
      );
    }

    // Register socket-specific auth error handler
    const unsubscribe = socketService.onAuthError(handleAuthError);

    return () => {
      // Cleanup event listeners
      if (typeof window !== "undefined") {
        window.removeEventListener(
          SOCKET_AUTH_ERROR_EVENT,
          handleSocketAuthError as EventListener,
        );
      }
      unsubscribe();
    };
  }, [router]);

  const handleAuthError = (error: SocketError) => {
    console.error("Auth error:", error);

    // Handle token expired or auth failed errors
    if (error.code === "TOKEN_EXPIRED" || error.code === "AUTH_FAILED") {
      // Show a notification or alert to the user
      alert(error.message || "Your session has expired. Please log in again.");

      // Clear auth data and redirect
      logout();

      // Redirect to login page or specific redirect URL if provided
      if (error.redirectTo) {
        router.push(error.redirectTo);
      } else {
        router.push("/login");
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoadingUser,
        login,
        signup,
        logout,
        handleAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
