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
  Eye,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Server,
  CreditCard,
  User,
  History,
  ShieldAlert,
  Download,
} from "lucide-react";
import { OrderAdmin } from "../../../lib/api/types";
import {
  getAdminOrders,
  retryAdminOrderFulfillment,
  cancelAdminOrder,
} from "../../../lib/api/endpoints";
import { useDebounce } from "../../../lib/hooks/useDebounce";
import { exportToCsv } from "../../../lib/utils/csv";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [orderStatus, setOrderStatus] = useState("ALL");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<OrderAdmin | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminOrders({
        page,
        pageSize: 20,
        orderStatus,
        fulfillmentStatus,
        search: debouncedSearch.trim() || undefined,
      });
      setOrders(res.items);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to load orders." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    const columns = [
      { key: "order_id", label: "Order ID" },
      { key: "customer", label: "Customer" },
      { key: "diamond_pack", label: "Diamond Pack" },
      { key: "uid", label: "UID" },
      { key: "total_amount", label: "Total Amount" },
      { key: "order_status", label: "Order Status" },
      { key: "payment_status", label: "Payment Status" },
      { key: "date", label: "Date" },
    ];

    const rows = orders.map((o) => ({
      order_id: o.public_order_id,
      customer: o.customer_name || o.customer_email || "Guest",
      diamond_pack: o.product_name,
      uid: o.player_uid,
      total_amount: `৳ ${o.total_amount}`,
      order_status: o.order_status,
      payment_status: o.payment_status,
      date: new Date(o.created_at).toISOString(),
    }));

    exportToCsv(`orders_export_${new Date().toISOString().slice(0, 10)}`, columns, rows);
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
      await retryAdminOrderFulfillment(publicOrderId, "Manual retry by administrator");
      setNotification({
        type: "success",
        text: `Fulfillment retry triggered for order ${publicOrderId}.`,
      });
      await loadOrders();
      if (viewingOrder?.public_order_id === publicOrderId) {
        setViewingOrder(null);
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to retry fulfillment." });
    } finally {
      setRetryingOrderId(null);
    }
  };

  const handleCancel = async (publicOrderId: string) => {
    if (!confirm(`Are you sure you want to cancel Order #${publicOrderId}?`)) return;
    setCancellingOrderId(publicOrderId);
    setNotification(null);
    try {
      await cancelAdminOrder(publicOrderId);
      setNotification({
        type: "success",
        text: `Order ${publicOrderId} has been cancelled successfully.`,
      });
      await loadOrders();
      if (viewingOrder?.public_order_id === publicOrderId) {
        setViewingOrder(null);
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to cancel order." });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Orders Management</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Monitor real-time customer top-up transactions, payment statuses, and Free Fire API
            provider fulfillments
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || orders.length === 0}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Export current orders to CSV"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            type="button"
            onClick={loadOrders}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
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

      {/* Filters */}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div>
            <select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setPage(1);
              }}
              className="text-xs font-bold bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="PAYMENT_SUBMITTED">Payment Submitted</option>
              <option value="PAYMENT_VERIFIED">Payment Verified</option>
              <option value="PROCESSING">Processing Top-up</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
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
              className="text-xs font-bold bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Order ID, UID, Email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-800 dark:bg-zinc-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#171717] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-[#1f1f1f]">
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
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-zinc-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading
                    orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-slate-400 dark:text-zinc-500 font-medium"
                  >
                    No orders found matching your filters.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const isRetrying = retryingOrderId === o.public_order_id;
                  const isCancelling = cancellingOrderId === o.public_order_id;
                  const canRetry =
                    o.payment_status === "VERIFIED" && o.fulfillment_status === "FAILED";

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                        <Link
                          href={`/payment/${o.public_order_id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {o.public_order_id}
                          <ExternalLink size={11} className="opacity-60" />
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white">
                          {o.customer_name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {o.customer_email || "guest"}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-zinc-200">
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
                      <td className="p-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap text-[11px]">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {canRetry && (
                            <button
                              type="button"
                              onClick={() => handleRetry(o.public_order_id)}
                              disabled={isRetrying}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              {isRetrying ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <RotateCw size={11} />
                              )}
                              Retry
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingOrder(o)}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 font-bold p-1 flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Eye size={13} /> Inspect
                          </button>
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
          <div className="p-4 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-500 dark:text-zinc-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Comprehensive Order Detail & Provider Log Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1f1f1f] mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Order #{viewingOrder.public_order_id}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy(viewingOrder.public_order_id, "modal-order-id")}
                    className="text-slate-400 hover:text-purple-600 p-0.5"
                    title="Copy Order ID"
                  >
                    {copiedId === "modal-order-id" ? (
                      <Check size={13} className="text-green-600" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Placed on {new Date(viewingOrder.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    viewingOrder.order_status === "COMPLETED"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                      : viewingOrder.order_status === "CANCELLED"
                        ? "bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
                        : viewingOrder.order_status === "FAILED"
                          ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                  }`}
                >
                  {viewingOrder.order_status}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Section 1: Player & Product Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-[#262626] space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <User size={14} className="text-purple-600" /> Player & Account Info
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Player UID:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          {viewingOrder.player_uid}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(viewingOrder.player_uid, "uid-copy")}
                          className="text-slate-400 hover:text-purple-600 p-0.5"
                          title="Copy UID"
                        >
                          {copiedId === "uid-copy" ? (
                            <Check size={12} className="text-green-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                    {viewingOrder.player_server && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Server:</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">
                          {viewingOrder.player_server}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Customer:</span>
                      <span className="font-medium text-slate-800 dark:text-zinc-200">
                        {viewingOrder.customer_name || viewingOrder.customer_email || "Guest"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#171717] border border-slate-200/70 dark:border-[#262626] space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-indigo-600" /> Product Snapshot
                  </h4>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Package:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {viewingOrder.product_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Diamonds:</span>
                      <span className="font-black text-purple-600 dark:text-purple-400">
                        {viewingOrder.diamond_amount} 💎
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Provider SKU:</span>
                      <span className="font-mono text-[10px] bg-slate-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                        {viewingOrder.product_sku || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Price:</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        ৳ {viewingOrder.total_amount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Payment & Fulfillment Overview */}
              <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2.5">
                <h4 className="font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-purple-600" /> Payment & Verification
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Method</span>
                    <strong className="text-slate-800 dark:text-zinc-200 uppercase">
                      {viewingOrder.payment_method_code}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Payment Status</span>
                    <strong className="text-purple-700 dark:text-purple-300">
                      {viewingOrder.payment_status}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">TrxID</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {viewingOrder.payment_transaction_id || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sender Phone</span>
                    <span className="font-mono text-slate-800 dark:text-zinc-200">
                      {viewingOrder.payment_sender_number || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Provider API Response Logs */}
              {viewingOrder.provider_order && (
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2 font-mono text-[11px]">
                  <h4 className="font-bold text-purple-300 flex items-center gap-1.5 font-sans">
                    <Server size={14} className="text-purple-400" /> Provider Fulfillment Engine
                    Logs
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400">Provider:</span>{" "}
                      <span className="text-white">{viewingOrder.provider_order.provider}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status:</span>{" "}
                      <span className="text-yellow-400 font-bold">
                        {viewingOrder.provider_order.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Attempts:</span>{" "}
                      <span className="text-white">
                        {viewingOrder.provider_order.attempt_count}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Provider Ref:</span>{" "}
                      <span className="text-purple-300">
                        {viewingOrder.provider_order.provider_order_id || "N/A"}
                      </span>
                    </div>
                  </div>
                  {viewingOrder.provider_order.last_error_message && (
                    <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-[10px] mt-2">
                      <strong className="block">Last Error:</strong>
                      <span>{viewingOrder.provider_order.last_error_message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Section 4: Status History Audit Timeline */}
              {viewingOrder.status_history && viewingOrder.status_history.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <History size={14} className="text-purple-600" /> Status Audit Trail
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {viewingOrder.status_history.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#171717] border border-slate-200/60 dark:border-[#262626] text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-purple-700 dark:text-purple-300">
                            {h.new_status}
                          </span>
                          {h.reason && (
                            <span className="text-slate-500 dark:text-zinc-400 block text-[10px]">
                              {h.reason}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(h.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-[#1f1f1f] mt-5">
              <div>
                {viewingOrder.order_status !== "CANCELLED" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(viewingOrder.public_order_id)}
                    disabled={cancellingOrderId === viewingOrder.public_order_id}
                    className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold px-3.5 py-2 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <XCircle size={13} /> Cancel Order
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Close
                </button>

                {viewingOrder.payment_status === "VERIFIED" &&
                  viewingOrder.fulfillment_status === "FAILED" && (
                    <button
                      type="button"
                      onClick={() => handleRetry(viewingOrder.public_order_id)}
                      disabled={retryingOrderId === viewingOrder.public_order_id}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCw size={13} /> Retry Top-Up Delivery
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
