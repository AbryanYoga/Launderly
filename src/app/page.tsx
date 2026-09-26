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
  ShoppingBag,
  Sparkles,
  Calendar,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { OrderStatus } from "@/types";

interface MetricsData {
  totalRevenue: number;
  totalVolume: number;
  activeOrders: number;
  newCustomers: number;
}

interface RecentTransaction {
  id: string;
  invoice: string;
  customerName: string;
  customerPhone: string;
  totalWeight: number;
  totalAmount: number;
  paymentStatus: "unpaid" | "paid";
  orderStatus: OrderStatus;
  createdAt: string;
}

const sampleTransactions: RecentTransaction[] = [
  {
    id: "tx-sample-1",
    invoice: "INV/260924/8421",
    customerName: "Budi Santoso",
    customerPhone: "081234567891",
    totalWeight: 4.5,
    totalAmount: 36000,
    paymentStatus: "paid",
    orderStatus: "washing",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "tx-sample-2",
    invoice: "INV/260924/5193",
    customerName: "Siti Rahmawati",
    customerPhone: "085678901234",
    totalWeight: 2.0,
    totalAmount: 12000,
    paymentStatus: "unpaid",
    orderStatus: "pending",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "tx-sample-3",
    invoice: "INV/260924/9024",
    customerName: "Ahmad Subagio",
    customerPhone: "081987654321",
    totalWeight: 6.0,
    totalAmount: 48000,
    paymentStatus: "paid",
    orderStatus: "ironing",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "tx-sample-4",
    invoice: "INV/260924/3140",
    customerName: "Dewi Lestari",
    customerPhone: "081399887766",
    totalWeight: 3.0,
    totalAmount: 25000,
    paymentStatus: "paid",
    orderStatus: "completed",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

const sampleMetrics: MetricsData = {
  totalRevenue: 121000,
  totalVolume: 3.0,
  activeOrders: 3,
  newCustomers: 4,
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function Home() {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalRevenue: 0,
    totalVolume: 0,
    activeOrders: 0,
    newCustomers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [hasRealData, setHasRealData] = useState<boolean>(false);
  const [showDemoData, setShowDemoData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadDashboardData = async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    const { data: transactions } = await supabase
      .from("transactions")
      .select(`
        id,
        invoice,
        customer_id,
        total_weight,
        total_amount,
        payment_status,
        order_status,
        created_at,
        customers (
          name,
          phone
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: allTransactions } = await supabase
      .from("transactions")
      .select("total_amount, total_weight, order_status, created_at");

    const { data: customers } = await supabase
      .from("customers")
      .select("id, created_at");

    const hasReal = !!(allTransactions && allTransactions.length > 0);

    let totalRevenue = 0;
    let totalVolume = 0;
    let activeOrders = 0;

    if (allTransactions && allTransactions.length > 0) {
      allTransactions.forEach((tx) => {
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

    let mappedTx: RecentTransaction[] = [];
    if (transactions && transactions.length > 0) {
      interface RawCustomerRow {
        name?: string;
        phone?: string;
      }
      interface RawTxRow {
        id: string;
        invoice: string;
        total_weight: number;
        total_amount: number;
        payment_status: "unpaid" | "paid";
        order_status: OrderStatus;
        created_at: string;
        customers?: RawCustomerRow | RawCustomerRow[];
      }
      mappedTx = (transactions as unknown as RawTxRow[]).map((t) => {
        const cust = Array.isArray(t.customers) ? t.customers[0] : t.customers;
        return {
          id: t.id,
          invoice: t.invoice,
          customerName: cust?.name || "Pelanggan",
          customerPhone: cust?.phone || "-",
          totalWeight: Number(t.total_weight) || 0,
          totalAmount: Number(t.total_amount) || 0,
          paymentStatus: t.payment_status || "unpaid",
          orderStatus: t.order_status || "pending",
          createdAt: t.created_at,
        };
      });
    }

    return {
      hasReal,
      metricsData: {
        totalRevenue,
        totalVolume,
        activeOrders,
        newCustomers,
      },
      transactionsData: mappedTx,
    };
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const { hasReal, metricsData, transactionsData } =
          await loadDashboardData();
        if (isMounted) {
          setHasRealData(hasReal);
          setMetrics(metricsData);
          setRecentTransactions(transactionsData);
        }
      } catch {
        if (isMounted) {
          setHasRealData(false);
          setRecentTransactions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { hasReal, metricsData, transactionsData } =
        await loadDashboardData();
      setHasRealData(hasReal);
      setMetrics(metricsData);
      setRecentTransactions(transactionsData);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    txId: string,
    newStatus: OrderStatus
  ) => {
    const isSample = txId.startsWith("tx-sample-");
    const currentList =
      !hasRealData && showDemoData ? sampleTransactions : recentTransactions;
    const targetTx = currentList.find((t) => t.id === txId);
    const oldStatus = targetTx?.orderStatus;

    if (!oldStatus || oldStatus === newStatus) return;

    if (!hasRealData && showDemoData) {
      setRecentTransactions((prev) =>
        (prev.length > 0 ? prev : sampleTransactions).map((t) =>
          t.id === txId ? { ...t, orderStatus: newStatus } : t
        )
      );
      return;
    }

    const prevList = [...recentTransactions];
    setRecentTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, orderStatus: newStatus } : t))
    );

    setMetrics((prev) => {
      let activeDiff = 0;
      let volumeDiff = 0;

      if (oldStatus !== "completed" && newStatus === "completed") {
        activeDiff = -1;
        volumeDiff = targetTx ? targetTx.totalWeight : 0;
      } else if (oldStatus === "completed" && newStatus !== "completed") {
        activeDiff = 1;
        volumeDiff = targetTx ? -targetTx.totalWeight : 0;
      }

      return {
        ...prev,
        activeOrders: Math.max(0, prev.activeOrders + activeDiff),
        totalVolume: Math.max(0, prev.totalVolume + volumeDiff),
      };
    });

    try {
      if (!isSample) {
        await supabase
          .from("transactions")
          .update({ order_status: newStatus })
          .eq("id", txId);
      }
    } catch {
      setRecentTransactions(prevList);
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus => {
    switch (current) {
      case "pending":
        return "washing";
      case "washing":
        return "ironing";
      case "ironing":
        return "completed";
      default:
        return "completed";
    }
  };

  const getNextActionLabel = (current: OrderStatus): string => {
    switch (current) {
      case "pending":
        return "Mulai Cuci";
      case "washing":
        return "Mulai Setrika";
      case "ironing":
        return "Tandai Selesai";
      default:
        return "Selesai";
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-warning/15 text-[#b07b1a] border border-warning/30">
            <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse"></span>
            Pending
          </span>
        );
      case "washing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/30">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            Washing
          </span>
        );
      case "ironing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
            Ironing
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/30">
            <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  // Tentukan data yang aktif ditampilkan
  const effectiveTransactions =
    hasRealData
      ? recentTransactions
      : showDemoData
      ? recentTransactions.length > 0
        ? recentTransactions
        : sampleTransactions
      : [];

  const effectiveMetrics =
    hasRealData
      ? metrics
      : showDemoData
      ? sampleMetrics
      : metrics;

  const filteredTransactions = effectiveTransactions.filter((tx) => {
    if (statusFilter === "all") return true;
    return tx.orderStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-dark tracking-tight">
              Dashboard Overview
            </h1>
            {!hasRealData && showDemoData && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Sparkles className="h-3 w-3 text-amber-600" />
                Data Contoh
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Pemantauan performa harian operasional dan antrean cucian Laundry Insight
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {!hasRealData && (
            <button
              type="button"
              onClick={() => setShowDemoData((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
            >
              {showDemoData ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                  <span>Sembunyikan Contoh</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-amber-600" />
                  <span>Lihat contoh tampilan</span>
                </>
              )}
            </button>
          )}

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

      {/* Grid 4 Kartu Metrik */}
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total Omzet
                    </span>
                    {!hasRealData && showDemoData && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Contoh
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {formatRupiah(effectiveMetrics.totalRevenue)}
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total Cucian Selesai
                    </span>
                    {!hasRealData && showDemoData && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Contoh
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {effectiveMetrics.totalVolume.toFixed(1)}{" "}
                    <span className="text-base font-semibold text-gray-500">
                      Kg
                    </span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success shadow-xs shrink-0">
                  <PackageCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-flex items-center text-success font-medium">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Total
                </span>
                <span>Volume cucian rampung</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Antrean Aktif
                    </span>
                    {!hasRealData && showDemoData && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Contoh
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {effectiveMetrics.activeOrders}{" "}
                    <span className="text-base font-semibold text-gray-500">
                      Pesanan
                    </span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning shadow-xs shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-flex items-center text-warning font-medium">
                  {effectiveMetrics.activeOrders > 0 ? "Dalam Proses" : "Kosong"}
                </span>
                <span>Belum berstatus selesai</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Pelanggan Baru
                    </span>
                    {!hasRealData && showDemoData && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Contoh
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-dark tracking-tight">
                    {effectiveMetrics.newCustomers}{" "}
                    <span className="text-base font-semibold text-gray-500">
                      Orang
                    </span>
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

      {/* Bagian Tabel Transaksi */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-gray-100 gap-4 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-dark">
                Daftar 10 Transaksi Terbaru
              </h2>
              {hasRealData ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Live Status
                </span>
              ) : showDemoData ? (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Data Contoh
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Antrean pengerjaan cucian dengan fitur pembaruan status 1-klik langsung
            </p>
          </div>

          {(hasRealData || showDemoData) && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-50 p-1 rounded-lg border border-gray-200/80 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  statusFilter === "all"
                    ? "bg-dark text-white"
                    : "text-gray-600 hover:text-dark"
                }`}
              >
                Semua ({effectiveTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  statusFilter === "pending"
                    ? "bg-warning text-white"
                    : "text-gray-600 hover:text-warning"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("washing")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  statusFilter === "washing"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Washing
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ironing")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  statusFilter === "ironing"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:text-purple-600"
                }`}
              >
                Ironing
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                  statusFilter === "completed"
                    ? "bg-success text-white"
                    : "text-gray-600 hover:text-success"
                }`}
              >
                Selesai
              </button>
            </div>
          )}
        </div>

        {/* Kondisi Empty State Jujur saat belum ada data sama sekali dan bukan mode demo */}
        {!isLoading && !hasRealData && !showDemoData ? (
          <div className="p-8 sm:p-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-2xs">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-dark mb-1.5">
              Belum ada transaksi, mulai catat transaksi pertama
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
              Belum ada data transaksi yang tersimpan di sistem. Anda dapat mulai mencatat pesanan pelanggan atau mengimpor data spreadsheet.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/transactions/new"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Catat Transaksi Pertama</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowDemoData(true)}
                className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>Lihat contoh tampilan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="border-b border-gray-100 bg-[#F8F9FA] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Berat/Qty</th>
                  <th className="py-3 px-4">Total Harga</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status Pesanan</th>
                  <th className="py-3 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  // Loading Skeleton Rows
                  <>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-gray-100">
                        <td className="py-4 px-4">
                          <div className="h-3.5 w-28 bg-gray-200 rounded"></div>
                        </td>
                        <td className="py-4 px-4 space-y-1.5">
                          <div className="h-3.5 w-32 bg-gray-200 rounded"></div>
                          <div className="h-2.5 w-20 bg-gray-100 rounded"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-3.5 w-16 bg-gray-200 rounded"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-3.5 w-24 bg-gray-200 rounded"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-3.5 w-20 bg-gray-200 rounded"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="h-7 w-24 bg-gray-200 rounded-lg mx-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="h-6 w-6 text-gray-300" />
                        <span>Tidak ada transaksi pada filter ini.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const nextStatus = getNextStatus(tx.orderStatus);
                    const isCompleted = tx.orderStatus === "completed";

                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs font-bold text-dark">
                            {tx.invoice}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-dark">
                              {tx.customerName}
                            </span>
                            <span className="font-mono text-[11px] text-gray-400">
                              {tx.customerPhone}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-gray-700 font-medium">
                          {tx.totalWeight} kg
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-dark">
                              {formatRupiah(tx.totalAmount)}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                tx.paymentStatus === "paid"
                                  ? "bg-success/10 text-success"
                                  : "bg-warning/10 text-warning"
                              }`}
                            >
                              {tx.paymentStatus === "paid" ? "Lunas" : "Unpaid"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{formatDate(tx.createdAt)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {renderStatusBadge(tx.orderStatus)}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <select
                              aria-label={`Ubah status pesanan ${tx.invoice}`}
                              value={tx.orderStatus}
                              onChange={(e) =>
                                handleStatusChange(
                                  tx.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer font-medium"
                            >
                              <option value="pending">Pending</option>
                              <option value="washing">Washing</option>
                              <option value="ironing">Ironing</option>
                              <option value="completed">Completed</option>
                            </select>

                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(tx.id, nextStatus)}
                                title={getNextActionLabel(tx.orderStatus)}
                                className="flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-primary hover:text-white px-2 py-1 text-[11px] font-semibold text-gray-700 transition-colors shadow-2xs"
                              >
                                <span>{getNextActionLabel(tx.orderStatus)}</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Kartu Aksi Cepat */}
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
          <div className="flex flex-wrap items-center gap-2">
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
