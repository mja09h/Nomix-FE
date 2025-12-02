import React, { createContext, useState, useEffect, useContext } from "react";
import { getToken, setToken, removeToken } from "../api/storage";
import client from "../api/client";
import { jwtDecode } from "jwt-decode";
import { User } from "../types/User"; // Assuming this exists or I'll create/update it

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            await logout();
          } else {
            setUser(decoded); // Assuming the token payload has user info
          }
        } catch (error) {
          console.error("Invalid token", error);
          await logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (token: string) => {
    await setToken(token);
    try {
      const decoded: any = jwtDecode(token);
      setUser(decoded);
    } catch (e) {
      console.error("Failed to decode token on login", e);
    }
  };

  const logout = async () => {
    await removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
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
