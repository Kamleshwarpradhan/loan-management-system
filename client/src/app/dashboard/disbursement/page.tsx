"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api";
import {
  Banknote,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  User,
  Calendar,
  Hash,
} from "lucide-react";

interface SanctionedLoan {
  _id: string;
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  status: string;
  sanctionedAt: string;
  borrowerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  sanctionedBy?: {
    name: string;
    email: string;
  };
}

export default function DisbursementPage() {
  const [loans, setLoans] = useState<SanctionedLoan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Disburse modal state
  const [disburseModalLoan, setDisburseModalLoan] = useState<SanctionedLoan | null>(null);
  const [disbursementRef, setDisbursementRef] = useState<string>("");
  const [disbursementDate, setDisbursementDate] = useState<string>("");

  const fetchSanctionedLoans = async () => {
    setLoading(true);
    setActionError(null);
    const res = await apiClient<{ loans: SanctionedLoan[]; count: number }>(
      "/dashboard/disbursement/sanctioned"
    );
    if (res.success && res.data?.loans) {
      setLoans(res.data.loans);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSanctionedLoans();
    setDisbursementDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleDisburse = async () => {
    if (!disburseModalLoan) return;
    if (!disbursementRef.trim()) {
      setActionError("Please provide a bank transaction reference number.");
      return;
    }

    setActionLoading(disburseModalLoan._id);
    setActionError(null);
    setActionSuccess(null);

    const res = await apiClient(
      `/dashboard/disbursement/${disburseModalLoan._id}/disburse`,
      {
        method: "PUT",
        body: JSON.stringify({
          disbursementRef: disbursementRef.trim().toUpperCase(),
          disbursementDate,
        }),
      }
    );

    setActionLoading(null);

    if (res.success) {
      setActionSuccess(
        `Loan of ₹${disburseModalLoan.amount.toLocaleString("en-IN")} marked as DISBURSED! Moved to Collection ledger.`
      );
      setLoans((prev) => prev.filter((l) => l._id !== disburseModalLoan._id));
      setDisburseModalLoan(null);
      setDisbursementRef("");
    } else {
      setActionError(res.message || "Failed to disburse loan.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DISBURSEMENT]}>
      <DashboardLayoutShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-purple-400" />
                Disbursement & Fund Release Module
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Release sanctioned capital to borrowers and log bank transaction reference details.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSanctionedLoans}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Queue</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Awaiting Disbursement: {loans.length}
              </span>
            </div>
          </div>

          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Sanctioned Loans Queue */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading disbursement queue...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No Loans Pending Disbursement</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All sanctioned loans have had their funds disbursed, or no loans are sanctioned yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Borrower</th>
                      <th className="py-3.5 px-4">Sanctioned Amount</th>
                      <th className="py-3.5 px-4">Tenure</th>
                      <th className="py-3.5 px-4">Total Repayment</th>
                      <th className="py-3.5 px-4">Sanctioned Date</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loans.map((loan) => (
                      <tr key={loan._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-4 font-semibold text-white">
                          <div>
                            <p className="text-xs font-bold text-white">{loan.borrowerId?.name}</p>
                            <p className="text-[11px] text-slate-400 font-normal">
                              {loan.borrowerId?.email} • {loan.borrowerId?.phone}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-emerald-400 font-mono text-sm">
                          ₹{loan.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {loan.tenureDays} Days
                        </td>
                        <td className="py-4 px-4 font-semibold text-indigo-300 font-mono">
                          ₹{loan.totalRepayment.toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {loan.sanctionedAt ? new Date(loan.sanctionedAt).toLocaleDateString() : "Recent"}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setDisburseModalLoan(loan);
                              setDisbursementRef(`TXN${Date.now().toString().slice(-6)}`);
                            }}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-lg shadow-purple-600/20"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Release Funds</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Disbursement Modal */}
          {disburseModalLoan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
                  <Banknote className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Authorize Loan Disbursement
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Confirm payout to borrower <strong className="text-white">{disburseModalLoan.borrowerId?.name}</strong> for sanctioned principal of{" "}
                  <strong className="text-emerald-400 font-mono">
                    ₹{disburseModalLoan.amount.toLocaleString("en-IN")}
                  </strong>.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Bank Transaction Reference / UTR
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. TXN98765432"
                        value={disbursementRef}
                        onChange={(e) => setDisbursementRef(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Disbursement Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="date"
                        required
                        value={disbursementDate}
                        onChange={(e) => setDisbursementDate(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDisburseModalLoan(null)}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading === disburseModalLoan._id || !disbursementRef.trim()}
                    onClick={handleDisburse}
                    className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-purple-600/30 disabled:opacity-50"
                  >
                    {actionLoading === disburseModalLoan._id ? (
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Confirm & Disburse"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayoutShell>
    </ProtectedRoute>
  );
}
