"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { OrderAdmin } from "../../../lib/api/types";
import { getAdminOrders, retryAdminOrderFulfillment } from "../../../lib/api/endpoints";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [orderStatus, setOrderStatus] = useState("ALL");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminOrders({
        page,
        pageSize: 20,
        orderStatus,
        fulfillmentStatus,
        search: search.trim() || undefined,
      });
      setOrders(res.items);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to load orders." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [orderStatus, fulfillmentStatus, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleRetry = async (publicOrderId: string) => {
    setRetryingOrderId(publicOrderId);
    setNotification(null);
    try {
      await retryAdminOrderFulfillment(publicOrderId, "Manual retry by admin");
      setNotification({
        type: "success",
        text: `Fulfillment retry triggered for order ${publicOrderId}.`,
      });
      await loadOrders();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to retry fulfillment." });
    } finally {
      setRetryingOrderId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time customer top-up transactions, payment statuses, and provider
            fulfillments
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="uppercase text-[10px] ml-4 font-black"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div>
            <select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PAYMENT_SUBMITTED">Payment Submitted</option>
              <option value="PAYMENT_VERIFIED">Payment Verified</option>
              <option value="PROCESSING">Processing Top-up</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div>
            <select
              value={fulfillmentStatus}
              onChange={(e) => {
                setFulfillmentStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ALL">All Fulfillments</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="QUEUED">Queued</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed (Retryable)</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order ID, UID, Email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Game UID</th>
                <th className="p-4">Package</th>
                <th className="p-4">Total</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Fulfillment</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading
                    orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isRetrying = retryingOrderId === o.public_order_id;
                  const canRetry =
                    o.payment_status === "VERIFIED" && o.fulfillment_status === "FAILED";

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-purple-600">
                        <Link href={`/payment/${o.public_order_id}`} className="hover:underline">
                          {o.public_order_id}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {o.customer_name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {o.customer_email || "guest"}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800">{o.player_uid}</td>
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
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {canRetry && (
                            <button
                              onClick={() => handleRetry(o.public_order_id)}
                              disabled={isRetrying}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded text-[11px] flex items-center gap-1 shadow-sm disabled:opacity-50"
                            >
                              {isRetrying ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <RotateCw size={11} />
                              )}
                              Retry Top-Up
                            </button>
                          )}
                          <Link
                            href={`/payment/${o.public_order_id}`}
                            className="text-purple-600 hover:text-purple-800 font-bold"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 text-slate-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 text-slate-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
