"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  User,
  CreditCard,
  IndianRupee,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Application {
  _id: string;
  amount: number;
  tenureDays: number;
  interestRate: number;
  interestAmount: number;
  totalRepayment: number;
  status: string;
  createdAt: string;
  borrower: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    pan?: string;
    dob?: string;
    salary?: number;
    employmentMode?: string;
    salarySlipUrl?: string;
    breStatus?: string;
  };
}

export default function SanctionPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalLoanId, setRejectModalLoanId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Expanded borrower detail view
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setActionError(null);
    const res = await apiClient<{ applications: Application[]; count: number }>(
      "/dashboard/sanction/applications"
    );
    if (res.success && res.data?.applications) {
      setApplications(res.data.applications);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (loanId: string) => {
    setActionLoading(loanId);
    setActionError(null);
    setActionSuccess(null);

    const res = await apiClient(`/dashboard/sanction/${loanId}/approve`, {
      method: "PUT",
    });

    setActionLoading(null);

    if (res.success) {
      setActionSuccess("Loan application sanctioned successfully! Moved to Disbursement.");
      // Remove approved loan from pending queue
      setApplications((prev) => prev.filter((a) => a._id !== loanId));
    } else {
      setActionError(res.message || "Failed to approve loan.");
    }
  };

  const handleReject = async () => {
    if (!rejectModalLoanId) return;
    if (!rejectionReason.trim()) {
      setActionError("Please provide a rejection reason.");
      return;
    }

    setActionLoading(rejectModalLoanId);
    setActionError(null);
    setActionSuccess(null);

    const res = await apiClient(`/dashboard/sanction/${rejectModalLoanId}/reject`, {
      method: "PUT",
      body: JSON.stringify({ rejectionReason }),
    });

    setActionLoading(null);

    if (res.success) {
      setActionSuccess("Loan application rejected and reason recorded.");
      setApplications((prev) => prev.filter((a) => a._id !== rejectModalLoanId));
      setRejectModalLoanId(null);
      setRejectionReason("");
    } else {
      setActionError(res.message || "Failed to reject loan.");
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SANCTION]}>
      <DashboardLayoutShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" />
                Sanction & Underwriting Queue
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Review submitted APPLIED loans, inspect borrower profile & salary slips, then approve or reject.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchApplications}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Queue</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Pending Decisions: {applications.length}
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

          {/* Applications Queue */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading sanction queue...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">Underwriting Queue Clear</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no pending loan applications waiting for underwriting review.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {applications.map((app) => {
                  const isExpanded = expandedLoanId === app._id;
                  return (
                    <div key={app._id} className="p-6 transition hover:bg-slate-900/40">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Summary Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-white font-mono">
                              ₹{app.amount.toLocaleString("en-IN")}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
                              {app.status}
                            </span>
                            <span className="text-xs text-slate-400">
                              Tenure: <strong className="text-white">{app.tenureDays} Days</strong>
                            </span>
                            <span className="text-xs text-slate-400">
                              Total Repayment: <strong className="text-indigo-400">₹{app.totalRepayment.toLocaleString("en-IN")}</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-semibold">{app.borrower.name}</span>
                            </div>
                            <span>•</span>
                            <span>{app.borrower.email}</span>
                            <span>•</span>
                            <span>{app.borrower.phone}</span>
                            <span>•</span>
                            <span className="text-slate-500">
                              Applied: {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setExpandedLoanId(isExpanded ? null : app._id)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === app._id}
                            onClick={() => {
                              setRejectModalLoanId(app._id);
                              setRejectionReason("");
                            }}
                            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === app._id}
                            onClick={() => handleApprove(app._id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                          >
                            {actionLoading === app._id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                            <span>Approve Loan</span>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Borrower Details Drawer */}
                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                              PAN Number
                            </p>
                            <p className="text-xs font-semibold text-white font-mono mt-0.5">
                              {app.borrower.pan || "N/A"}
                            </p>

                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-3">
                              Employment Mode
                            </p>
                            <p className="text-xs font-semibold text-white mt-0.5">
                              {app.borrower.employmentMode || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                              Monthly Salary
                            </p>
                            <p className="text-xs font-semibold text-white mt-0.5">
                              ₹{app.borrower.salary?.toLocaleString("en-IN") || "N/A"}
                            </p>

                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-3">
                              BRE Engine Status
                            </p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {app.borrower.breStatus || "PASSED"}
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                              Salary Slip Document
                            </p>
                            {app.borrower.salarySlipUrl ? (
                              <div className="mt-1">
                                <a
                                  href={`http://localhost:5000${app.borrower.salarySlipUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Uploaded Salary Slip</span>
                                </a>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 mt-0.5">No document found</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejection Modal */}
          {rejectModalLoanId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
                  <XCircle className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Reject Loan Application</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Please provide a mandatory reason for rejecting this application. This reason will be recorded and visible to the borrower.
                </p>

                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Salary slip unreadable, high risk profile, debt-to-income ratio exceeds limits..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalLoanId(null);
                      setRejectionReason("");
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!rejectionReason.trim()}
                    onClick={handleReject}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-red-600/30 disabled:opacity-50"
                  >
                    Confirm Rejection
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
