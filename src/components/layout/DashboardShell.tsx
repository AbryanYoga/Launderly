"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-dashboard text-[#495057] flex">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Navbar
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
        />
        <main className="flex-1 p-6 overflow-y-auto bg-dashboard">
          {children}
        </main>
      </div>
    </div>
  );
}
