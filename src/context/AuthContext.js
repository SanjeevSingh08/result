"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is already authenticated
    const auth = localStorage.getItem("tournament_auth");
    console.log("Initial auth check:", auth);
    if (auth === "true") {
      setIsAuthenticated(true);
      // Redirect to home if on login page
      if (pathname === "/login") {
        router.push("/");
      }
    } else {
      // Redirect to login if not authenticated and not on login page
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
    setIsLoading(false);
  }, [pathname, router]);

  const login = (password) => {
    console.log("Attempting login with password:", password);
    // Hardcoded password for authentication
    if (password === "dmes9021") {
      console.log("Password match successful");
      setIsAuthenticated(true);
      localStorage.setItem("tournament_auth", "true");
      router.push("/");
      return true;
    }
    console.log("Password match failed");
    return false;
  };

  const logout = () => {
    console.log("Logging out");
    setIsAuthenticated(false);
    localStorage.removeItem("tournament_auth");
    router.push("/login");
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
