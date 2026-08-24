"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  MessageSquare,
  Clock,
  Send,
  X,
  ExternalLink,
  Check,
  Download,
} from "lucide-react";
import { ContactMessage } from "../../../lib/api/types";
import {
  getAdminContactMessages,
  updateAdminContactMessage,
  deleteAdminContactMessage,
} from "../../../lib/api/endpoints";
import { exportToCsv } from "../../../lib/utils/csv";
import { useDebounce } from "../../../lib/hooks/useDebounce";

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyNotes, setReplyNotes] = useState("");
  const [modalStatus, setModalStatus] = useState("UNREAD");
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const loadMessages = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await getAdminContactMessages({
        page,
        pageSize: 20,
        status: statusFilter,
        search: debouncedSearch.trim() || undefined,
      });
      setMessages(res.items);
      setTotalPages(res.total_pages || 1);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to load contact messages.",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleExportCsv = () => {
    const columns = [
      { key: "name", label: "Sender Name" },
      { key: "email", label: "Email" },
      { key: "order_id", label: "Order ID" },
      { key: "message", label: "Message" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ];

    const rows = messages.map((m) => ({
      name: m.name,
      email: m.email,
      order_id: m.order_id || "N/A",
      message: m.message,
      status: m.status,
      date: new Date(m.created_at).toISOString(),
    }));

    exportToCsv(`messages_export_${new Date().toISOString().slice(0, 10)}`, columns, rows);
  };

  useEffect(() => {
    loadMessages(true);
  }, [page, statusFilter, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadMessages(true);
  };

  const handleOpenModal = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setReplyNotes(msg.reply_notes || "");
    setModalStatus(msg.status);
    // If it was unread, automatically mark as READ on viewing
    if (msg.status === "UNREAD") {
      updateAdminContactMessage(msg.id, { status: "READ" })
        .then((updated) => {
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
        })
        .catch(() => {});
    }
  };

  const handleSaveModal = async () => {
    if (!selectedMessage) return;
    setIsUpdating(true);
    try {
      const updated = await updateAdminContactMessage(selectedMessage.id, {
        status: modalStatus,
        reply_notes: replyNotes.trim() || undefined,
      });
      setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? updated : m)));
      setSelectedMessage(null);
      setNotification({ type: "success", text: "Message updated successfully." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update message." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this inquiry message?")) {
      return;
    }
    try {
      await deleteAdminContactMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
      setNotification({ type: "success", text: "Message deleted permanently." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete message." });
    }
  };

  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;
  const repliedCount = messages.filter((m) => m.status === "REPLIED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="text-purple-600 dark:text-purple-400" />
            Support Inquiries & Contact Messages
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, respond to, and track incoming customer contact messages and support inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || messages.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
            title="Export current messages to CSV"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadMessages(false);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-purple-600" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Mail size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Inquiries
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-white">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Unread Messages
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {unreadCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Replied / Resolved
            </span>
            <span className="text-2xl font-black text-green-600 dark:text-green-400">
              {repliedCount}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
          {["ALL", "UNREAD", "READ", "REPLIED", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search sender, email, order ID..."
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-purple-500 transition-all text-slate-800 dark:text-white w-64"
            />
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Messages Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Sender</th>
                <th className="p-4">Related Order</th>
                <th className="p-4">Message Snippet</th>
                <th className="p-4">Status</th>
                <th className="p-4">Received</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto text-purple-600 mb-2" size={24} />
                    Loading inquiry messages...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No messages found matching your criteria.
                  </td>
                </tr>
              ) : (
                messages.map((msg) => {
                  return (
                    <tr
                      key={msg.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{msg.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{msg.email}</div>
                      </td>
                      <td className="p-4">
                        {msg.order_id ? (
                          <Link
                            href={`/payment/${msg.order_id}`}
                            className="inline-flex items-center gap-1 font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            <span>{msg.order_id}</span>
                            <ExternalLink size={11} />
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-700 dark:text-slate-300">
                          {msg.message}
                        </p>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            msg.status === "UNREAD"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              : msg.status === "READ"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                                : msg.status === "REPLIED"
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString()}{" "}
                        <span className="text-[10px] block text-slate-400">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(msg)}
                            className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition-colors font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} /> View & Reply
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Delete Message"
                          >
                            <Trash2 size={14} />
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-500 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* View & Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-black uppercase text-purple-600 tracking-wider">
                  Inquiry Details
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedMessage.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sender Info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-bold">Email Address:</span>
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="text-purple-600 font-bold hover:underline"
                >
                  {selectedMessage.email}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Related Order ID:</span>
                {selectedMessage.order_id ? (
                  <Link
                    href={`/payment/${selectedMessage.order_id}`}
                    className="font-mono font-bold text-purple-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{selectedMessage.order_id}</span>
                    <ExternalLink size={10} />
                  </Link>
                ) : (
                  <span className="text-slate-500 italic">None</span>
                )}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Customer Message:
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </div>
            </div>

            {/* Admin Response & Status Edit */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Update Status:
                </label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-500 text-slate-800 dark:text-white"
                >
                  <option value="UNREAD">UNREAD</option>
                  <option value="READ">READ</option>
                  <option value="REPLIED">REPLIED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Internal Notes / Resolution Log:
                </label>
                <textarea
                  rows={3}
                  value={replyNotes}
                  onChange={(e) => setReplyNotes(e.target.value)}
                  placeholder="Notes about action taken or reply sent to the customer..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-purple-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <a
                href={`mailto:${selectedMessage.email}?subject=Regarding your XoXo Shop Inquiry&body=Hi ${selectedMessage.name},%0D%0A%0D%0A`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
              >
                <Send size={13} /> Email Customer
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleSaveModal}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isUpdating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
