"use client";

import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { UserRole } from "@/lib/types";
import { Banknote, Clock } from "lucide-react";

export default function DisbursementPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DISBURSEMENT]}>
      <DashboardLayoutShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-purple-400" />
                Disbursement Module
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Authorizes payout and fund releases for SANCTIONED loans with banking transaction references.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Role: Disbursement / Admin
            </span>
          </div>

          <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-semibold text-white">Disbursement Queue Hook Ready</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Authentication and RBAC gating successfully verified! Sanctioned payouts and transaction reference logger will be active in Phase 4.
            </p>
          </div>
        </div>
      </DashboardLayoutShell>
    </ProtectedRoute>
  );
}
