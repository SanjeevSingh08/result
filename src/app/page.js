"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Tournament Hub
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-300"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link
            href="/extract-links"
            className="group bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Extract Tournament Links
              </h2>
            </div>
            <p className="text-gray-400">
              Fetch and manage tournament links from upcoming, live, and
              completed tournaments.
            </p>
          </Link>

          <Link
            href="/result-generator"
            className="group bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-white">
                Result Generator
              </h2>
            </div>
            <p className="text-gray-400">
              Calculate and track tournament results across multiple days with
              cumulative statistics.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
