"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api";
import {
  Users,
  CheckCircle,
  Banknote,
  Receipt,
  ArrowRight,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

interface MetricsData {
  totalBorrowers: number;
  counts: {
    applied: number;
    sanctioned: number;
    disbursed: number;
    closed: number;
    rejected: number;
  };
  financials: {
    totalDisbursedAmount: number;
    totalCollectedAmount: number;
    totalOutstandingAmount: number;
  };
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // If user has a dedicated single role (not Admin), redirect directly to their module
  useEffect(() => {
    if (user) {
      if (user.role === UserRole.SALES) router.push("/dashboard/sales");
      else if (user.role === UserRole.SANCTION) router.push("/dashboard/sanction");
      else if (user.role === UserRole.DISBURSEMENT) router.push("/dashboard/disbursement");
      else if (user.role === UserRole.COLLECTION) router.push("/dashboard/collection");
    }
  }, [user, router]);

  const fetchMetrics = async () => {
    setLoading(true);
    const res = await apiClient<MetricsData>("/dashboard/admin/metrics");
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchMetrics();
    }
  }, [user]);

  if (user?.role !== UserRole.ADMIN) {
    return (
      <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SALES, UserRole.SANCTION, UserRole.DISBURSEMENT, UserRole.COLLECTION]}>
        <DashboardLayoutShell>
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Redirecting to your role module...</p>
          </div>
        </DashboardLayoutShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <DashboardLayoutShell>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Admin Executive Overview
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time operational KPIs and full access to all 4 lifecycle modules.
              </p>
            </div>

            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition self-start"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* KPI Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Disbursed Capital
                </span>
                <Banknote className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">
                ₹{metrics?.financials.totalDisbursedAmount.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Active & closed loan originations
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Collections Received
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                ₹{metrics?.financials.totalCollectedAmount.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Total verified repayments across loans
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Outstanding Balance
                </span>
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-400 font-mono">
                ₹{metrics?.financials.totalOutstandingAmount.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Remaining principal + interest due
              </p>
            </div>
          </div>

          {/* Module Nav Cards */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
              Loan Lifecycle Operational Modules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "1. Sales Leads",
                  count: metrics?.totalBorrowers || 0,
                  countLabel: "Total Registered",
                  desc: "Monitor borrower registrations and drop-offs",
                  href: "/dashboard/sales",
                  icon: Users,
                  color: "from-blue-600/20 to-blue-500/5",
                  border: "border-blue-500/30",
                  badge: "Sales / Admin",
                },
                {
                  title: "2. Sanction Queue",
                  count: metrics?.counts.applied || 0,
                  countLabel: "Awaiting Decision",
                  desc: "Underwrite, inspect slips, approve or reject",
                  href: "/dashboard/sanction",
                  icon: CheckCircle,
                  color: "from-amber-600/20 to-amber-500/5",
                  border: "border-amber-500/30",
                  badge: "Sanction / Admin",
                },
                {
                  title: "3. Disbursement",
                  count: metrics?.counts.sanctioned || 0,
                  countLabel: "Awaiting Payout",
                  desc: "Release funds & log bank transaction refs",
                  href: "/dashboard/disbursement",
                  icon: Banknote,
                  color: "from-purple-600/20 to-purple-500/5",
                  border: "border-purple-500/30",
                  badge: "Disbursement / Admin",
                },
                {
                  title: "4. Collection",
                  count: metrics?.counts.disbursed || 0,
                  countLabel: "Active Repaying",
                  desc: "Log payments, unique UTRs, auto-close",
                  href: "/dashboard/collection",
                  icon: Receipt,
                  color: "from-emerald-600/20 to-emerald-500/5",
                  border: "border-emerald-500/30",
                  badge: "Collection / Admin",
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    onClick={() => router.push(card.href)}
                    className={`p-6 rounded-2xl bg-gradient-to-b ${card.color} border ${card.border} hover:scale-[1.02] cursor-pointer transition flex flex-col justify-between shadow-xl`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-white">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {card.badge}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white mb-1">{card.title}</h4>
                      <p className="text-xs text-slate-400 mb-4">{card.desc}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-white font-mono">
                          {card.count}
                        </span>
                        <p className="text-[10px] text-slate-500">{card.countLabel}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DashboardLayoutShell>
    </ProtectedRoute>
  );
}
