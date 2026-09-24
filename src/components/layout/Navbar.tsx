"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  User,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    if (pathname === "/") {
      return [{ label: "Dashboard", href: "/" }];
    }

    const segments = pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Dashboard", href: "/" }];

    if (segments[0] === "transactions") {
      crumbs.push({ label: "Transaksi", href: "#" });
      if (segments[1] === "new") {
        crumbs.push({ label: "Transaksi Baru", href: "/transactions/new" });
      } else if (segments[1] === "import") {
        crumbs.push({ label: "Import Excel", href: "/transactions/import" });
      }
    } else if (segments[0] === "analytics") {
      crumbs.push({ label: "Analitik", href: "/analytics" });
    } else if (segments[0] === "settings") {
      crumbs.push({ label: "Pengaturan", href: "/settings" });
    } else {
      segments.forEach((seg, idx) => {
        crumbs.push({
          label: seg.charAt(0).toUpperCase() + seg.slice(1),
          href: `/${segments.slice(0, idx + 1).join("/")}`,
        });
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-dark transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={crumb.href + index} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                {isLast ? (
                  <span className="font-semibold text-dark">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-gray-500 hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Cari transaksi, invoice, pelanggan..."
            className="h-9 w-64 rounded-full border border-gray-200 bg-[#F8F9FA] pl-9 pr-4 text-xs text-dark placeholder-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-dark transition-colors"
          aria-label="Notifikasi"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-danger"></span>
          </span>
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar text-white shadow-xs">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-dark leading-tight">
              Laundry Insight
            </span>
            <span className="text-[10px] text-success font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
              Operasional
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
