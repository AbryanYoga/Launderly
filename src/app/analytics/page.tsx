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

const SKOTE_COLORS = ["#0284C7", "#34C38F", "#F1B44C", "#556EE6"];

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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>(mock7DaysRevenue);
  const [compositionData, setCompositionData] =
    useState<ServiceComposition[]>(mockComposition);
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
      .select("total_amount, total_weight, created_at")
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
    if (transactions && transactions.length >= 2) {
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

    return { points, comp };
  };

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const { points, comp } = await queryAnalytics(timeRange);
        if (isMounted) {
          setRevenueData(points);
          setCompositionData(comp);
        }
      } catch {
        if (isMounted) {
          if (timeRange === "7d") setRevenueData(mock7DaysRevenue);
          else if (timeRange === "30d") setRevenueData(mock30DaysRevenue);
          else setRevenueData(mockMonthRevenue);
          setCompositionData(mockComposition);
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
      const { points, comp } = await queryAnalytics(timeRange);
      setRevenueData(points);
      setCompositionData(comp);
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

  const averageOrderValue = useMemo(() => {
    if (totalPeriodOrders === 0) return 0;
    return Math.round(totalPeriodRevenue / totalPeriodOrders);
  }, [totalPeriodRevenue, totalPeriodOrders]);

  const topService = useMemo(() => {
    if (compositionData.length === 0) return "-";
    return [...compositionData].sort((a, b) => b.value - a.value)[0].name;
  }, [compositionData]);

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
            Visualisasi tren pendapatan dan komposisi pengerjaan cucian
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
              Nilai Rata-rata (AOV)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#556EE6]/10 text-[#556EE6]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-dark mt-2 tracking-tight">
            {formatRupiah(averageOrderValue)}
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

          <div className="h-[320px] w-full">
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

          <div className="h-[270px] w-full flex-1">
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
                    innerRadius={55}
                    outerRadius={85}
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
                    wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
