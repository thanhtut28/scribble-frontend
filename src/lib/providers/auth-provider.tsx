"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "../types/auth";
import {
  LoginCredentials,
  SignupCredentials,
  AuthResponse,
} from "../types/auth";
import { UseMutationResult } from "@tanstack/react-query";

interface AuthContextType {
  user: User | undefined;
  isAuthenticated: boolean;
  isLoadingUser: boolean;
  login: UseMutationResult<AuthResponse, Error, LoginCredentials, unknown>;
  signup: UseMutationResult<AuthResponse, Error, SignupCredentials, unknown>;
  logout: UseMutationResult<void, Error, void, unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
