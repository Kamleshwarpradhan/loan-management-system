"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import { ShieldCheck, ArrowRight, Activity, Users, CheckCircle, Banknote, Receipt } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If user has a specific operational role (not Admin), redirect them directly to their dedicated module
  useEffect(() => {
    if (user) {
      if (user.role === UserRole.SALES) router.push("/dashboard/sales");
      else if (user.role === UserRole.SANCTION) router.push("/dashboard/sanction");
      else if (user.role === UserRole.DISBURSEMENT) router.push("/dashboard/disbursement");
      else if (user.role === UserRole.COLLECTION) router.push("/dashboard/collection");
    }
  }, [user, router]);

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SALES, UserRole.SANCTION, UserRole.DISBURSEMENT, UserRole.COLLECTION]}>
      <DashboardLayoutShell>
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">System Executive Overview</h2>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-indigo-400 font-semibold">{user?.name}</span>. You are logged in with the{" "}
              <span className="text-indigo-400 font-semibold">{user?.role}</span> role.
            </p>
          </div>

          {user?.role === UserRole.ADMIN ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Sales Module", desc: "Track unsubmitted borrower registrations", href: "/dashboard/sales", icon: Users, color: "from-blue-600/20 to-blue-500/5", border: "border-blue-500/30" },
                { title: "Sanction Module", desc: "Underwrite, approve or reject applications", href: "/dashboard/sanction", icon: CheckCircle, color: "from-amber-600/20 to-amber-500/5", border: "border-amber-500/30" },
                { title: "Disbursement", desc: "Authorize funds release to verified borrowers", href: "/dashboard/disbursement", icon: Banknote, color: "from-purple-600/20 to-purple-500/5", border: "border-purple-500/30" },
                { title: "Collection", desc: "Track repayments, record UTRs and auto-close", href: "/dashboard/collection", icon: Receipt, color: "from-emerald-600/20 to-emerald-500/5", border: "border-emerald-500/30" },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    onClick={() => router.push(card.href)}
                    className={`p-6 rounded-2xl bg-gradient-to-b ${card.color} border ${card.border} hover:scale-[1.02] cursor-pointer transition flex flex-col justify-between`}
                  >
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-white">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">{card.title}</h3>
                      <p className="text-xs text-slate-400">{card.desc}</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-indigo-400">
                      <span>Launch module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto">
              <Activity className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Redirecting to your module...</h3>
              <p className="text-xs text-slate-400 mb-6">
                As a {user?.role} executive, you have dedicated access to your operations lifecycle module.
              </p>
            </div>
          )}
        </div>
      </DashboardLayoutShell>
    </ProtectedRoute>
  );
}
