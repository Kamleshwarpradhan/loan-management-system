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
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-500" />
                Sanction & Underwriting Queue
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review submitted APPLIED loans, inspect borrower profile & salary slips, then approve or reject.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchApplications}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Queue</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Pending Decisions: {applications.length}
              </span>
            </div>
          </div>

          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Applications Queue */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading sanction queue...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">Underwriting Queue Clear</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are no pending loan applications waiting for underwriting review.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const isExpanded = expandedLoanId === app._id;
                  return (
                    <div key={app._id} className="p-6 transition hover:bg-sky-50/20">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-extrabold text-slate-900 font-mono">
                              ₹{app.amount.toLocaleString("en-IN")}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-[#0066FF] border border-blue-200">
                              {app.status}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Tenure: <strong className="text-slate-800">{app.tenureDays} Days</strong>
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Total Repayment: <strong className="text-[#0066FF]">₹{app.totalRepayment.toLocaleString("en-IN")}</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{app.borrower.name}</span>
                            </div>
                            <span>•</span>
                            <span>{app.borrower.email}</span>
                            <span>•</span>
                            <span>{app.borrower.phone}</span>
                            <span>•</span>
                            <span className="text-slate-400">
                              Applied: {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setExpandedLoanId(isExpanded ? null : app._id)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
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
                            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            disabled={actionLoading === app._id}
                            onClick={() => handleApprove(app._id)}
                            className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-blue-500/20 disabled:opacity-50"
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

                      {/* Expandable Drawer */}
                      {isExpanded && (
                        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              PAN Number
                            </p>
                            <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                              {app.borrower.pan || "N/A"}
                            </p>

                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-3">
                              Employment Mode
                            </p>
                            <p className="text-xs font-bold text-slate-800 mt-0.5">
                              {app.borrower.employmentMode || "N/A"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Monthly Salary
                            </p>
                            <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
                              ₹{app.borrower.salary?.toLocaleString("en-IN") || "N/A"}
                            </p>

                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-3">
                              BRE Engine Status
                            </p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              {app.borrower.breStatus || "PASSED"}
                            </span>
                          </div>

                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                              Salary Slip Document
                            </p>
                            {app.borrower.salarySlipUrl ? (
                              <div className="mt-1">
                                <a
                                  href={`http://localhost:5000${app.borrower.salarySlipUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-[#0066FF] hover:underline font-bold"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>View Uploaded Salary Slip</span>
                                </a>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 mt-0.5">No document found</p>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
                  <XCircle className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">Reject Loan Application</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Please provide a mandatory reason for rejecting this application.
                </p>

                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Salary slip unreadable, high risk profile, debt-to-income ratio exceeds limits..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalLoanId(null);
                      setRejectionReason("");
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!rejectionReason.trim()}
                    onClick={handleReject}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-red-500/20 disabled:opacity-50"
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
