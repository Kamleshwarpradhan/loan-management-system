"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import {
  Users,
  CheckCircle,
  Banknote,
  Receipt,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN],
  },
  {
    name: "Sales Leads",
    href: "/dashboard/sales",
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.SALES],
  },
  {
    name: "Sanction Queue",
    href: "/dashboard/sanction",
    icon: CheckCircle,
    roles: [UserRole.ADMIN, UserRole.SANCTION],
  },
  {
    name: "Disbursement",
    href: "/dashboard/disbursement",
    icon: Banknote,
    roles: [UserRole.ADMIN, UserRole.DISBURSEMENT],
  },
  {
    name: "Collection",
    href: "/dashboard/collection",
    icon: Receipt,
    roles: [UserRole.ADMIN, UserRole.COLLECTION],
  },
];

export const DashboardLayoutShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Filter modules strictly based on user's role
  const visibleNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col">
        {/* Brand / Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              LMS
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Ops Panel</h2>
              <p className="text-xs text-slate-400">Back-office Suite</p>
            </div>
          </div>
        </div>

        {/* User Badge */}
        <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() || "OP"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 flex-1 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Modules Allowed for Your Role
          </p>

          {visibleNavItems.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>No operational modules assigned.</span>
            </div>
          ) : (
            visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-sm">
          <h1 className="text-lg font-semibold text-white">Operations Management Portal</h1>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Role: <strong className="text-indigo-400">{user?.role}</strong></span>
            <span>•</span>
            <span>{user?.email}</span>
          </div>
        </header>

        <div className="p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};
