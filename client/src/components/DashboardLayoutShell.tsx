"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/lib/types";
import { CreditSeaLogo } from "@/components/CreditSeaLogo";
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

  const visibleNavItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <CreditSeaLogo size={32} />
        </div>

        {/* User Badge */}
        <div className="px-5 py-4 border-b border-slate-100 bg-sky-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0066FF] text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.slice(0, 2).toUpperCase() || "OP"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-blue-100 text-[#0066FF] border border-blue-200">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Operations Modules
          </p>

          {visibleNavItems.length === 0 ? (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-[#0066FF] text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 hover:text-[#0066FF] hover:bg-sky-50"
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
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operations Portal
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>Role: <strong className="text-[#0066FF]">{user?.role}</strong></span>
            <span>•</span>
            <span>{user?.email}</span>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
};
