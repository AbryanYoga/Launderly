"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Transaksi Baru",
    href: "/transactions/new",
    icon: PlusCircle,
  },
  {
    label: "Import Excel",
    href: "/transactions/import",
    icon: FileSpreadsheet,
  },
  {
    label: "Analitik",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Pengaturan",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tutup menu navigasi"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") onCloseMobile?.();
          }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#2A3042] text-[#a6b0cf] transition-all duration-300 ${
          mobileOpen
            ? "translate-x-0 shadow-2xl w-64"
            : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-[#36405a]">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white shadow-sm font-bold text-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col truncate">
                <span className="text-base font-semibold tracking-wide text-white">
                  LaundryInsight
                </span>
                <span className="text-[11px] text-[#74788d]">
                  Operations & Analytics
                </span>
              </div>
            )}
          </Link>

          {/* Tombol tutup pada mobile drawer */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#32394e] transition-colors"
            aria-label="Tutup sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          {(!collapsed || mobileOpen) && (
            <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#6a7187]">
              Menu Utama
            </p>
          )}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#32394e] text-white shadow-sm"
                      : "text-[#a6b0cf] hover:bg-[#32394e]/60 hover:text-white"
                  } ${collapsed && !mobileOpen ? "justify-center px-0" : ""}`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-primary" : "text-[#7b8196]"
                    }`}
                  />
                  {(!collapsed || mobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:flex p-3 border-t border-[#36405a] items-center justify-end">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-9 w-full items-center justify-center rounded-lg bg-[#32394e] text-[#a6b0cf] hover:text-white hover:bg-[#384158] transition-colors"
            aria-label={collapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium">
                <ChevronLeft className="h-4 w-4" />
                <span>Minimize Sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
