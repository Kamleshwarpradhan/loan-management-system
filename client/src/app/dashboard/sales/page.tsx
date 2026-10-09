"use client";

import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { UserRole } from "@/lib/types";
import { Users, Clock } from "lucide-react";

export default function SalesPage() {
  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SALES]}>
      <DashboardLayoutShell>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Sales & Lead Tracking Module
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Monitors borrowers who registered but haven't submitted a completed loan application.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Role: Sales / Admin
            </span>
          </div>

          <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-semibold text-white">Sales Pipeline Hook Ready</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Authentication and RBAC gating successfully verified! Lead data table will be populated in Phase 4.
            </p>
          </div>
        </div>
      </DashboardLayoutShell>
    </ProtectedRoute>
  );
}
