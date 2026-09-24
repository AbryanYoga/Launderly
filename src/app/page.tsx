"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  PackageCheck,
  Clock,
  Users,
  PlusCircle,
  FileSpreadsheet,
  ArrowUpRight,
  RotateCw,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface MetricsData {
  totalRevenue: number;
  totalVolume: number;
  activeOrders: number;
  newCustomers: number;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalRevenue: 0,
    totalVolume: 0,
    activeOrders: 0,
    newCustomers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateMetrics = async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    const { data: transactions } = await supabase
      .from("transactions")
      .select("total_amount, total_weight, order_status, created_at");

    const { data: customers } = await supabase
      .from("customers")
      .select("id, created_at");

    let totalRevenue = 0;
    let totalVolume = 0;
    let activeOrders = 0;

    if (transactions && transactions.length > 0) {
      transactions.forEach((tx) => {
        totalRevenue += Number(tx.total_amount) || 0;
        if (tx.order_status === "completed") {
          totalVolume += Number(tx.total_weight) || 0;
        } else {
          activeOrders += 1;
        }
      });
    }

    let newCustomers = 0;
    if (customers && customers.length > 0) {
      newCustomers = customers.filter(
        (c) => new Date(c.created_at) >= new Date(firstDayOfMonth)
      ).length;
    }

    return {
      totalRevenue,
      totalVolume,
      activeOrders,
      newCustomers,
    };
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialMetrics() {
      try {
        const data = await calculateMetrics();
        if (isMounted) {
          setMetrics(data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await calculateMetrics();
      setMetrics(data);
    } catch {
      // Fallback gracefully
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-dark tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-gray-500">
            Pemantauan performa harian operasional dan pendapatan Laundry Insight
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RotateCw
              className={`h-3.5 w-3.5 text-gray-500 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/transactions/new"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Transaksi Baru</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2.5 w-3/4">
                    <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    <div className="h-7 w-36 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gray-200 shrink-0"></div>
                </div>
                <div className="mt-4 h-2.5 w-28 bg-gray-100 rounded"></div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Omzet
                  </span>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {formatRupiah(metrics.totalRevenue)}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-xs shrink-0">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-flex items-center text-success font-medium">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Live
                </span>
                <span>Akumulasi pendapatan</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Cucian Selesai
                  </span>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {metrics.totalVolume.toFixed(1)} <span className="text-base font-semibold text-gray-500">Kg</span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success shadow-xs shrink-0">
                  <PackageCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-flex items-center text-success font-medium">
                  Status Selesai
                </span>
                <span>Volume cucian diproses</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Transaksi Berjalan
                  </span>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {metrics.activeOrders} <span className="text-base font-semibold text-gray-500">Antrean</span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-[#c2841d] shadow-xs shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-flex items-center text-warning font-medium">
                  Dalam Proses
                </span>
                <span>Pesanan belum selesai</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Pelanggan Baru
                  </span>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {metrics.newCustomers} <span className="text-base font-semibold text-gray-500">Orang</span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A3042]/10 text-sidebar shadow-xs shrink-0">
                  <Users className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-flex items-center text-primary font-medium">
                  Bulan Ini
                </span>
                <span>Pendaftar berjalan</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-base shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-dark">Aksi Cepat Operasional</h2>
              <p className="text-xs text-gray-400">
                Pencatatan langsung pelanggan walk-in atau unggah data massal spreadsheet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/transactions/new"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-dark hover:bg-gray-50 hover:border-primary/40 transition-all"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              <span>Input Pesanan Manual</span>
            </Link>
            <Link
              href="/transactions/import"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-dark hover:bg-gray-50 hover:border-primary/40 transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
              <span>Import Excel / CSV</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="rounded-lg bg-dashboard p-4 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Database Terhubung</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-success"></span>
              <span className="text-xs font-semibold text-dark">PostgreSQL via Supabase</span>
            </div>
          </div>
          <div className="rounded-lg bg-dashboard p-4 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Sistem Penomoran Nota</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-bold text-primary">INV/YYMMDD/XXXX</span>
            </div>
          </div>
          <div className="rounded-lg bg-dashboard p-4 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Tema Dashboard</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-3 w-3 rounded bg-sidebar" title="Dark Navy (#2A3042)"></span>
              <span className="h-3 w-3 rounded bg-primary" title="Sky Blue (#0284C7)"></span>
              <span className="h-3 w-3 rounded bg-success" title="Success (#34C38F)"></span>
              <span className="h-3 w-3 rounded bg-warning" title="Warning (#F1B44C)"></span>
              <span className="h-3 w-3 rounded bg-danger" title="Danger (#F46A6A)"></span>
              <span className="text-xs text-gray-600 font-medium ml-1">Skote Theme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
