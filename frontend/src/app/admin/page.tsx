"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  RefreshCw,
  Zap,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  ShieldCheck,
  Activity,
  Server,
  Smartphone,
  ExternalLink,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { DashboardMetrics } from "../../lib/api/types";
import { getAdminDashboard, syncExternalDiamondProducts } from "../../lib/api/endpoints";
import { useAuth } from "../../lib/auth/AuthContext";
import { AdminAnalyticsChart } from "../../components/AdminAnalyticsChart";

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchDashboard = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(true);
  }, []);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    setNotification(null);
    try {
      const res = await syncExternalDiamondProducts();
      if (res.success) {
        setNotification({
          type: "success",
          text: `Diamond packages synced successfully! (${res.synced_count || 0} packages updated)`,
        });
        await fetchDashboard(false);
      } else {
        setNotification({
          type: "error",
          text: res.message || "Failed to sync external diamond packages.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Provider synchronization failed.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p className="text-slate-600 dark:text-zinc-400 font-medium text-xs">
          Loading operations dashboard...
        </p>
      </div>
    );
  }

  const bkashStatus = data?.gateway_status?.bkash;
  const nagadStatus = data?.gateway_status?.nagad;
  const providerStatus = data?.gateway_status?.diamond_provider;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Operations Console
            </h1>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Systems
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            Real-time sales KPI benchmarks, Free Fire API fulfillment engine & payment gateways
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchDashboard(false);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> Refresh Data
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="uppercase text-[10px] ml-4 font-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* 2. Top-Level Production Real-Time KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <DollarSign size={15} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tabular-nums truncate">
              {data?.total_revenue || data?.revenue_today || "৳ 0.00"}
            </h3>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
              Today: {data?.revenue_today || "৳ 0.00"}
            </p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Gross Profit</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
              {data?.gross_profit || "৳ 0.00"}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
              Price - Provider Cost
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingCart size={15} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
              {(data?.total_orders || data?.orders_today || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              Today: {data?.orders_today || 0} orders
            </p>
          </div>
        </div>

        {/* Pending Payments */}
        <Link
          href="/admin/payments"
          className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 hover:border-amber-400 shadow-xs flex flex-col justify-between group transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Payments
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tabular-nums flex items-center justify-between">
              <span>{data?.pending_payments || 0}</span>
              <ArrowUpRight
                size={14}
                className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all"
              />
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
              Requires 1-click review
            </p>
          </div>
        </Link>

        {/* Pending Fulfillments */}
        <Link
          href="/admin/orders?fulfillmentStatus=PROCESSING"
          className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400 shadow-xs flex flex-col justify-between group transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Fulfillments
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap size={15} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tabular-nums flex items-center justify-between">
              <span>{data?.processing_fulfillment || 0}</span>
              <ArrowUpRight
                size={14}
                className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
              />
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              Processing in queue
            </p>
          </div>
        </Link>

        {/* Active Customers */}
        <Link
          href="/admin/users"
          className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] hover:border-purple-300 dark:hover:border-purple-800 shadow-xs flex flex-col justify-between group transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Active Users</span>
            <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Users size={15} />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tabular-nums flex items-center justify-between">
              <span>{(data?.active_customers || 1).toLocaleString()}</span>
              <ArrowUpRight
                size={14}
                className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all"
              />
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium mt-0.5">
              Registered customers
            </p>
          </div>
        </Link>
      </div>

      {/* 3. Quick Action Operations Bar & Gateway Health Status Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 block mb-1">
              Command Actions
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Quick Operations</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Instant shortcuts for high-frequency administrator tasks
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/admin/payments"
              className="bg-slate-50 hover:bg-purple-50/70 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-amber-500" />
                <span className="group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Verify Pending Payments</span>
              </div>
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-400 dark:text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200 dark:border-transparent">
                {data?.pending_payments || 0}
              </span>
            </Link>

            <Link
              href="/admin/orders?fulfillmentStatus=FAILED"
              className="bg-slate-50 hover:bg-red-50/70 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2">
                <RotateCw size={15} className="text-red-500" />
                <span className="group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">Retry Failed Orders</span>
              </div>
              <span className="bg-red-100 text-red-700 dark:bg-red-500 dark:text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200 dark:border-transparent">
                {data?.failed_fulfillment || 0}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleQuickSync}
              disabled={isSyncing}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 shadow-xs shadow-purple-600/20"
            >
              <div className="flex items-center gap-2">
                <RefreshCw size={15} className={isSyncing ? "animate-spin" : ""} />
                <span>Sync Diamond Packages</span>
              </div>
              <span className="text-[10px] font-mono text-purple-100 bg-purple-700/80 px-2 py-0.5 rounded-md">Live API</span>
            </button>
          </div>
        </div>

        {/* Gateway Health & Provider API Status (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111111] p-6 rounded-3xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Activity size={18} className="text-purple-600 dark:text-purple-400" />
                Gateway Health & Top-up Provider Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Real-time operational status for mobile payment receivers and Free Fire API
              </p>
            </div>
            <Link
              href="/admin/payment-methods"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
            >
              Configure <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* bKash Widget */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#171717] border border-slate-200/80 dark:border-[#262626] flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-pink-600" />
                  <span className="font-bold text-xs text-slate-800 dark:text-white">bKash</span>
                </div>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    bkashStatus?.active
                      ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                      : "bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {bkashStatus?.active ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="text-slate-400 dark:text-zinc-500 font-mono">
                  No: {bkashStatus?.account_number || "01700000000"}
                </p>
                <p className="text-purple-700 dark:text-purple-300 font-bold uppercase text-[10px]">
                  Mode: {bkashStatus?.type || "MANUAL (Send Money)"}
                </p>
              </div>
            </div>

            {/* Nagad Widget */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#171717] border border-slate-200/80 dark:border-[#262626] flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-orange-500" />
                  <span className="font-bold text-xs text-slate-800 dark:text-white">Nagad</span>
                </div>
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                    nagadStatus?.active
                      ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                      : "bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {nagadStatus?.active ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="text-slate-400 dark:text-zinc-500 font-mono">
                  No: {nagadStatus?.account_number || "01800000000"}
                </p>
                <p className="text-purple-700 dark:text-purple-300 font-bold uppercase text-[10px]">
                  Mode: {nagadStatus?.type || "MANUAL (Send Money)"}
                </p>
              </div>
            </div>

            {/* Diamond Provider Widget */}
            <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-xs text-slate-800 dark:text-white">
                    Diamond Provider
                  </span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                  Connected
                </span>
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="text-slate-500 dark:text-zinc-400">
                  Engine:{" "}
                  <strong className="text-slate-800 dark:text-zinc-200">
                    {providerStatus?.name || "Automated Engine"}
                  </strong>
                </p>
                <p className="text-purple-700 dark:text-purple-300 font-bold uppercase text-[10px]">
                  Mode: {providerStatus?.mode || "LOCAL"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Finora-Inspired Interactive Analytics Chart System */}
      <AdminAnalyticsChart />

      {/* 5. Failed Fulfillment Warning Alert if any */}
      {(data?.failed_fulfillment || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-between text-red-800 dark:text-red-300 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>
              Attention: {data?.failed_fulfillment} orders encountered top-up fulfillment errors and
              require 1-click retry.
            </span>
          </div>
          <Link
            href="/admin/orders?fulfillmentStatus=FAILED"
            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 transition-colors"
          >
            Review Failed Orders
          </Link>
        </div>
      )}

      {/* 6. Recent Orders Table */}
      <div className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200/80 dark:border-[#222222] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-[#1f1f1f] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Recent Top-Up Transactions</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Latest customer Free Fire diamond top-up submissions
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
          >
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#171717] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-[#1f1f1f]">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">UID</th>
                <th className="p-4">Package</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-[#1f1f1f]">
              {!data?.recent_orders || data.recent_orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-slate-400 dark:text-zinc-500 font-medium"
                  >
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                data.recent_orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {o.public_order_id}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-zinc-300 font-medium">
                      {o.customer_email || "Guest"}
                    </td>
                    <td className="p-4 font-mono text-slate-800 dark:text-zinc-200">
                      {o.player_uid}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                      {o.product_name}
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white">
                      ৳ {o.total_amount}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          o.payment_status === "VERIFIED"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                            : o.payment_status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : o.payment_status === "REJECTED"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          o.fulfillment_status === "COMPLETED"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                            : o.fulfillment_status === "PROCESSING"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : o.fulfillment_status === "FAILED"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {o.fulfillment_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/orders?search=${o.public_order_id}`}
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400 font-bold"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
