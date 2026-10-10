"use client";

import React, { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  UserRole,
  EmploymentMode,
  BREStatus,
  IBorrowerProfile,
  ILoan,
  LoanStatus,
} from "@/lib/types";
import { apiClient } from "@/lib/api";
import {
  ShieldCheck,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  ArrowRight,
  RefreshCw,
  User,
  CreditCard,
  Calendar,
  Briefcase,
  IndianRupee,
  Clock,
  Sparkles,
  Sliders,
  CheckCircle,
  FileText,
  BadgeAlert,
  ChevronRight,
} from "lucide-react";

export default function BorrowerPortalPage() {
  const { user, logout } = useAuth();

  // Profile data & application state
  const [profile, setProfile] = useState<IBorrowerProfile | null>(null);
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Step 2: Form state
  const [fullName, setFullName] = useState("");
  const [pan, setPan] = useState("");
  const [dob, setDob] = useState("");
  const [salary, setSalary] = useState<string>("");
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode>(
    EmploymentMode.SALARIED
  );
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [breFailures, setBreFailures] = useState<string[]>([]);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Step 3: File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  // Step 4: Loan Calculator state
  // Loan Amount: ₹50,000 to ₹5,00,000
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  // Tenure: 30 to 365 days
  const [tenureDays, setTenureDays] = useState<number>(180);
  const [applyingLoan, setApplyingLoan] = useState<boolean>(false);
  const [loanApplyError, setLoanApplyError] = useState<string | null>(null);
  const [loanApplySuccess, setLoanApplySuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Simple Interest calculation:
  // SI = (P * R * T) / (365 * 100), with R = 12%
  const interestRate = 12;
  const exactSI = (loanAmount * interestRate * tenureDays) / (365 * 100);
  const simpleInterest = Math.round(exactSI * 100) / 100;
  const totalRepayment = Math.round((loanAmount + simpleInterest) * 100) / 100;
  const dailyInterest = Math.round((simpleInterest / tenureDays) * 100) / 100;

  // Active step calculation
  // 1: Auth, 2: Profile/BRE, 3: Salary slip, 4: Loan Config & Apply, 5: Applied view
  const hasAppliedLoan = loans.length > 0;
  let currentStep = 2;
  if (hasAppliedLoan) {
    currentStep = 4;
  } else if (profile?.salarySlipUrl) {
    currentStep = 4;
  } else if (profile?.breStatus === BREStatus.PASSED) {
    currentStep = 3;
  }

  // Fetch borrower profile and loans
  const loadData = async () => {
    setLoading(true);

    const [profileRes, loansRes] = await Promise.all([
      apiClient<IBorrowerProfile>("/borrower/profile"),
      apiClient<{ loans: ILoan[] }>("/loans/my-loans"),
    ]);

    if (profileRes.success && profileRes.data) {
      const p = profileRes.data;
      setProfile(p);
      setFullName(p.fullName || user?.name || "");
      setPan(p.pan || "");
      if (p.dob) {
        setDob(new Date(p.dob).toISOString().split("T")[0]);
      }
      setSalary(p.salary ? String(p.salary) : "");
      if (p.employmentMode) {
        setEmploymentMode(p.employmentMode);
      }
      if (p.breFailureReasons) {
        setBreFailures(p.breFailureReasons);
      }
    } else {
      if (user?.name) setFullName(user.name);
    }

    if (loansRes.success && loansRes.data?.loans) {
      setLoans(loansRes.data.loans);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Step 2: Profile & BRE check
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setBreFailures([]);
    setProfileSuccessMsg(null);

    const payload = {
      fullName,
      pan: pan.trim().toUpperCase(),
      dob,
      salary: Number(salary),
      employmentMode,
    };

    const res = await apiClient<{
      profile: IBorrowerProfile;
      breResult: { passed: boolean; failures: string[] };
    }>("/borrower/profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setSubmittingProfile(false);

    if (res.success && res.data) {
      setProfile(res.data.profile);
      if (res.data.breResult.passed) {
        setProfileSuccessMsg(
          "Eligibility check passed! Your profile meets all lending criteria."
        );
        setBreFailures([]);
      } else {
        setBreFailures(res.data.breResult.failures);
      }
    } else {
      if (res.errors && res.errors.length > 0) {
        setBreFailures(res.errors);
      } else {
        setBreFailures([res.message || "Failed to process application."]);
      }
    }
  };

  // Quick fill shortcuts for testing
  const fillSamplePass = () => {
    setFullName("Vikram Mehta");
    setPan("ABCDE1234F");
    setDob("1995-06-15");
    setSalary("50000");
    setEmploymentMode(EmploymentMode.SALARIED);
    setBreFailures([]);
  };

  const fillSampleFailAge = () => {
    setFullName("Aman Sharma");
    setPan("ABCDE1234F");
    setDob("2006-01-01");
    setSalary("40000");
    setEmploymentMode(EmploymentMode.SALARIED);
  };

  const fillSampleFailSalary = () => {
    setFullName("Pooja Nair");
    setPan("ABCDE1234F");
    setDob("1994-08-20");
    setSalary("18000");
    setEmploymentMode(EmploymentMode.SALARIED);
  };

  // Handle Step 3: File upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size exceeds 5 MB. Please select a smaller document.");
        setSelectedFile(null);
        return;
      }
      setUploadError(null);
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setUploadingFile(true);
    setUploadError(null);
    setUploadSuccessMsg(null);

    const formData = new FormData();
    formData.append("salarySlip", selectedFile);

    const res = await apiClient<{
      salarySlipUrl: string;
      applicationStep: number;
    }>("/borrower/upload-salary-slip", {
      method: "POST",
      body: formData,
    });

    setUploadingFile(false);

    if (res.success && res.data) {
      setUploadSuccessMsg("Salary slip uploaded and verified successfully!");
      if (profile) {
        setProfile({
          ...profile,
          salarySlipUrl: res.data.salarySlipUrl,
          applicationStep: res.data.applicationStep,
        });
      }
    } else {
      setUploadError(res.message || "Failed to upload salary slip.");
    }
  };

  // Handle Step 4: Loan Application Submit
  const handleApplyLoan = async () => {
    setShowConfirmModal(false);
    setApplyingLoan(true);
    setLoanApplyError(null);
    setLoanApplySuccess(null);

    const res = await apiClient<{ loan: ILoan }>("/loans/apply", {
      method: "POST",
      body: JSON.stringify({
        amount: loanAmount,
        tenureDays: tenureDays,
      }),
    });

    setApplyingLoan(false);

    if (res.success && res.data?.loan) {
      setLoanApplySuccess(
        `Loan application submitted successfully! Application ID: ${res.data.loan._id}`
      );
      setLoans((prev) => [res.data!.loan, ...prev]);
    } else {
      setLoanApplyError(
        res.message || "Failed to submit loan application. Please try again."
      );
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.BORROWER]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              LMS
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">
                Borrower Application Portal
              </h1>
              <p className="text-[10px] text-slate-400">
                User: <span className="text-indigo-400">{user?.name}</span> ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Stepper Navigation */}
        <div className="bg-slate-900/40 border-b border-slate-800/80 py-4 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            {[
              { num: 1, title: "Sign In", desc: "Completed", done: true, active: false },
              {
                num: 2,
                title: "Personal & BRE",
                desc: "Eligibility Verification",
                done: profile?.breStatus === BREStatus.PASSED,
                active: currentStep === 2,
              },
              {
                num: 3,
                title: "Salary Slip",
                desc: "PDF/Image Upload",
                done: !!profile?.salarySlipUrl,
                active: currentStep === 3,
              },
              {
                num: 4,
                title: "Loan Config",
                desc: "Calculate & Apply",
                done: hasAppliedLoan,
                active: currentStep === 4,
              },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 flex-1 last:flex-none">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                      step.done
                        ? "bg-emerald-600 text-white"
                        : step.active
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                  </div>
                  <div className="hidden md:block">
                    <p
                      className={`text-xs font-bold ${
                        step.active
                          ? "text-indigo-400"
                          : step.done
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-slate-500">{step.desc}</p>
                  </div>
                </div>
                {idx < 3 && (
                  <div className="hidden sm:block flex-1 h-[2px] mx-4 bg-slate-800" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Application Canvas */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8">
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading your loan application progress...</p>
            </div>
          ) : (
            <>
              {/* Active / Submitted Loans Tracker */}
              {loans.length > 0 && (
                <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <h2 className="text-base font-bold text-white">
                        Your Submitted Loans
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      Total applications: {loans.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {loans.map((loan) => {
                      const getStatusBadge = (status: LoanStatus) => {
                        switch (status) {
                          case LoanStatus.APPLIED:
                            return "bg-blue-500/10 text-blue-400 border-blue-500/30";
                          case LoanStatus.SANCTIONED:
                            return "bg-amber-500/10 text-amber-400 border-amber-500/30";
                          case LoanStatus.DISBURSED:
                            return "bg-purple-500/10 text-purple-400 border-purple-500/30";
                          case LoanStatus.CLOSED:
                            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                          case LoanStatus.REJECTED:
                            return "bg-red-500/10 text-red-400 border-red-500/30";
                          default:
                            return "bg-slate-800 text-slate-400 border-slate-700";
                        }
                      };

                      return (
                        <div
                          key={loan._id}
                          className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-bold text-white">
                                ₹{loan.amount.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                                  loan.status
                                )}`}
                              >
                                {loan.status}
                              </span>
                              <span className="text-xs text-slate-500">
                                Tenure: {loan.tenureDays} days
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              Total Repayment:{" "}
                              <strong className="text-slate-200">
                                ₹{loan.totalRepayment.toLocaleString("en-IN")}
                              </strong>{" "}
                              (Interest: ₹{loan.interestAmount.toLocaleString("en-IN")} @ {loan.interestRate}% p.a.)
                            </p>
                            {loan.status === LoanStatus.DISBURSED && (
                              <p className="text-xs text-purple-300 mt-1">
                                Outstanding: ₹{loan.outstandingBalance.toLocaleString("en-IN")} | Paid: ₹{loan.totalPaid.toLocaleString("en-IN")}
                              </p>
                            )}
                            {loan.rejectionReason && (
                              <p className="text-xs text-red-400 mt-1">
                                Rejection reason: {loan.rejectionReason}
                              </p>
                            )}
                          </div>

                          <div className="text-xs text-slate-500">
                            Submitted: {new Date(loan.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= STEP 2: PERSONAL DETAILS & BRE ================= */}
              <div
                className={`bg-slate-900/80 border rounded-2xl p-6 md:p-8 shadow-xl transition ${
                  currentStep === 2
                    ? "border-indigo-500/50 ring-1 ring-indigo-500/20"
                    : profile?.breStatus === BREStatus.PASSED
                    ? "border-emerald-500/30"
                    : "border-slate-800 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Personal Details & Eligibility Verification (BRE)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Evaluated strictly on the server by our automated Business Rule Engine.
                      </p>
                    </div>
                  </div>

                  {profile?.breStatus === BREStatus.PASSED && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>BRE Passed</span>
                    </span>
                  )}
                  {profile?.breStatus === BREStatus.FAILED && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>BRE Rejected</span>
                    </span>
                  )}
                </div>

                {/* BRE Failure Banner */}
                {breFailures.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Application Blocked: Business Rules Failed</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300">
                      {breFailures.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* BRE Success Banner */}
                {profileSuccessMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Vikram Mehta"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        PAN Card Number
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={pan}
                          onChange={(e) => setPan(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Date of Birth (Age rule: 23–50)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Monthly Salary (₹25,000 min)
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <input
                          type="number"
                          required
                          min={0}
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          placeholder="45000"
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                        Employment Mode
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                        <select
                          value={employmentMode}
                          onChange={(e) =>
                            setEmploymentMode(e.target.value as EmploymentMode)
                          }
                          className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={EmploymentMode.SALARIED}>Salaried</option>
                          <option value={EmploymentMode.SELF_EMPLOYED}>
                            Self-Employed
                          </option>
                          <option value={EmploymentMode.UNEMPLOYED}>
                            Unemployed (BRE will reject)
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Testing Shortcuts */}
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Testing Shortcuts:
                    </span>
                    <button
                      type="button"
                      onClick={fillSamplePass}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    >
                      Fill Valid (Age 31, Sal 50k)
                    </button>
                    <button
                      type="button"
                      onClick={fillSampleFailAge}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-red-950/50 hover:text-red-300 text-slate-400 rounded-lg transition"
                    >
                      Fail Age (Age 20)
                    </button>
                    <button
                      type="button"
                      onClick={fillSampleFailSalary}
                      className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-red-950/50 hover:text-red-300 text-slate-400 rounded-lg transition"
                    >
                      Fail Salary (&lt; 25k)
                    </button>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingProfile}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                    >
                      {submittingProfile ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Evaluating Eligibility...</span>
                        </>
                      ) : (
                        <>
                          <span>Run Eligibility Check (BRE)</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* ================= STEP 3: UPLOAD SALARY SLIP ================= */}
              <div
                className={`bg-slate-900/80 border rounded-2xl p-6 md:p-8 shadow-xl transition ${
                  currentStep === 3
                    ? "border-indigo-500/50 ring-1 ring-indigo-500/20"
                    : profile?.salarySlipUrl
                    ? "border-emerald-500/30"
                    : "border-slate-800 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Upload Salary Slip</h2>
                      <p className="text-xs text-slate-400">
                        Accepted formats: PDF, JPG, PNG (Maximum file size: 5 MB)
                      </p>
                    </div>
                  </div>

                  {profile?.salarySlipUrl && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Uploaded & Verified</span>
                    </span>
                  )}
                </div>

                {profile?.breStatus !== BREStatus.PASSED ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      You must complete and pass the Step 2 Eligibility Check before uploading documents.
                    </span>
                  </div>
                ) : (
                  <div>
                    {uploadError && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                        {uploadError}
                      </div>
                    )}

                    {uploadSuccessMsg && (
                      <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{uploadSuccessMsg}</span>
                      </div>
                    )}

                    {profile?.salarySlipUrl && (
                      <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400" />
                          <span>Attached Document: {profile.salarySlipUrl}</span>
                        </div>
                        <a
                          href={`http://localhost:5000${profile.salarySlipUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                        >
                          View Document
                        </a>
                      </div>
                    )}

                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                      <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition bg-slate-950/30">
                        <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                        <label
                          htmlFor="salarySlipFile"
                          className="cursor-pointer text-sm font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          <span>Click to browse</span>
                          <span className="text-slate-400 font-normal"> or drag & drop file</span>
                          <input
                            id="salarySlipFile"
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="text-[11px] text-slate-500 mt-1">
                          PDF, JPG, PNG up to 5MB
                        </p>
                        {selectedFile && (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!selectedFile || uploadingFile}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploadingFile ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Uploading Document...</span>
                            </>
                          ) : (
                            <>
                              <span>Upload & Verify Salary Slip</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* ================= STEP 4: LOAN CONFIGURATION & LIVE CALCULATOR ================= */}
              <div
                className={`bg-slate-900/90 border rounded-2xl p-6 md:p-8 shadow-xl transition ${
                  currentStep === 4
                    ? "border-indigo-500/50 ring-1 ring-indigo-500/20"
                    : "border-slate-800 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        Loan Configuration & Application
                      </h2>
                      <p className="text-xs text-slate-400">
                        Customize your loan amount and tenure. Fixed interest rate at 12% p.a.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Simple Interest (12% p.a.)</span>
                  </span>
                </div>

                {!profile?.salarySlipUrl ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Locked. Please complete Step 2 (BRE) and Step 3 (Salary Slip Upload) above to unlock the loan application.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {loanApplyError && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{loanApplyError}</span>
                      </div>
                    )}

                    {loanApplySuccess && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{loanApplySuccess}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Sliders */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Loan Amount Slider */}
                        <div className="space-y-3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                              Loan Amount (Principal)
                            </label>
                            <span className="text-lg font-extrabold text-indigo-400 font-mono">
                              ₹{loanAmount.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <input
                            type="range"
                            min={50000}
                            max={500000}
                            step={10000}
                            value={loanAmount}
                            onChange={(e) => setLoanAmount(Number(e.target.value))}
                            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span>Min: ₹50,000</span>
                            <span>Max: ₹5,00,000</span>
                          </div>
                        </div>

                        {/* Tenure Slider */}
                        <div className="space-y-3 bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                              Tenure in Days
                            </label>
                            <span className="text-lg font-extrabold text-indigo-400 font-mono">
                              {tenureDays} Days{" "}
                              <span className="text-xs font-normal text-slate-400">
                                (~{(tenureDays / 30).toFixed(1)} mo)
                              </span>
                            </span>
                          </div>

                          <input
                            type="range"
                            min={30}
                            max={365}
                            step={1}
                            value={tenureDays}
                            onChange={(e) => setTenureDays(Number(e.target.value))}
                            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span>Min: 30 days</span>
                            <span>Max: 365 days</span>
                          </div>
                        </div>

                        {/* Slider Quick Presets */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-slate-500">Presets:</span>
                          {[
                            { label: "₹50K / 30d", amt: 50000, ten: 30 },
                            { label: "₹1L / 180d", amt: 100000, ten: 180 },
                            { label: "₹2.5L / 365d", amt: 250000, ten: 365 },
                            { label: "₹5L / 365d", amt: 500000, ten: 365 },
                          ].map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setLoanAmount(p.amt);
                                setTenureDays(p.ten);
                              }}
                              className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right: Live Calculation Panel */}
                      <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span>Live Repayment Quote</span>
                          </div>

                          <div className="space-y-3.5 divide-y divide-slate-800 text-sm">
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-slate-400">Principal Amount</span>
                              <span className="font-semibold text-white font-mono">
                                ₹{loanAmount.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-3.5">
                              <span className="text-slate-400">Interest Rate</span>
                              <span className="font-semibold text-white">
                                {interestRate}% p.a. (Fixed)
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-3.5">
                              <span className="text-slate-400">Tenure</span>
                              <span className="font-semibold text-white">
                                {tenureDays} Days
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-3.5">
                              <div>
                                <span className="text-slate-400">Simple Interest (SI)</span>
                                <p className="text-[10px] text-slate-500">
                                  (P × 12 × {tenureDays}) / 36,500
                                </p>
                              </div>
                              <span className="font-bold text-emerald-400 font-mono">
                                + ₹{simpleInterest.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 pb-1">
                              <div>
                                <span className="text-sm font-bold text-white">
                                  Total Repayment
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  Principal + Simple Interest
                                </p>
                              </div>
                              <span className="text-xl font-extrabold text-indigo-400 font-mono">
                                ₹{totalRepayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6">
                          <button
                            type="button"
                            disabled={applyingLoan}
                            onClick={() => setShowConfirmModal(true)}
                            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                          >
                            {applyingLoan ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Submitting Application...</span>
                              </>
                            ) : (
                              <>
                                <span>Apply for Loan</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation Modal */}
              {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-4">
                      <IndianRupee className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">
                      Confirm Loan Application
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">
                      Please review your application parameters before final submission. This will initiate underwriting review by our Sanction team.
                    </p>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5 text-xs mb-6">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Applicant:</span>
                        <span className="font-semibold text-white">{profile?.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Loan Amount:</span>
                        <span className="font-semibold text-white font-mono">
                          ₹{loanAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tenure:</span>
                        <span className="font-semibold text-white font-mono">
                          {tenureDays} Days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Simple Interest:</span>
                        <span className="font-semibold text-emerald-400 font-mono">
                          ₹{simpleInterest.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-800">
                        <span className="font-bold text-white">Total Repayment:</span>
                        <span className="font-bold text-indigo-400 font-mono text-sm">
                          ₹{totalRepayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyLoan}
                        className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30"
                      >
                        Confirm & Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
