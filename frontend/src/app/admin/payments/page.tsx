"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { PaymentAdmin } from "../../../lib/api/types";
import {
  getAdminPayments,
  approveAdminPayment,
  rejectAdminPayment,
} from "../../../lib/api/endpoints";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentAdmin[]>([]);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("TrxID not matching statement");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminPayments({
        page,
        pageSize: 20,
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setPayments(res.items);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to load payments." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  const handleApprove = async (paymentId: string) => {
    setIsProcessingId(paymentId);
    setNotification(null);
    try {
      await approveAdminPayment(paymentId);
      setNotification({
        type: "success",
        text: "Payment verified successfully! Automated diamond fulfillment has been dispatched.",
      });
      await loadPayments();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Could not approve payment." });
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectionReason.trim()) return;
    setIsProcessingId(paymentId);
    setNotification(null);
    try {
      await rejectAdminPayment(paymentId, rejectionReason.trim());
      setNotification({ type: "success", text: "Payment rejected successfully." });
      setRejectingId(null);
      await loadPayments();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Could not reject payment." });
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleCopyTrx = (trxId: string) => {
    navigator.clipboard.writeText(trxId);
    setCopiedId(trxId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manual Payment Verification</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submitted Transaction IDs (bKash, Nagad, Rocket) and approve diamond delivery
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh List
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {[
            { label: "Pending Review", value: "SUBMITTED" },
            { label: "Verified", value: "VERIFIED" },
            { label: "Rejected", value: "REJECTED" },
            { label: "All Status", value: "ALL" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab.value
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TrxID, Order ID..."
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

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Transaction ID (TrxID)</th>
                <th className="p-4">Sender No.</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading payment
                    records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    No payment submissions found matching your filter.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isProcessing = isProcessingId === p.id;
                  const isRejecting = rejectingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-purple-600">
                        <Link href={`/payment/${p.public_order_id}`} className="hover:underline">
                          {p.public_order_id || "N/A"}
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">
                          {p.customer_name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.customer_email || "guest"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 text-[10px]">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900 text-sm">৳ {p.amount}</td>
                      <td className="p-4 font-mono font-black text-slate-900">
                        {p.transaction_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 px-2 py-1 rounded text-slate-800 border border-slate-200">
                              {p.transaction_id}
                            </span>
                            <button
                              onClick={() => handleCopyTrx(p.transaction_id!)}
                              className="text-slate-400 hover:text-purple-600 p-1"
                              title="Copy TrxID"
                            >
                              {copiedId === p.transaction_id ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not submitted</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{p.sender_number || "—"}</td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            p.status === "VERIFIED"
                              ? "bg-green-100 text-green-700"
                              : p.status === "SUBMITTED"
                                ? "bg-blue-100 text-blue-700"
                                : p.status === "REJECTED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {p.status === "SUBMITTED" || p.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={isProcessing}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(p.id)}
                              disabled={isProcessing}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : p.status === "VERIFIED" ? (
                          <span className="text-[11px] text-green-600 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 size={14} /> Approved
                          </span>
                        ) : (
                          <span className="text-[11px] text-red-600 font-medium">
                            {p.rejection_reason || "Rejected"}
                          </span>
                        )}
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

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Reject Payment Submission</h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify the reason for rejecting this manual payment. The customer will see this
              message.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white"
                placeholder="e.g. Transaction ID not found in statement"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={isProcessingId === rejectingId || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
