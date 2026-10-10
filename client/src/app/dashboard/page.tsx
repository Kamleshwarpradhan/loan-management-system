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
            <RefreshCw className="w-8 h-8 text-[#0066FF] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Redirecting to your module...</p>
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
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                CreditSea Executive Command Center
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Real-time loan origination metrics, liquidity tracking, and operational queues.
              </p>
            </div>

            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-blue-500/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Disbursed Capital
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 font-mono">
                ₹{metrics?.financials.totalDisbursedAmount.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Active & settled loan payouts
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-emerald-500/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Collections Received
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 font-mono">
                ₹{metrics?.financials.totalCollectedAmount.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Verified borrower repayments
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm shadow-amber-500/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Outstanding Balance
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-amber-600 font-mono">
                ₹{metrics?.financials.totalOutstandingAmount.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Remaining principal + interest due
              </p>
            </div>
          </div>

          {/* Module Launch Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
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
                  color: "bg-blue-50 text-[#0066FF]",
                  badge: "Sales / Admin",
                },
                {
                  title: "2. Sanction Queue",
                  count: metrics?.counts.applied || 0,
                  countLabel: "Awaiting Review",
                  desc: "Underwrite, inspect slips, approve or reject",
                  href: "/dashboard/sanction",
                  icon: CheckCircle,
                  color: "bg-amber-50 text-amber-600",
                  badge: "Sanction / Admin",
                },
                {
                  title: "3. Disbursement",
                  count: metrics?.counts.sanctioned || 0,
                  countLabel: "Awaiting Payout",
                  desc: "Release funds & log bank transaction refs",
                  href: "/dashboard/disbursement",
                  icon: Banknote,
                  color: "bg-purple-50 text-purple-600",
                  badge: "Disbursement / Admin",
                },
                {
                  title: "4. Collection",
                  count: metrics?.counts.disbursed || 0,
                  countLabel: "Active Repaying",
                  desc: "Log payments, unique UTRs, auto-close",
                  href: "/dashboard/collection",
                  icon: Receipt,
                  color: "bg-emerald-50 text-emerald-600",
                  badge: "Collection / Admin",
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    onClick={() => router.push(card.href)}
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {card.badge}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-800 mb-1">{card.title}</h4>
                      <p className="text-xs text-slate-500 mb-4">{card.desc}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-slate-900 font-mono">
                          {card.count}
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium">{card.countLabel}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0066FF]">
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
