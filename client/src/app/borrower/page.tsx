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
import { CreditSeaLogo } from "@/components/CreditSeaLogo";
import {
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
  Sparkles,
  Sliders,
  FileText,
  Smartphone,
  ShieldCheck,
  Clock,
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

  // Step 4: Loan Calculator state (Sliders)
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [tenureDays, setTenureDays] = useState<number>(180);
  const [applyingLoan, setApplyingLoan] = useState<boolean>(false);
  const [loanApplyError, setLoanApplyError] = useState<string | null>(null);
  const [loanApplySuccess, setLoanApplySuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Simple Interest: SI = (P * 12 * T) / 36,500
  const interestRate = 12;
  const exactSI = (loanAmount * interestRate * tenureDays) / (365 * 100);
  const simpleInterest = Math.round(exactSI * 100) / 100;
  const totalRepayment = Math.round((loanAmount + simpleInterest) * 100) / 100;

  // Active step calculation
  const hasAppliedLoan = loans.length > 0;
  let currentStep = 2;
  if (hasAppliedLoan) {
    currentStep = 4;
  } else if (profile?.salarySlipUrl) {
    currentStep = 4;
  } else if (profile?.breStatus === BREStatus.PASSED) {
    currentStep = 3;
  }

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
          "Eligibility check passed! Your profile meets CreditSea lending criteria."
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

  // Quick fill shortcuts
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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
        {/* Top Header - CreditSea Style Navbar */}
        <header className="h-18 border-b border-slate-200 px-6 md:px-12 flex items-center justify-between bg-white sticky top-0 z-50 shadow-xs">
          <div className="flex items-center gap-8">
            <CreditSeaLogo size={36} />

            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
              <span className="text-[#0066FF] border-b-2 border-[#0066FF] py-5">Apply Loan</span>
              <span className="hover:text-[#0066FF] cursor-pointer">Loan Products</span>
              <span className="hover:text-[#0066FF] cursor-pointer">Calculators</span>
              <span className="hover:text-[#0066FF] cursor-pointer">Repay Loan</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user?.name}</p>
              <p className="text-[11px] text-slate-500">{user?.phone || user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-red-600 bg-slate-100 hover:bg-red-50 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Hero Banner with CreditSea Theme */}
        <div className="bg-gradient-to-b from-sky-50/80 via-white to-slate-50 border-b border-slate-200/80 pt-8 pb-6 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <p className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">
              Borrowing made easy with CreditSea
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Get Personal Loans up to ₹5 Lakhs
            </h1>
            <p className="text-xs text-slate-500 max-w-lg mx-auto font-medium">
              Instant digital loan approval • Low 12% p.a. fixed interest • Transparent fee structure
            </p>
          </div>

          {/* Stepper Navigation */}
          <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-slate-200/60">
            <div className="flex items-center justify-between">
              {[
                { num: 1, title: "Register", desc: "Completed", done: true, active: false },
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
                  desc: "Document Upload",
                  done: !!profile?.salarySlipUrl,
                  active: currentStep === 3,
                },
                {
                  num: 4,
                  title: "Disbursal Config",
                  desc: "Calculate & Apply",
                  done: hasAppliedLoan,
                  active: currentStep === 4,
                },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 flex-1 last:flex-none">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-xs ${
                        step.done
                          ? "bg-emerald-500 text-white"
                          : step.active
                          ? "bg-[#0066FF] text-white ring-4 ring-blue-100"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.num}
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={`text-xs font-bold ${
                          step.active
                            ? "text-[#0066FF]"
                            : step.done
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{step.desc}</p>
                    </div>
                  </div>
                  {idx < 3 && (
                    <div className="hidden sm:block flex-1 h-[2px] mx-4 bg-slate-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Application Canvas */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8">
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 text-[#0066FF] animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Loading your loan application progress...</p>
            </div>
          ) : (
            <>
              {/* Active Submitted Loans Tracker */}
              {loans.length > 0 && (
                <div className="bg-white border border-blue-200 rounded-3xl p-6 shadow-md shadow-blue-500/5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Your CreditSea Loan Applications
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-[#0066FF] bg-blue-50 px-3 py-1 rounded-full">
                      Total: {loans.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {loans.map((loan) => {
                      const getStatusBadge = (status: LoanStatus) => {
                        switch (status) {
                          case LoanStatus.APPLIED:
                            return "bg-blue-50 text-[#0066FF] border-blue-200";
                          case LoanStatus.SANCTIONED:
                            return "bg-amber-50 text-amber-700 border-amber-200";
                          case LoanStatus.DISBURSED:
                            return "bg-purple-50 text-purple-700 border-purple-200";
                          case LoanStatus.CLOSED:
                            return "bg-emerald-50 text-emerald-700 border-emerald-200";
                          case LoanStatus.REJECTED:
                            return "bg-red-50 text-red-700 border-red-200";
                          default:
                            return "bg-slate-100 text-slate-600 border-slate-200";
                        }
                      };

                      return (
                        <div
                          key={loan._id}
                          className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-base font-extrabold text-slate-900 font-mono">
                                ₹{loan.amount.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(
                                  loan.status
                                )}`}
                              >
                                {loan.status}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                Tenure: {loan.tenureDays} days
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Total Repayment:{" "}
                              <strong className="text-slate-900">
                                ₹{loan.totalRepayment.toLocaleString("en-IN")}
                              </strong>{" "}
                              (Interest: ₹{loan.interestAmount.toLocaleString("en-IN")} @ {loan.interestRate}% p.a.)
                            </p>
                            {loan.status === LoanStatus.DISBURSED && (
                              <p className="text-xs text-purple-700 font-medium mt-1">
                                Outstanding: ₹{loan.outstandingBalance.toLocaleString("en-IN")} | Paid: ₹{loan.totalPaid.toLocaleString("en-IN")}
                              </p>
                            )}
                            {loan.rejectionReason && (
                              <p className="text-xs text-red-600 font-medium mt-1">
                                Rejection reason: {loan.rejectionReason}
                              </p>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 font-medium">
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
                className={`bg-white border rounded-3xl p-6 md:p-8 shadow-sm transition ${
                  currentStep === 2
                    ? "border-blue-400 shadow-md shadow-blue-500/5 ring-1 ring-blue-100"
                    : profile?.breStatus === BREStatus.PASSED
                    ? "border-emerald-200"
                    : "border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Personal Details & Eligibility Check (BRE)
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Instant eligibility underwriting by CreditSea Business Rule Engine.
                      </p>
                    </div>
                  </div>

                  {profile?.breStatus === BREStatus.PASSED && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>BRE Passed</span>
                    </span>
                  )}
                  {profile?.breStatus === BREStatus.FAILED && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>BRE Rejected</span>
                    </span>
                  )}
                </div>

                {breFailures.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-red-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>Eligibility Criteria Not Met</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 pl-2 text-slate-700 font-medium">
                      {breFailures.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {profileSuccessMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Vikram Mehta"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        PAN Card Number
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={pan}
                          onChange={(e) => setPan(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white font-mono transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Date of Birth (Age rule: 23–50)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Monthly Salary (₹25,000 min)
                      </label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          required
                          min={0}
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          placeholder="50000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition font-mono"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        Employment Mode
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <select
                          value={employmentMode}
                          onChange={(e) =>
                            setEmploymentMode(e.target.value as EmploymentMode)
                          }
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white transition"
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
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Demo Shortcuts:
                    </span>
                    <button
                      type="button"
                      onClick={fillSamplePass}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#0066FF] rounded-lg transition font-medium"
                    >
                      Fill Valid (Age 31, Sal 50k)
                    </button>
                    <button
                      type="button"
                      onClick={fillSampleFailAge}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition font-medium"
                    >
                      Fail Age (Age 20)
                    </button>
                    <button
                      type="button"
                      onClick={fillSampleFailSalary}
                      className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition font-medium"
                    >
                      Fail Salary (&lt; 25k)
                    </button>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingProfile}
                      className="px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      {submittingProfile ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Evaluating Eligibility...</span>
                        </>
                      ) : (
                        <>
                          <span>Run Eligibility Check (BRE)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* ================= STEP 3: UPLOAD SALARY SLIP ================= */}
              <div
                className={`bg-white border rounded-3xl p-6 md:p-8 shadow-sm transition ${
                  currentStep === 3
                    ? "border-blue-400 shadow-md shadow-blue-500/5 ring-1 ring-blue-100"
                    : profile?.salarySlipUrl
                    ? "border-emerald-200"
                    : "border-slate-200 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">Upload Salary Slip</h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Accepted formats: PDF, JPG, PNG (Maximum file size: 5 MB)
                      </p>
                    </div>
                  </div>

                  {profile?.salarySlipUrl && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Uploaded & Verified</span>
                    </span>
                  )}
                </div>

                {profile?.breStatus !== BREStatus.PASSED ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Please complete and pass the Step 2 Eligibility Check before uploading documents.
                    </span>
                  </div>
                ) : (
                  <div>
                    {uploadError && (
                      <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                        {uploadError}
                      </div>
                    )}

                    {uploadSuccessMsg && (
                      <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{uploadSuccessMsg}</span>
                      </div>
                    )}

                    {profile?.salarySlipUrl && (
                      <div className="mb-4 p-3 rounded-2xl bg-sky-50/50 border border-sky-100 text-xs text-slate-700 flex items-center justify-between font-medium">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span>Attached: {profile.salarySlipUrl}</span>
                        </div>
                        <a
                          href={`http://localhost:5000${profile.salarySlipUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0066FF] hover:underline font-bold"
                        >
                          View Document
                        </a>
                      </div>
                    )}

                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                      <div className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-3xl p-6 text-center transition bg-slate-50/50">
                        <UploadCloud className="w-10 h-10 text-[#0066FF] mx-auto mb-2" />
                        <label
                          htmlFor="salarySlipFile"
                          className="cursor-pointer text-xs font-bold text-[#0066FF] hover:underline"
                        >
                          <span>Click to browse</span>
                          <span className="text-slate-500 font-normal"> or drag and drop</span>
                          <input
                            id="salarySlipFile"
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">
                          PDF, JPG, PNG up to 5MB
                        </p>
                        {selectedFile && (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-semibold">
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!selectedFile || uploadingFile}
                          className="px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold rounded-xl text-xs transition flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
                        >
                          {uploadingFile ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <span>Upload & Verify Salary Slip</span>
                              <ArrowRight className="w-3.5 h-3.5" />
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
                className={`bg-white border rounded-3xl p-6 md:p-8 shadow-sm transition ${
                  currentStep === 4
                    ? "border-blue-400 shadow-md shadow-blue-500/5 ring-1 ring-blue-100"
                    : "border-slate-200 opacity-40"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">
                        Loan Configuration & Application
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Customize your loan amount and tenure with live Simple Interest calculation.
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Fixed 12% p.a.</span>
                  </span>
                </div>

                {!profile?.salarySlipUrl ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Locked. Please complete Step 2 (BRE) and Step 3 (Salary Slip Upload) to unlock the loan application.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {loanApplyError && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{loanApplyError}</span>
                      </div>
                    )}

                    {loanApplySuccess && (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{loanApplySuccess}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Sliders */}
                      <div className="lg:col-span-7 space-y-6">
                        {/* Loan Amount Slider */}
                        <div className="space-y-3 bg-slate-50/70 border border-slate-200 p-5 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Loan Amount (Principal)
                            </label>
                            <span className="text-lg font-extrabold text-[#0066FF] font-mono">
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
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066FF]"
                          />

                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                            <span>Min: ₹50,000</span>
                            <span>Max: ₹5,00,000</span>
                          </div>
                        </div>

                        {/* Tenure Slider */}
                        <div className="space-y-3 bg-slate-50/70 border border-slate-200 p-5 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              Tenure in Days
                            </label>
                            <span className="text-lg font-extrabold text-[#0066FF] font-mono">
                              {tenureDays} Days{" "}
                              <span className="text-xs font-normal text-slate-500">
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
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0066FF]"
                          />

                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                            <span>Min: 30 days</span>
                            <span>Max: 365 days</span>
                          </div>
                        </div>

                        {/* Slider Quick Presets */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-slate-400 font-medium">Presets:</span>
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
                              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-[#0066FF] text-slate-600 rounded-lg transition font-semibold"
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Right: Live Calculation Quote */}
                      <div className="lg:col-span-5 bg-gradient-to-br from-sky-50 via-white to-blue-50/30 border border-blue-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] uppercase tracking-wider mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span>CreditSea Live Quote</span>
                          </div>

                          <div className="space-y-3.5 divide-y divide-slate-100 text-xs">
                            <div className="flex items-center justify-between pt-1 font-medium">
                              <span className="text-slate-500">Principal Amount</span>
                              <span className="font-bold text-slate-900 font-mono">
                                ₹{loanAmount.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-3 font-medium">
                              <span className="text-slate-500">Interest Rate</span>
                              <span className="font-bold text-slate-900">
                                {interestRate}% p.a.
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-3 font-medium">
                              <span className="text-slate-500">Tenure</span>
                              <span className="font-bold text-slate-900">
                                {tenureDays} Days
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-3">
                              <div>
                                <span className="text-slate-500 font-medium">Simple Interest (SI)</span>
                                <p className="text-[10px] text-slate-400">
                                  (P × 12 × {tenureDays}) / 36,500
                                </p>
                              </div>
                              <span className="font-bold text-emerald-600 font-mono">
                                + ₹{simpleInterest.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-4 pb-1">
                              <div>
                                <span className="text-xs font-bold text-slate-900">
                                  Total Repayment
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  Principal + Simple Interest
                                </p>
                              </div>
                              <span className="text-lg font-extrabold text-[#0066FF] font-mono">
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
                            className="w-full py-3.5 px-4 bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 disabled:opacity-50"
                          >
                            {applyingLoan ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <>
                                <span>Apply for Loan</span>
                                <ArrowRight className="w-3.5 h-3.5" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mb-3">
                      <IndianRupee className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Confirm Loan Application
                    </h3>
                    <p className="text-xs text-slate-500 mb-5">
                      Review your loan configuration before submission to the CreditSea underwriting team.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs mb-5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Applicant:</span>
                        <span className="font-bold text-slate-800">{profile?.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Loan Amount:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          ₹{loanAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Tenure:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {tenureDays} Days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Simple Interest:</span>
                        <span className="font-bold text-emerald-600 font-mono">
                          ₹{simpleInterest.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900">Total Repayment:</span>
                        <span className="font-extrabold text-[#0066FF] font-mono text-sm">
                          ₹{totalRepayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyLoan}
                        className="flex-1 py-2.5 px-4 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-xl transition shadow-md shadow-blue-500/20"
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
