"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { AuthResponse } from "@/lib/types";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await apiClient<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (res.success && res.data) {
      login(res.data.token, res.data.user);
    } else {
      setError(res.message || "Failed to login. Please check your credentials.");
    }
  };

  const fillQuickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Loan Management System</h1>
          <p className="text-sm text-slate-400 mt-2">Sign in to your portal or operations dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          New borrower?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-4 hover:underline">
            Create an account
          </Link>
        </div>

        {/* Quick evaluation credentials */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs font-medium text-slate-400 mb-2 text-center uppercase tracking-wider">
            Quick Fill Test Accounts (pwd: password123)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Admin", email: "admin@lms.com" },
              { label: "Sales", email: "sales@lms.com" },
              { label: "Sanction", email: "sanction@lms.com" },
              { label: "Disbursement", email: "disbursement@lms.com" },
              { label: "Collection", email: "collection@lms.com" },
              { label: "Borrower", email: "borrower@lms.com" },
            ].map((role) => (
              <button
                key={role.email}
                type="button"
                onClick={() => fillQuickLogin(role.email)}
                className="px-2.5 py-1.5 text-xs bg-slate-800/60 hover:bg-indigo-950 hover:border-indigo-500/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-indigo-300 transition text-center truncate"
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
