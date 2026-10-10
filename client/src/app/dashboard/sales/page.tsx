"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutShell } from "@/components/DashboardLayoutShell";
import { UserRole } from "@/lib/types";
import { apiClient } from "@/lib/api";
import {
  Users,
  Search,
  RefreshCw,
  Clock,
  Mail,
  Phone,
} from "lucide-react";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  applicationStep: number;
  breStatus: string;
  salarySlipUploaded: boolean;
}

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchLeads = async () => {
    setLoading(true);
    const res = await apiClient<{ leads: Lead[]; count: number }>("/dashboard/sales/leads");
    if (res.success && res.data?.leads) {
      setLeads(res.data.leads);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm)
  );

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SALES]}>
      <DashboardLayoutShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0066FF]" />
                Sales & Lead Pipeline
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Monitors borrowers who registered with CreditSea but haven't submitted their loan application.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLeads}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Leads</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
                Active Leads: {leads.length}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066FF] shadow-sm"
            />
          </div>

          {/* Leads Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-[#0066FF] animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading sales leads pipeline...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">No Pending Leads Found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  All registered borrowers have either completed an application or no leads match your search query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Borrower Name</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">Registered Date</th>
                      <th className="py-3.5 px-4">Step Reached</th>
                      <th className="py-3.5 px-4">Eligibility (BRE)</th>
                      <th className="py-3.5 px-4">Salary Slip</th>
                      <th className="py-3.5 px-4 text-right">Lead Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-sky-50/40 transition">
                        <td className="py-4 px-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center font-bold text-xs">
                              {lead.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span>{lead.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-[11px]">
                          {new Date(lead.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            Step {lead.applicationStep} of 4
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {lead.breStatus === "PASSED" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              PASSED
                            </span>
                          ) : lead.breStatus === "FAILED" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              FAILED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                              NOT STARTED
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {lead.salarySlipUploaded ? (
                            <span className="text-emerald-600 text-[11px] font-semibold">Uploaded</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-[#0066FF] border border-blue-200">
                            Follow-Up
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayoutShell>
    </ProtectedRoute>
  );
}
