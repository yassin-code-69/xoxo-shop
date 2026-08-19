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
} from "lucide-react";
import { DashboardMetrics } from "../../lib/api/types";
import { getAdminDashboard } from "../../lib/api/endpoints";
import { useAuth } from "../../lib/auth/AuthContext";
import { AdminAnalyticsChart } from "../../components/AdminAnalyticsChart";

export default function AdminDashboard() {
  const { isAdmin, loginWithMock } = useAuth();
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleBootstrapAdmin = async () => {
    await loginWithMock("admin@xoxoshop.com", "Administrator", "ADMIN");
    fetchDashboard(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p className="text-slate-600 font-medium text-sm">Loading admin overview...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time analytics, sales benchmarks, payments & automated Free Fire fulfillment
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {!isAdmin && (
            <button
              onClick={handleBootstrapAdmin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Sign in as Admin
            </button>
          )}

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchDashboard(false);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Finora-Inspired Interactive Analytics Chart System */}
      <AdminAnalyticsChart />

      {/* Secondary Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link
          href="/admin/payments"
          className="bg-white p-5 rounded-2xl border border-amber-200 hover:border-amber-400 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-amber-600">Pending Verification</p>
              <h3 className="text-xl font-black text-slate-800">{data?.pending_payments || 0}</h3>
            </div>
          </div>
          <ArrowUpRight
            size={16}
            className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        <Link
          href="/admin/orders?fulfillmentStatus=PROCESSING"
          className="bg-white p-5 rounded-2xl border border-blue-200 hover:border-blue-400 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-blue-600">Processing Delivery</p>
              <h3 className="text-xl font-black text-slate-800">
                {data?.processing_fulfillment || 0}
              </h3>
            </div>
          </div>
          <ArrowUpRight
            size={16}
            className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all"
          />
        </Link>

        <Link
          href="/admin/orders?fulfillmentStatus=COMPLETED"
          className="bg-white p-5 rounded-2xl border border-emerald-200 hover:border-emerald-400 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-emerald-600">Completed Today</p>
              <h3 className="text-xl font-black text-slate-800">{data?.completed_today || 0}</h3>
            </div>
          </div>
          <ArrowUpRight
            size={16}
            className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all"
          />
        </Link>
      </div>

      {/* Failed Fulfillment Warning Alert if any */}
      {(data?.failed_fulfillment || 0) > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>
              Attention: {data?.failed_fulfillment} orders have failed top-up fulfillment and
              require review or retry.
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

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Recent Customer Orders</h3>
            <p className="text-xs text-slate-400">Latest Free Fire diamond top-up transactions</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
            <tbody className="text-xs divide-y divide-slate-100">
              {!data?.recent_orders || data.recent_orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    No orders recorded yet.
                  </td>
                </tr>
              ) : (
                data.recent_orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-purple-600">{o.public_order_id}</td>
                    <td className="p-4 text-slate-700 font-medium">
                      {o.customer_email || "Guest"}
                    </td>
                    <td className="p-4 font-mono text-slate-800">{o.player_uid}</td>
                    <td className="p-4 font-bold text-slate-800">{o.product_name}</td>
                    <td className="p-4 font-black text-slate-900">৳ {o.total_amount}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          o.payment_status === "VERIFIED"
                            ? "bg-green-100 text-green-700"
                            : o.payment_status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-700"
                              : o.payment_status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          o.fulfillment_status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : o.fulfillment_status === "PROCESSING"
                              ? "bg-blue-100 text-blue-700"
                              : o.fulfillment_status === "FAILED"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {o.fulfillment_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/payment/${o.public_order_id}`}
                        className="text-purple-600 hover:text-purple-800 font-bold"
                      >
                        Details
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
