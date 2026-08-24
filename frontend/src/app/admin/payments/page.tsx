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
  Eye,
  FileImage,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Download,
} from "lucide-react";
import { PaymentAdmin } from "../../../lib/api/types";
import {
  getAdminPayments,
  approveAdminPayment,
  rejectAdminPayment,
} from "../../../lib/api/endpoints";
import { exportToCsv } from "../../../lib/utils/csv";
import { useDebounce } from "../../../lib/hooks/useDebounce";

const REJECTION_PRESETS = [
  "TrxID not matching bank/mobile banking statement",
  "Incorrect payment amount received",
  "Transaction ID already used in another order",
  "Sender number does not match record",
  "Fake or altered transaction submission",
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentAdmin[]>([]);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_PRESETS[0]);
  const [viewingPayment, setViewingPayment] = useState<PaymentAdmin | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminPayments({
        page,
        pageSize: 20,
        status: statusFilter === "GATEWAY" ? "ALL" : statusFilter,
        method: methodFilter !== "ALL" ? methodFilter : undefined,
        search: debouncedSearch.trim() || undefined,
      });

      let items = res.items;
      if (statusFilter === "GATEWAY") {
        items = items.filter((p) => p.payment_type === "GATEWAY" || p.payment_type === "AUTOMATED");
      }
      setPayments(items);
      setTotalPages(res.total_pages || 1);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to load payments." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    const columns = [
      { key: "payment_id", label: "Payment ID" },
      { key: "method", label: "Method" },
      { key: "gateway", label: "Gateway" },
      { key: "amount", label: "Amount" },
      { key: "trx_id", label: "Trx ID" },
      { key: "sender_number", label: "Sender Number" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ];

    const rows = payments.map((p) => ({
      payment_id: p.id,
      method: p.payment_method,
      gateway: p.payment_type,
      amount: `৳ ${p.amount}`,
      trx_id: p.transaction_id || "N/A",
      sender_number: p.sender_number || "N/A",
      status: p.status,
      date: new Date(p.created_at).toLocaleDateString(),
    }));

    exportToCsv("payments-export.csv", columns, rows);
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter, methodFilter, page, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  const handleApprove = async (paymentId: string) => {
    setIsProcessingId(paymentId);
    setNotification(null);
    try {
      await approveAdminPayment(paymentId, "Approved via Admin Console");
      setNotification({
        type: "success",
        text: "Payment verified successfully! Automated diamond fulfillment has been dispatched to provider.",
      });
      if (viewingPayment?.id === paymentId) {
        setViewingPayment(null);
      }
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
      if (viewingPayment?.id === paymentId) {
        setViewingPayment(null);
      }
      await loadPayments();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Could not reject payment." });
    } finally {
      setIsProcessingId(null);
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Payments & Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Review customer Transaction IDs (TrxID), approve manual payments to trigger automated
            fulfillment, and audit gateway settlements
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || payments.length === 0}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Export current payments to CSV"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            type="button"
            onClick={loadPayments}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh List
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

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {[
            { label: "Pending Review", value: "SUBMITTED" },
            { label: "Verified", value: "VERIFIED" },
            { label: "Rejected", value: "REJECTED" },
            { label: "Gateway Direct", value: "GATEWAY" },
            { label: "All Payments", value: "ALL" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-[#171717] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-[#222222]"
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search TrxID, Order ID, Phone..."
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

      {/* Payments Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#171717] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-[#1f1f1f]">
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
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 dark:text-zinc-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading payment
                    records...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-12 text-center text-slate-400 dark:text-zinc-500 font-medium"
                  >
                    No payment submissions found matching your filter.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isProcessing = isProcessingId === p.id;
                  const isSubmitted = p.status === "SUBMITTED" || p.status === "PENDING";

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                        <Link
                          href={`/payment/${p.public_order_id}`}
                          className="hover:underline flex items-center gap-1"
                        >
                          {p.public_order_id || "N/A"}
                          <ExternalLink size={11} className="opacity-60" />
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-white">
                          {p.customer_name || "Customer"}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500">
                          {p.customer_email || "guest"}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold uppercase text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/60 text-[10px]">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900 dark:text-white text-sm">
                        ৳ {p.amount}
                      </td>
                      <td className="p-4 font-mono font-black text-slate-900 dark:text-white">
                        {p.transaction_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-mono text-[11px]">
                              {p.transaction_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.transaction_id!, p.id + "-trx")}
                              className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 cursor-pointer"
                              title="Copy TrxID"
                            >
                              {copiedId === p.id + "-trx" ? (
                                <Check size={13} className="text-green-600" />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 italic text-[11px]">
                            Auto Gateway Direct
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-zinc-400 font-medium font-mono text-[11px]">
                        {p.sender_number ? (
                          <div className="flex items-center gap-1">
                            <span>{p.sender_number}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(p.sender_number!, p.id + "-phone")}
                              className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-0.5 cursor-pointer"
                              title="Copy Sender Number"
                            >
                              {copiedId === p.id + "-phone" ? (
                                <Check size={11} className="text-green-600" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            p.status === "VERIFIED"
                              ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                              : p.status === "SUBMITTED"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : p.status === "REJECTED"
                                  ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingPayment(p)}
                            className="text-slate-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 p-1 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            title="View Full Details"
                          >
                            <Eye size={14} />
                          </button>

                          {isSubmitted ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(p.id)}
                                disabled={isProcessing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <CheckCircle2 size={13} />
                                )}
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectingId(p.id)}
                                disabled={isProcessing}
                                className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50 cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : p.status === "VERIFIED" ? (
                            <span className="text-[11px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={13} /> Approved
                            </span>
                          ) : (
                            <span className="text-[11px] text-red-600 dark:text-red-400 font-medium truncate max-w-[120px]">
                              {p.rejection_reason || "Rejected"}
                            </span>
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

      {/* Full Payment Inspector Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1f1f1f] mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Payment Transaction Details
                </h3>
                <p className="text-xs text-slate-400 font-mono">ID: {viewingPayment.id}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  viewingPayment.status === "VERIFIED"
                    ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                    : viewingPayment.status === "SUBMITTED"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                      : viewingPayment.status === "REJECTED"
                        ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {viewingPayment.status}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-[#171717] p-3.5 rounded-2xl border border-slate-200/70 dark:border-[#262626]">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Order ID</span>
                  <Link
                    href={`/payment/${viewingPayment.public_order_id}`}
                    className="font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {viewingPayment.public_order_id || "N/A"}
                  </Link>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Amount</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">
                    ৳ {viewingPayment.amount} {viewingPayment.currency}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Method</span>
                  <span className="font-bold uppercase text-purple-700 dark:text-purple-300">
                    {viewingPayment.payment_method} ({viewingPayment.payment_type})
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Sender Number</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                    {viewingPayment.sender_number || "—"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1">Transaction ID (TrxID)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm bg-slate-100 dark:bg-zinc-800 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white flex-1">
                    {viewingPayment.transaction_id || "None submitted"}
                  </span>
                  {viewingPayment.transaction_id && (
                    <button
                      type="button"
                      onClick={() => handleCopy(viewingPayment.transaction_id!, "modal-trx")}
                      className="p-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl hover:bg-slate-200 transition-colors"
                      title="Copy TrxID"
                    >
                      {copiedId === "modal-trx" ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {viewingPayment.customer_email && (
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Customer Account</span>
                  <p className="text-slate-800 dark:text-zinc-200 font-medium">
                    {viewingPayment.customer_name} ({viewingPayment.customer_email})
                  </p>
                </div>
              )}

              {viewingPayment.rejection_reason && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                  <strong className="block font-bold mb-0.5">Rejection Reason:</strong>
                  <span>{viewingPayment.rejection_reason}</span>
                </div>
              )}

              {viewingPayment.proof_path && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">
                    Attached Payment Proof
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewProofUrl(viewingPayment.proof_path!)}
                    className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-200 dark:border-purple-800 font-bold hover:bg-purple-100 transition-all cursor-pointer"
                  >
                    <FileImage size={16} /> View Screenshot Proof
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-[#1f1f1f] mt-5">
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
              >
                Close
              </button>

              {(viewingPayment.status === "SUBMITTED" || viewingPayment.status === "PENDING") && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const id = viewingPayment.id;
                      setViewingPayment(null);
                      setRejectingId(id);
                    }}
                    className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(viewingPayment.id)}
                    disabled={isProcessingId === viewingPayment.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Approve & Dispatch
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal with Presets */}
      {rejectingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              Reject Payment Submission
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
              Select or type a reason for rejecting this manual payment. The customer will see this
              message.
            </p>

            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300">
                Quick Preset Reasons:
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all border cursor-pointer ${
                      rejectionReason === preset
                        ? "bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 font-bold"
                        : "bg-slate-50 dark:bg-[#171717] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Custom Rejection Message:
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Explain why payment is rejected..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                disabled={isProcessingId === rejectingId || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Lightbox */}
      {previewProofUrl && (
        <div
          onClick={() => setPreviewProofUrl(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2">
            <img
              src={previewProofUrl}
              alt="Proof Attachment"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
