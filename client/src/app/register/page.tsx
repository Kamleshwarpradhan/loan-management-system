"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { AuthResponse } from "@/lib/types";
import { CreditSeaLogo } from "@/components/CreditSeaLogo";
import { Lock, Mail, User, Phone, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    const res = await apiClient<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    setLoading(false);

    if (res.success && res.data) {
      login(res.data.token, res.data.user);
    } else {
      if (res.errors && res.errors.length > 0) {
        setErrors(res.errors);
      } else {
        setErrors([res.message || "Failed to register. Please check your inputs."]);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-sky-50 via-white to-slate-100">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-sky-500/5">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <CreditSeaLogo size={42} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            Apply for Quick Credit
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Create an account to start your instant loan journey
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs space-y-1">
            {errors.map((err, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rohan Sharma"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="rohan@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Phone Number (10 Digits)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                name="phone"
                required
                maxLength={10}
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password (Min 6 Characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 bg-[#0066FF] hover:bg-[#0052cc] active:bg-[#003d99] text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create CreditSea Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="text-[#0066FF] hover:underline font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
