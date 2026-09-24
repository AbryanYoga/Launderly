"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  RotateCw,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  ShoppingBag,
  Award,
  UserCheck,
  UserPlus,
  Flame,
  Clock,
  Sparkles,
  Crown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabase/client";

type TimeRange = "7d" | "30d" | "month";

interface RevenuePoint {
  date: string;
  omzet: number;
  pesanan: number;
}

interface ServiceComposition {
  name: string;
  value: number;
  color: string;
}

interface TransactionRecord {
  id: string;
  invoice: string;
  totalWeight: number;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  customerPhone: string;
}

const SKOTE_COLORS = ["#0284C7", "#34C38F", "#F1B44C", "#556EE6"];

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const TIME_SLOTS = [
  { label: "07:00 - 10:00", start: 7, end: 10 },
  { label: "10:00 - 13:00", start: 10, end: 13 },
  { label: "13:00 - 16:00", start: 13, end: 16 },
  { label: "16:00 - 19:00", start: 16, end: 19 },
  { label: "19:00 - 21:00", start: 19, end: 22 },
];

function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

const mock7DaysRevenue: RevenuePoint[] = [
  { date: "18 Sep", omzet: 145000, pesanan: 5 },
  { date: "19 Sep", omzet: 210000, pesanan: 7 },
  { date: "20 Sep", omzet: 180000, pesanan: 6 },
  { date: "21 Sep", omzet: 320000, pesanan: 11 },
  { date: "22 Sep", omzet: 280000, pesanan: 9 },
  { date: "23 Sep", omzet: 390000, pesanan: 13 },
  { date: "24 Sep", omzet: 425000, pesanan: 14 },
];

const mock30DaysRevenue: RevenuePoint[] = [
  { date: "Minggu 1", omzet: 1250000, pesanan: 42 },
  { date: "Minggu 2", omzet: 1680000, pesanan: 56 },
  { date: "Minggu 3", omzet: 1940000, pesanan: 63 },
  { date: "Minggu 4", omzet: 2350000, pesanan: 75 },
];

const mockMonthRevenue: RevenuePoint[] = [
  { date: "01-05", omzet: 850000, pesanan: 28 },
  { date: "06-10", omzet: 1120000, pesanan: 36 },
  { date: "11-15", omzet: 1400000, pesanan: 45 },
  { date: "16-20", omzet: 1650000, pesanan: 53 },
  { date: "21-25", omzet: 1980000, pesanan: 64 },
];

const mockComposition: ServiceComposition[] = [
  { name: "Cuci Komplit (Kiloan)", value: 54, color: "#0284C7" },
  { name: "Cuci Kering (Kiloan)", value: 26, color: "#34C38F" },
  { name: "Bed Cover (Satuan)", value: 14, color: "#556EE6" },
  { name: "Satuan Khusus", value: 6, color: "#F1B44C" },
];

const sampleOperationalTransactions: TransactionRecord[] = [
  { id: "1", invoice: "INV/260924/1001", totalWeight: 4.5, totalAmount: 36000, createdAt: "2026-09-21T08:30:00Z", customerName: "Ibu Rina Susanti", customerPhone: "081234567891" },
  { id: "2", invoice: "INV/260924/1002", totalWeight: 3.0, totalAmount: 24000, createdAt: "2026-09-21T11:15:00Z", customerName: "Budi Santoso", customerPhone: "081234567892" },
  { id: "3", invoice: "INV/260924/1003", totalWeight: 5.0, totalAmount: 40000, createdAt: "2026-09-21T17:45:00Z", customerName: "Ahmad Subagio", customerPhone: "081987654321" },
  { id: "4", invoice: "INV/260924/1004", totalWeight: 2.0, totalAmount: 16000, createdAt: "2026-09-22T09:20:00Z", customerName: "Dewi Lestari", customerPhone: "081399887766" },
  { id: "5", invoice: "INV/260924/1005", totalWeight: 4.0, totalAmount: 32000, createdAt: "2026-09-22T10:45:00Z", customerName: "Ibu Rina Susanti", customerPhone: "081234567891" },
  { id: "6", invoice: "INV/260924/1006", totalWeight: 6.0, totalAmount: 50000, createdAt: "2026-09-22T14:10:00Z", customerName: "Siti Rahmawati", customerPhone: "085678901234" },
  { id: "7", invoice: "INV/260924/1007", totalWeight: 2.5, totalAmount: 20000, createdAt: "2026-09-23T10:15:00Z", customerName: "Hendra Wijaya", customerPhone: "082144556677" },
  { id: "8", invoice: "INV/260924/1008", totalWeight: 3.5, totalAmount: 28000, createdAt: "2026-09-23T11:50:00Z", customerName: "Budi Santoso", customerPhone: "081234567892" },
  { id: "9", invoice: "INV/260924/1009", totalWeight: 5.5, totalAmount: 44000, createdAt: "2026-09-23T15:30:00Z", customerName: "Ibu Rina Susanti", customerPhone: "081234567891" },
  { id: "10", invoice: "INV/260924/1010", totalWeight: 7.0, totalAmount: 60000, createdAt: "2026-09-24T10:05:00Z", customerName: "Ahmad Subagio", customerPhone: "081987654321" },
  { id: "11", invoice: "INV/260924/1011", totalWeight: 3.0, totalAmount: 25000, createdAt: "2026-09-24T11:40:00Z", customerName: "Dewi Lestari", customerPhone: "081399887766" },
  { id: "12", invoice: "INV/260924/1012", totalWeight: 4.0, totalAmount: 32000, createdAt: "2026-09-24T16:20:00Z", customerName: "Budi Santoso", customerPhone: "081234567892" },
  { id: "13", invoice: "INV/260924/1013", totalWeight: 8.0, totalAmount: 68000, createdAt: "2026-09-24T18:10:00Z", customerName: "Ibu Rina Susanti", customerPhone: "081234567891" },
  { id: "14", invoice: "INV/260924/1014", totalWeight: 5.0, totalAmount: 42000, createdAt: "2026-09-20T10:30:00Z", customerName: "Ahmad Subagio", customerPhone: "081987654321" },
  { id: "15", invoice: "INV/260924/1015", totalWeight: 2.5, totalAmount: 20000, createdAt: "2026-09-20T11:20:00Z", customerName: "Fitri Handayani", customerPhone: "081277889900" },
  { id: "16", invoice: "INV/260924/1016", totalWeight: 6.5, totalAmount: 52000, createdAt: "2026-09-20T14:40:00Z", customerName: "Budi Santoso", customerPhone: "081234567892" },
  { id: "17", invoice: "INV/260924/1017", totalWeight: 4.0, totalAmount: 35000, createdAt: "2026-09-19T09:00:00Z", customerName: "Siti Rahmawati", customerPhone: "085678901234" },
  { id: "18", invoice: "INV/260924/1018", totalWeight: 3.5, totalAmount: 30000, createdAt: "2026-09-19T11:00:00Z", customerName: "Dewi Lestari", customerPhone: "081399887766" },
  { id: "19", invoice: "INV/260924/1019", totalWeight: 5.0, totalAmount: 40000, createdAt: "2026-09-19T17:10:00Z", customerName: "Ibu Rina Susanti", customerPhone: "081234567891" },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>(mock7DaysRevenue);
  const [compositionData, setCompositionData] =
    useState<ServiceComposition[]>(mockComposition);
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>(
    sampleOperationalTransactions
  );
  const [isLoading, setIsLoading] = useState(true);

  const queryAnalytics = async (range: TimeRange) => {
    const now = new Date();
    const startDate = new Date();

    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "month") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const { data: transactions } = await supabase
      .from("transactions")
      .select(`
        id,
        invoice,
        total_amount,
        total_weight,
        created_at,
        customers (
          name,
          phone
        )
      `)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    const { data: items } = await supabase
      .from("transaction_items")
      .select(`
        qty,
        subtotal,
        services (
          name,
          unit
        )
      `);

    let points: RevenuePoint[] = [];
    let records: TransactionRecord[] = [];

    if (transactions && transactions.length >= 2) {
      interface RawCustomer {
        name?: string;
        phone?: string;
      }
      interface RawTx {
        id: string;
        invoice: string;
        total_amount: number;
        total_weight: number;
        created_at: string;
        customers?: RawCustomer | RawCustomer[];
      }

      records = (transactions as unknown as RawTx[]).map((t) => {
        const c = Array.isArray(t.customers) ? t.customers[0] : t.customers;
        return {
          id: t.id,
          invoice: t.invoice,
          totalAmount: Number(t.total_amount) || 0,
          totalWeight: Number(t.total_weight) || 0,
          createdAt: t.created_at,
          customerName: c?.name || "Pelanggan",
          customerPhone: c?.phone || "-",
        };
      });

      const grouped: Record<string, { omzet: number; pesanan: number }> = {};
      transactions.forEach((tx) => {
        const d = new Date(tx.created_at);
        const key = new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
        }).format(d);

        if (!grouped[key]) {
          grouped[key] = { omzet: 0, pesanan: 0 };
        }
        grouped[key].omzet += Number(tx.total_amount) || 0;
        grouped[key].pesanan += 1;
      });

      points = Object.keys(grouped).map((k) => ({
        date: k,
        omzet: grouped[k].omzet,
        pesanan: grouped[k].pesanan,
      }));
    } else {
      if (range === "7d") points = mock7DaysRevenue;
      else if (range === "30d") points = mock30DaysRevenue;
      else points = mockMonthRevenue;

      records = sampleOperationalTransactions;
    }

    let comp: ServiceComposition[] = [];
    if (items && items.length > 0) {
      interface RawItemService {
        name?: string;
        unit?: string;
      }
      interface RawItemRow {
        qty: number;
        subtotal: number;
        services?: RawItemService | RawItemService[];
      }
      const counts: Record<string, number> = {};

      (items as unknown as RawItemRow[]).forEach((it) => {
        const s = Array.isArray(it.services) ? it.services[0] : it.services;
        const sName = s?.name || "Lainnya";
        counts[sName] = (counts[sName] || 0) + (Number(it.qty) || 1);
      });

      comp = Object.keys(counts).map((k, idx) => ({
        name: k,
        value: counts[k],
        color: SKOTE_COLORS[idx % SKOTE_COLORS.length],
      }));
    } else {
      comp = mockComposition;
    }

    return { points, comp, records };
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const { points, comp, records } = await queryAnalytics(timeRange);
        if (isMounted) {
          setRevenueData(points);
          setCompositionData(comp);
          setAllTransactions(records);
        }
      } catch {
        if (isMounted) {
          if (timeRange === "7d") setRevenueData(mock7DaysRevenue);
          else if (timeRange === "30d") setRevenueData(mock30DaysRevenue);
          else setRevenueData(mockMonthRevenue);
          setCompositionData(mockComposition);
          setAllTransactions(sampleOperationalTransactions);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  const handleRangeChange = (newRange: TimeRange) => {
    setIsLoading(true);
    setTimeRange(newRange);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { points, comp, records } = await queryAnalytics(timeRange);
      setRevenueData(points);
      setCompositionData(comp);
      setAllTransactions(records);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const totalPeriodRevenue = useMemo(
    () => revenueData.reduce((acc, curr) => acc + curr.omzet, 0),
    [revenueData]
  );

  const totalPeriodOrders = useMemo(
    () => revenueData.reduce((acc, curr) => acc + curr.pesanan, 0),
    [revenueData]
  );

  const topService = useMemo(() => {
    if (compositionData.length === 0) return "-";
    return [...compositionData].sort((a, b) => b.value - a.value)[0].name;
  }, [compositionData]);

  const peakMatrix = useMemo(() => {
    const initialGrid = DAYS.map(() => TIME_SLOTS.map(() => 0));

    return allTransactions.reduce((grid, tx) => {
      const d = new Date(tx.createdAt);
      const dayIdx = (d.getDay() + 6) % 7;
      const hour = d.getHours();
      const slotIdx = TIME_SLOTS.findIndex(
        (s) => hour >= s.start && hour < s.end
      );

      if (
        dayIdx >= 0 &&
        dayIdx < 7 &&
        slotIdx >= 0 &&
        slotIdx < TIME_SLOTS.length
      ) {
        grid[dayIdx][slotIdx] += 1;
      }
      return grid;
    }, initialGrid);
  }, [allTransactions]);

  const { busiestDay, peakSlot, maxDayTotal, maxSlotTotal } = useMemo(() => {
    const dayTotals = peakMatrix.map((row) =>
      row.reduce((acc, count) => acc + count, 0)
    );
    const slotTotals = TIME_SLOTS.map((_, colIdx) =>
      peakMatrix.reduce((acc, row) => acc + row[colIdx], 0)
    );

    const maxDayIdx = dayTotals.reduce(
      (maxI, val, idx, arr) => (val > arr[maxI] ? idx : maxI),
      0
    );
    const maxSlotIdx = slotTotals.reduce(
      (maxI, val, idx, arr) => (val > arr[maxI] ? idx : maxI),
      0
    );

    return {
      busiestDay: DAYS[maxDayIdx],
      peakSlot: TIME_SLOTS[maxSlotIdx].label,
      maxDayTotal: dayTotals[maxDayIdx],
      maxSlotTotal: slotTotals[maxSlotIdx],
    };
  }, [peakMatrix]);

  const retentionMetrics = useMemo(() => {
    const customerSummary = allTransactions.reduce((acc, tx) => {
      const key = tx.customerPhone || tx.customerName || "unknown";
      if (!acc[key]) {
        acc[key] = {
          name: tx.customerName,
          phone: tx.customerPhone,
          totalOrders: 0,
          totalSpent: 0,
        };
      }
      acc[key].totalOrders += 1;
      acc[key].totalSpent += tx.totalAmount;
      return acc;
    }, {} as Record<string, { name: string; phone: string; totalOrders: number; totalSpent: number }>);

    const customerList = Object.values(customerSummary);
    const totalCustomers = customerList.length;

    const repeatCustomers = customerList.filter((c) => c.totalOrders > 1);
    const newCustomers = customerList.filter((c) => c.totalOrders === 1);

    const repeatCount = repeatCustomers.length;
    const newCount = newCustomers.length;
    const repeatRate =
      totalCustomers > 0 ? Math.round((repeatCount / totalCustomers) * 100) : 0;
    const newRate = 100 - repeatRate;

    const totalRevenueAll = allTransactions.reduce(
      (sum, tx) => sum + tx.totalAmount,
      0
    );
    const aov =
      allTransactions.length > 0
        ? Math.round(totalRevenueAll / allTransactions.length)
        : 0;

    const avgSpentPerCustomer =
      totalCustomers > 0 ? Math.round(totalRevenueAll / totalCustomers) : 0;

    return {
      totalCustomers,
      repeatCount,
      newCount,
      repeatRate,
      newRate,
      aov,
      avgSpentPerCustomer,
    };
  }, [allTransactions]);

  const loyalCustomers = useMemo(() => {
    const grouped = allTransactions.reduce((acc, tx) => {
      const key = tx.customerPhone || tx.customerName || "unknown";
      if (!acc[key]) {
        acc[key] = {
          name: tx.customerName,
          phone: tx.customerPhone,
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: tx.createdAt,
        };
      }
      acc[key].totalOrders += 1;
      acc[key].totalSpent += tx.totalAmount;
      if (new Date(tx.createdAt) > new Date(acc[key].lastOrder)) {
        acc[key].lastOrder = tx.createdAt;
      }
      return acc;
    }, {} as Record<string, { name: string; phone: string; totalOrders: number; totalSpent: number; lastOrder: string }>);

    return Object.values(grouped)
      .sort(
        (a, b) => b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent
      )
      .slice(0, 5)
      .map((cust, idx) => ({
        ...cust,
        rank: idx + 1,
        tier: idx === 0 ? "Platinum" : idx < 3 ? "Gold" : "Silver",
      }));
  }, [allTransactions]);

  const getHeatColorClass = (count: number) => {
    if (count === 0) return "bg-gray-50 text-gray-400";
    if (count <= 1) return "bg-primary/10 text-primary font-medium";
    if (count <= 3) return "bg-primary/25 text-[#026aa0] font-semibold";
    if (count <= 5) return "bg-primary/60 text-white font-bold";
    return "bg-primary text-white font-extrabold shadow-2xs";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/"
              className="text-gray-400 hover:text-dark transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl font-bold text-dark">Analitik & Laporan</h1>
          </div>
          <p className="text-xs text-gray-500">
            Visualisasi tren pendapatan, retensi pelanggan, dan matriks operasional jam ramai
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-xs text-xs">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              aria-label="Filter Rentang Waktu"
              value={timeRange}
              onChange={(e) => handleRangeChange(e.target.value as TimeRange)}
              className="bg-transparent font-semibold text-dark focus:outline-none cursor-pointer"
            >
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
            </select>
          </div>

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
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Omzet Periode
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-dark mt-2 tracking-tight">
            {formatRupiah(totalPeriodRevenue)}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Filter: {timeRange === "7d" ? "7 Hari" : timeRange === "30d" ? "30 Hari" : "Bulan Ini"}
          </span>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Total Pesanan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-dark mt-2 tracking-tight">
            {totalPeriodOrders} <span className="text-xs font-normal text-gray-500">Nota</span>
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Transaksi terdata
          </span>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Rata-rata Nota (AOV)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#556EE6]/10 text-[#556EE6]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-dark mt-2 tracking-tight">
            {formatRupiah(retentionMetrics.aov)}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Per nota transaksi
          </span>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Layanan Terlaris
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/15 text-[#c2841d]">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-dark mt-2 truncate">
            {topService}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Porsi volume tertinggi
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-dark">
                  Grafik Tren Pendapatan
                </h2>
                <p className="text-xs text-gray-400">
                  Total omzet harian/mingguan dalam rentang waktu yang dipilih
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              Area Chart
            </span>
          </div>

          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                Memuat visualisasi grafik...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : `${v}`
                    }
                  />
                  <Tooltip
                    formatter={(val) => [formatRupiah(Number(val) || 0), "Omzet"]}
                    contentStyle={{
                      backgroundColor: "#2A3042",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    labelStyle={{ color: "#a6b0cf", fontWeight: 600, marginBottom: "4px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="omzet"
                    stroke="#0284C7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#omzetGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <PieIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-dark">
                  Komposisi Layanan
                </h2>
                <p className="text-xs text-gray-400">
                  Proporsi beban pengerjaan
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-success bg-success/10 px-2.5 py-1 rounded-full">
              Donut
            </span>
          </div>

          <div className="h-[250px] w-full flex-1">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-success border-t-transparent mr-2"></div>
                Menghitung porsi...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compositionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {compositionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || SKOTE_COLORS[index % SKOTE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val} Unit / Kg`, "Volume"]}
                    contentStyle={{
                      backgroundColor: "#2A3042",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#556EE6]/10 text-[#556EE6]">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-dark">
                    Metrik Retensi & Nilai Transaksi
                  </h2>
                  <p className="text-xs text-gray-400">
                    Perbandingan repeat customer dan rata-rata kontribusi pelanggan
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#556EE6] bg-[#556EE6]/10 px-2.5 py-1 rounded-full">
                Loyalty Rate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl bg-[#F8F9FA] p-4 border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <UserCheck className="h-3.5 w-3.5 text-success" />
                  <span>Repeat Customer</span>
                </div>
                <p className="text-2xl font-bold text-dark mt-2">
                  {retentionMetrics.repeatRate}%
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {retentionMetrics.repeatCount} dari {retentionMetrics.totalCustomers} pelanggan
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F9FA] p-4 border border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                  <span>Pelanggan Baru</span>
                </div>
                <p className="text-2xl font-bold text-dark mt-2">
                  {retentionMetrics.newRate}%
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {retentionMetrics.newCount} pelanggan 1x order
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1.5 text-success">
                  <span className="h-2 w-2 rounded-full bg-success"></span>
                  Repeat Customer ({retentionMetrics.repeatRate}%)
                </span>
                <span className="flex items-center gap-1.5 text-primary">
                  Pelanggan Baru ({retentionMetrics.newRate}%)
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
                <div
                  className="h-full bg-success transition-all duration-500"
                  style={{ width: `${retentionMetrics.repeatRate}%` }}
                />
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${retentionMetrics.newRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Rata-rata Belanja per Pelanggan (CLV):</span>
            <span className="font-bold text-dark text-sm">
              {formatRupiah(retentionMetrics.avgSpentPerCustomer)}
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-[#c2841d]">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-dark">
                  Top 5 Pelanggan Paling Loyal
                </h2>
                <p className="text-xs text-gray-400">
                  Berdasarkan frekuensi transaksi dan akumulasi total belanja
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-full">
              Ranked
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {loyalCustomers.map((cust) => (
              <div
                key={cust.phone || cust.name}
                className="py-3 flex items-center justify-between hover:bg-gray-50/70 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                      cust.rank === 1
                        ? "bg-warning text-white shadow-2xs"
                        : cust.rank === 2
                        ? "bg-slate-300 text-slate-700"
                        : cust.rank === 3
                        ? "bg-amber-700 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    #{cust.rank}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-dark leading-tight">
                      {cust.name}
                    </p>
                    <p className="font-mono text-[11px] text-gray-400 mt-0.5">
                      {cust.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {cust.totalOrders} Pesanan
                    </span>
                    <p className="text-xs font-bold text-dark mt-1">
                      {formatRupiah(cust.totalSpent)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      cust.tier === "Platinum"
                        ? "bg-purple-100 text-purple-700"
                        : cust.tier === "Gold"
                        ? "bg-warning/20 text-[#b07b1a]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {cust.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10 text-danger">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-dark">
                Matriks Jam Ramai (Peak Hours & Peak Days)
              </h2>
              <p className="text-xs text-gray-400">
                Distribusi kedatangan pesanan untuk memetakan beban dan jam operasional terpadat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-3 py-1.5 rounded-lg border border-gray-100">
              <Sparkles className="h-3.5 w-3.5 text-warning" />
              <span className="text-gray-500">Hari Tersibuk:</span>
              <span className="font-bold text-dark">{busiestDay} ({maxDayTotal} Order)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F8F9FA] px-3 py-1.5 rounded-lg border border-gray-100">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-gray-500">Jam Terpadat:</span>
              <span className="font-bold text-dark">{peakSlot} ({maxSlotTotal} Order)</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-dark uppercase">
                <th className="py-3 px-4 text-left font-bold text-gray-500">Hari / Rentang Jam</th>
                {TIME_SLOTS.map((slot) => (
                  <th key={slot.label} className="py-3 px-4 font-semibold text-dark">
                    {slot.label}
                  </th>
                ))}
                <th className="py-3 px-4 font-bold text-primary bg-primary/5">Total Hari</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {DAYS.map((dayName, dayIdx) => {
                const rowCounts = peakMatrix[dayIdx] || [];
                const rowTotal = rowCounts.reduce((a, b) => a + b, 0);
                const isBusiest = dayName === busiestDay;

                return (
                  <tr key={dayName} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-left font-sans font-bold text-dark flex items-center gap-2">
                      <span>{dayName}</span>
                      {isBusiest && (
                        <span className="rounded bg-danger/10 text-danger px-1.5 py-0.5 text-[9px] font-bold font-sans">
                          Peak Day
                        </span>
                      )}
                    </td>
                    {rowCounts.map((count, slotIdx) => (
                      <td key={slotIdx} className="py-2.5 px-3">
                        <div
                          className={`mx-auto flex h-9 w-14 items-center justify-center rounded-lg text-xs transition-all ${getHeatColorClass(
                            count
                          )}`}
                          title={`${dayName}, ${TIME_SLOTS[slotIdx].label}: ${count} Transaksi`}
                        >
                          {count}
                        </div>
                      </td>
                    ))}
                    <td className="py-2.5 px-4 font-bold text-primary bg-primary/5 font-sans">
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400">
          <div className="flex items-center gap-2">
            <span>Intensitas:</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-6 rounded bg-gray-50 border border-gray-200 text-[9px] text-center leading-3.5">0</span>
              <span className="text-[10px] text-gray-500">Tenang</span>
              <span className="inline-block h-3.5 w-6 rounded bg-primary/10 text-primary text-[9px] text-center leading-3.5">1-2</span>
              <span className="text-[10px] text-gray-500">Rendah</span>
              <span className="inline-block h-3.5 w-6 rounded bg-primary/25 text-[#026aa0] text-[9px] text-center leading-3.5">3-5</span>
              <span className="text-[10px] text-gray-500">Sedang</span>
              <span className="inline-block h-3.5 w-6 rounded bg-primary/60 text-white text-[9px] text-center leading-3.5 font-bold">6-8</span>
              <span className="text-[10px] text-gray-500">Ramai</span>
              <span className="inline-block h-3.5 w-6 rounded bg-primary text-white text-[9px] text-center leading-3.5 font-bold">&gt;8</span>
              <span className="text-[10px] text-gray-500">Puncak</span>
            </div>
          </div>
          <span className="text-gray-400">
            Dianalisis dari seluruh transaksi riwayat operasional
          </span>
        </div>
      </div>
    </div>
  );
}
