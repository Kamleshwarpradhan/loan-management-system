"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { AuthResponse } from "@/lib/types";
import { CreditSeaLogo } from "@/components/CreditSeaLogo";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-sky-50 via-white to-slate-100">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-sky-500/5">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <CreditSeaLogo size={42} />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Borrowing made easy • Lending Lifecycle Platform
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#0066FF] hover:bg-[#0052cc] active:bg-[#003d99] text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to CreditSea</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          New borrower?{" "}
          <Link href="/register" className="text-[#0066FF] hover:underline font-semibold">
            Create an account
          </Link>
        </div>

        {/* Quick evaluation credentials */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 mb-2.5 text-center uppercase tracking-wider">
            Quick Fill Demo Accounts (pwd: password123)
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
                className="px-2 py-1.5 text-xs bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 hover:text-[#0066FF] transition text-center font-medium truncate"
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
