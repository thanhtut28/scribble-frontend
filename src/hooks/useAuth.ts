import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../lib/services/auth.service";
import {
  LoginCredentials,
  SignupCredentials,
  User,
  AuthResponse,
  TokenPayload,
} from "../lib/types/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Extract user from token
  useEffect(() => {
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

  // Logout mutation
  const logout = useMutation<void, Error, void>({
    mutationFn: () => {
      console.log("Logging out, clearing tokens");
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      setUser(undefined);
      queryClient.removeQueries({ queryKey: ["currentUser"] });
      router.push("/login");
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoadingUser,
    login,
    signup,
    logout,
  };
};
