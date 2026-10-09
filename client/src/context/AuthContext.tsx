"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IUserPublic, UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api";

interface AuthContextType {
  user: IUserPublic | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: IUserPublic) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUserPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("lms_token");
      const storedUser = localStorage.getItem("lms_user");

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token with /me endpoint in background
          const res = await apiClient<{ user: IUserPublic }>("/auth/me");
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("lms_user", JSON.stringify(res.data.user));
          } else {
            // Invalid or expired token
            logout();
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: IUserPublic) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("lms_token", newToken);
    localStorage.setItem("lms_user", JSON.stringify(newUser));

    // Role-based redirect
    if (newUser.role === UserRole.BORROWER) {
      router.push("/borrower");
    } else {
      router.push("/dashboard");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("lms_token");
    localStorage.removeItem("lms_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
