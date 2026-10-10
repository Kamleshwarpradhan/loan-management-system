"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api";
import {
  Receipt,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  IndianRupee,
  Hash,
  Calendar,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";

interface CollectionLoan {
  _id: string;
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: string;
  disbursedAt?: string;
  disbursementRef?: string;
  closedAt?: string;
  borrowerId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface PaymentRecord {
  _id: string;
  amount: number;
  utrNumber: string;
  paymentDate: string;
  recordedBy?: {
    name: string;
    email: string;
  };
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<CollectionLoan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Payment Recording Modal State
  const [paymentModalLoan, setPaymentModalLoan] = useState<CollectionLoan | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");

  // Payment History Drawer
  const [historyLoanId, setHistoryLoanId] = useState<string | null>(null);
  const [historyPayments, setHistoryPayments] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const fetchCollectionLoans = async () => {
    setLoading(true);
    setActionError(null);
    const res = await apiClient<{ loans: CollectionLoan[]; count: number }>(
      "/dashboard/collection/loans"
    );
    if (res.success && res.data?.loans) {
      setLoans(res.data.loans);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCollectionLoans();
    setPaymentDate(new Date().toISOString().split("T")[0]);
  }, []);

  const handleRecordPayment = async () => {
    if (!paymentModalLoan) return;
    const numAmount = Number(payAmount);

    if (!numAmount || numAmount <= 0) {
      setActionError("Payment amount must be greater than zero.");
      return;
    }

    if (!utrNumber.trim()) {
      setActionError("UTR Number is required and must be unique.");
      return;
    }

    setActionLoading(paymentModalLoan._id);
    setActionError(null);
    setActionSuccess(null);

    const res = await apiClient<{
      loan: { totalPaid: number; outstandingBalance: number; status: string; autoClosed: boolean };
    }>(`/dashboard/collection/${paymentModalLoan._id}/payment`, {
      method: "POST",
      body: JSON.stringify({
        amount: numAmount,
        utrNumber: utrNumber.trim().toUpperCase(),
        paymentDate,
      }),
    });

    setActionLoading(null);

    if (res.success && res.data) {
      setActionSuccess(res.message);
      // Update local state for immediate feedback
      setLoans((prev) =>
        prev.map((l) =>
          l._id === paymentModalLoan._id
            ? {
                ...l,
                totalPaid: res.data!.loan.totalPaid,
                outstandingBalance: res.data!.loan.outstandingBalance,
                status: res.data!.loan.status,
              }
            : l
        )
      );

      // If drawer was open for this loan, refresh its payment history
      if (historyLoanId === paymentModalLoan._id) {
        loadHistory(paymentModalLoan._id);
      }

      setPaymentModalLoan(null);
      setPayAmount("");
      setUtrNumber("");
    } else {
      setActionError(res.message || "Failed to record payment.");
    }
  };

  const loadHistory = async (loanId: string) => {
    if (historyLoanId === loanId) {
      setHistoryLoanId(null);
      return;
    }

    setHistoryLoanId(loanId);
    setHistoryLoading(true);

    const res = await apiClient<{ payments: PaymentRecord[] }>(
      `/dashboard/collection/${loanId}/payments`
    );

    if (res.success && res.data?.payments) {
      setHistoryPayments(res.data.payments);
    }

    setHistoryLoading(false);
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.COLLECTION]}>
      <DashboardLayoutShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Collection & Repayment Module
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Record borrower repayments, validate unique UTRs, monitor balance reductions, and trigger auto-closure.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchCollectionLoans}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Ledger</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Active/Closed Loans: {loans.length}
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

          {/* Collection Ledger */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading collection ledger...</p>
              </div>
            ) : loans.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No Disbursed Loans</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no active or closed loans in the collection ledger yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {loans.map((loan) => {
                  const isClosed = loan.status === "CLOSED";
                  const percentPaid = Math.min(
                    100,
                    Math.round((loan.totalPaid / loan.totalRepayment) * 100)
                  );
                  const isHistoryOpen = historyLoanId === loan._id;

                  return (
                    <div key={loan._id} className="p-6 transition hover:bg-slate-900/40">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Borrower & Amount */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-white">
                              {loan.borrowerId?.name}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                isClosed
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              }`}
                            >
                              {loan.status}
                            </span>
                            <span className="text-xs text-slate-500">
                              Disbursed: {loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString() : "Recent"}
                            </span>
                            {loan.disbursementRef && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                Ref: {loan.disbursementRef}
                              </span>
                            )}
                          </div>

                          {/* Financials Overview Bar */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                Principal
                              </p>
                              <p className="text-xs font-bold text-white font-mono">
                                ₹{loan.amount.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                Total Repayment
                              </p>
                              <p className="text-xs font-bold text-indigo-300 font-mono">
                                ₹{loan.totalRepayment.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                Paid So Far
                              </p>
                              <p className="text-xs font-bold text-emerald-400 font-mono">
                                ₹{loan.totalPaid.toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase font-semibold">
                                Outstanding
                              </p>
                              <p
                                className={`text-xs font-bold font-mono ${
                                  isClosed ? "text-slate-500" : "text-amber-400"
                                }`}
                              >
                                ₹{loan.outstandingBalance.toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2 max-w-md">
                            <div
                              className={`h-full transition-all duration-500 ${
                                isClosed ? "bg-emerald-500" : "bg-indigo-500"
                              }`}
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => loadHistory(loan._id)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <History className="w-3.5 h-3.5 text-slate-400" />
                            <span>Payments History</span>
                            {isHistoryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {!isClosed ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentModalLoan(loan);
                                setPayAmount(String(loan.outstandingBalance));
                                setUtrNumber(`UTR${Date.now().toString().slice(-8)}`);
                              }}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Record Payment</span>
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Settled & Closed</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Payment History Sub-drawer */}
                      {isHistoryOpen && (
                        <div className="mt-6 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-400" />
                            <span>Payment History Ledger ({loan.borrowerId?.name})</span>
                          </h4>

                          {historyLoading ? (
                            <div className="py-4 text-center">
                              <RefreshCw className="w-4 h-4 text-slate-400 animate-spin mx-auto" />
                            </div>
                          ) : historyPayments.length === 0 ? (
                            <p className="text-xs text-slate-500">No payments recorded for this loan yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {historyPayments.map((p) => (
                                <div
                                  key={p._id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-emerald-400 font-mono">
                                      + ₹{p.amount.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-slate-400 font-mono">
                                      UTR: <strong className="text-slate-200">{p.utrNumber}</strong>
                                    </span>
                                  </div>
                                  <div className="text-slate-500 text-[11px]">
                                    {new Date(p.paymentDate).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Record Payment Modal */}
          {paymentModalLoan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Record Borrower Repayment
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Borrower: <strong className="text-white">{paymentModalLoan.borrowerId?.name}</strong> • Remaining Balance:{" "}
                  <strong className="text-amber-400 font-mono">
                    ₹{paymentModalLoan.outstandingBalance.toLocaleString("en-IN")}
                  </strong>
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Payment Amount (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        required
                        min={1}
                        max={paymentModalLoan.outstandingBalance}
                        placeholder="e.g. 50000"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500">
                      <span>Full repayment auto-closes loan</span>
                      <button
                        type="button"
                        onClick={() => setPayAmount(String(paymentModalLoan.outstandingBalance))}
                        className="text-emerald-400 hover:underline font-semibold"
                      >
                        Set Full Balance
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      UTR Number (Must be Unique)
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. UTR12345678"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Payment Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentModalLoan(null)}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      actionLoading === paymentModalLoan._id ||
                      !Number(payAmount) ||
                      !utrNumber.trim()
                    }
                    onClick={handleRecordPayment}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    {actionLoading === paymentModalLoan._id ? (
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      "Record Payment"
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
