"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Zap,
  PieChart as PieIcon,
  Activity,
  Loader2,
} from "lucide-react";
import { DashboardAnalyticsResponse } from "../lib/api/types";
import { getAdminAnalytics } from "../lib/api/endpoints";

const PIE_COLORS = ["#8b5cf6", "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#06b6d4"];

function CustomChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { date?: string; revenue: number; orders: number; diamonds: number };
  }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-purple-500/30 text-xs backdrop-blur-md">
        <p className="font-bold text-purple-300 mb-1">{data.date || label}</p>
        <div className="space-y-1">
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Revenue:</span>
            <span className="font-black text-white">৳ {data.revenue.toLocaleString()}</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Orders:</span>
            <span className="font-bold text-purple-200">{data.orders} orders</span>
          </p>
          <p className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Diamonds:</span>
            <span className="font-bold text-pink-300">💎 {data.diamonds}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function AdminAnalyticsChart() {
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "1Y" | "ALL">("1W");
  const [metric, setMetric] = useState<"revenue" | "orders" | "diamonds">("revenue");
  const [distType, setDistType] = useState<"category" | "payment">("category");
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchAnalytics = async (tf: string) => {
    setIsLoading(true);
    try {
      const res = await getAdminAnalytics(tf);
      setAnalytics(res);
    } catch (err) {
      console.error("Failed to load admin analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe]);

  if (!isMounted) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-200">
        <Loader2 className="animate-spin text-purple-600" size={32} />
      </div>
    );
  }

  const summary = analytics?.summary;
  const timeseries = analytics?.timeseries || [];
  const categoryDist = analytics?.category_distribution || [];
  const paymentDist = analytics?.payment_distribution || [];
  const currentDist = distType === "category" ? categoryDist : paymentDist;

  const isGrowthPositive = (summary?.growth_rate || 0) >= 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Top Summary Banner (Finora Equities Style) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Total Revenue */}
          <div className="flex items-center gap-4 sm:pr-4 pt-2 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900 tabular-nums">
                ৳ {(summary?.total_revenue || 0).toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 font-medium">Total Sales Volume</p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="flex items-center gap-4 sm:px-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900 tabular-nums">
                {(summary?.total_orders || 0).toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 font-medium">Total Orders Placed</p>
            </div>
          </div>

          {/* Day's PnL / Today's Net */}
          <div className="flex items-center gap-4 sm:px-4 pt-4 sm:pt-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                (summary?.days_pnl || 0) >= 0
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {(summary?.days_pnl || 0) >= 0 ? (
                <TrendingUp size={24} />
              ) : (
                <TrendingDown size={24} />
              )}
            </div>
            <div>
              <h4
                className={`text-2xl font-black tabular-nums ${
                  (summary?.days_pnl || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {(summary?.days_pnl || 0) >= 0 ? "+" : "-"}৳{" "}
                {Math.abs(summary?.days_pnl || 0).toLocaleString()}
              </h4>
              <p className="text-xs text-slate-500 font-medium">Day&apos;s Revenue (Today)</p>
            </div>
          </div>

          {/* Success Rate & Growth */}
          <div className="flex items-center gap-4 sm:pl-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900 tabular-nums">
                {summary?.success_rate || 100}%
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Success Rate</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    isGrowthPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {isGrowthPositive ? "↑" : "↓"} {Math.abs(summary?.growth_rate || 0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Analytics Charts Grid (Performance Chart + Sectorial Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-start">
        {/* Left Column: Performance & Benchmarks (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
          {/* Card Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Activity size={18} className="text-purple-600" />
                Performance & Analytics
              </h3>
              <p className="text-xs text-slate-500">
                Track store revenue, top-up transactions, and customer volume across timeframes
              </p>
            </div>

            {/* Timeframe Filter Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl shrink-0 self-start sm:self-auto">
              {(["1D", "1W", "1M", "1Y", "ALL"] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    timeframe === tf
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setMetric("revenue")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                metric === "revenue"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Revenue (৳)
            </button>
            <button
              onClick={() => setMetric("orders")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                metric === "orders"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Orders Volume
            </button>
            <button
              onClick={() => setMetric("diamonds")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                metric === "diamonds"
                  ? "bg-pink-50 text-pink-700 border border-pink-200"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Diamonds Sold
            </button>
          </div>

          {/* Area Chart */}
          <div className="w-full h-72">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 gap-2 font-medium text-xs">
                <Loader2 className="animate-spin text-purple-600" size={24} /> Loading chart data...
              </div>
            ) : timeseries.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No timeseries records for this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDiamonds" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey={metric}
                    stroke={
                      metric === "revenue" ? "#8b5cf6" : metric === "orders" ? "#6366f1" : "#ec4899"
                    }
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={
                      metric === "revenue"
                        ? "url(#colorRevenue)"
                        : metric === "orders"
                          ? "url(#colorOrders)"
                          : "url(#colorDiamonds)"
                    }
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: Sectorial Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <PieIcon size={16} className="text-purple-600" />
                Sectorial Distribution
              </h3>
              <p className="text-xs text-slate-500">Sales breakdown by segment</p>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setDistType("category")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  distType === "category" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Category
              </button>
              <button
                onClick={() => setDistType("payment")}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  distType === "payment" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500"
                }`}
              >
                Gateway
              </button>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="w-full h-44 flex items-center justify-center">
            {currentDist.length === 0 ? (
              <p className="text-xs text-slate-400">No distribution data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentDist}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {currentDist.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => [`৳ ${Number(val).toLocaleString()}`, "Revenue"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Distribution Legend List */}
          <div className="space-y-2 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto">
            {currentDist.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  ></span>
                  <span className="text-slate-700 font-medium truncate max-w-[120px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-800 font-bold">
                  <span>৳ {item.revenue.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-sans">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
