"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Login form submitted");

    try {
      console.log("Attempting login...");
      const success = login(password);
      console.log("Login result:", success);

      if (!success) {
        console.log("Login failed, showing error");
        toast.error("Invalid password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <ToastContainer position="top-center" theme="dark" />
      <main className="max-w-md mx-auto mt-20">
        <div className="bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20">
          <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Tournament Hub
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-700 text-white border-2 border-purple-500/30 focus:border-purple-500 outline-none transition-all duration-300"
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <span className="text-white font-semibold">
                {isLoading ? "Verifying..." : "Login"}
              </span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
