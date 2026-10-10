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
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Calendar,
  Phone,
  Mail,
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
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Sales & Lead Pipeline Module
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Monitors borrowers who registered but haven't completed or submitted their loan application.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLeads}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Leads</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Active Leads: {leads.length}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Leads Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Loading sales leads pipeline...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-300">No Pending Leads Found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All registered borrowers have either completed an application or no leads match your search query.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
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
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLeads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-4 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                              {lead.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span>{lead.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{lead.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {new Date(lead.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            Step {lead.applicationStep} of 4
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {lead.breStatus === "PASSED" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              PASSED
                            </span>
                          ) : lead.breStatus === "FAILED" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                              FAILED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                              NOT STARTED
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {lead.salarySlipUploaded ? (
                            <span className="text-emerald-400 text-[11px] font-medium">Uploaded</span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Pending</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
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
