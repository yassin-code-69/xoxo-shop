"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle2,
  Loader2,
  Edit2,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  HelpCircle,
} from "lucide-react";
import { PaymentMethodAdmin } from "../../../lib/api/types";
import { getAdminPaymentMethods, updateAdminPaymentMethod } from "../../../lib/api/endpoints";

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodAdmin | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadMethods = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminPaymentMethods();
      setMethods(res);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to load payment methods." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;
    setIsSaving(true);
    setNotification(null);
    try {
      await updateAdminPaymentMethod(editingMethod.id, {
        name: editingMethod.name,
        type: editingMethod.type,
        account_number: editingMethod.account_number,
        account_type: editingMethod.account_type,
        instructions: editingMethod.instructions,
        active: editingMethod.active,
        metadata_json: editingMethod.metadata_json,
      });
      setNotification({
        type: "success",
        text: `${editingMethod.name} gateway configuration updated successfully!`,
      });
      setEditingMethod(null);
      await loadMethods();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update payment method." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleType = async (method: PaymentMethodAdmin) => {
    const nextType = method.type === "MANUAL" ? "AUTOMATED" : "MANUAL";
    try {
      await updateAdminPaymentMethod(method.id, { type: nextType });
      setNotification({
        type: "success",
        text: `${method.name} switched to ${nextType === "AUTOMATED" ? "Automated PGW Direct Checkout" : "Manual Send Money"}.`,
      });
      await loadMethods();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to switch checkout mode." });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Payment Gateways & Methods
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Configure mobile banking accounts (bKash, Nagad, Rocket), toggle Manual vs Automated PGW
          Checkout, and customize instructions
        </p>
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

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="animate-spin inline-block mr-2" size={24} /> Loading payment
          methods...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {methods.map((m) => {
            const isAuto = m.type === "AUTOMATED" || m.type === "GATEWAY";

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-[#111111] rounded-3xl p-6 border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col justify-between gap-6 relative overflow-hidden"
              >
                {/* Status bar accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    m.active
                      ? isAuto
                        ? "bg-indigo-500"
                        : "bg-purple-600"
                      : "bg-slate-300 dark:bg-zinc-700"
                  }`}
                />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <span className="text-base font-black text-slate-900 dark:text-white block">
                          {m.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {m.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          m.active
                            ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                            : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {m.active ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector Pill */}
                  <div className="mb-4 p-2.5 bg-slate-50 dark:bg-[#171717] rounded-2xl border border-slate-200/70 dark:border-[#262626]">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 dark:text-zinc-300 text-[11px]">
                        Checkout Mode:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleType(m)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase transition-all cursor-pointer ${
                          isAuto
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-purple-600 text-white shadow-xs"
                        }`}
                      >
                        {isAuto ? "Automated (PGW)" : "Manual (Send Money)"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-tight">
                      {isAuto
                        ? "Customers pay via direct PGW popup; orders verified automatically."
                        : "Customers send money manually and submit TrxID for admin review."}
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block mb-1">
                        {isAuto ? "Merchant Number" : "Receiver Account Number"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/60 inline-block">
                          {m.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.account_number, m.id)}
                          className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 p-1"
                          title="Copy Number"
                        >
                          {copiedId === m.id ? (
                            <Check size={14} className="text-green-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-[#1f1f1f]">
                      <span className="text-slate-400 dark:text-zinc-500 font-bold">
                        Account Type
                      </span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                        {m.account_type}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block mb-1">
                        Customer Instructions
                      </span>
                      <p className="text-slate-600 dark:text-zinc-400 line-clamp-3 text-[11px] leading-relaxed bg-slate-50/60 dark:bg-zinc-900/40 p-2 rounded-xl border border-slate-100 dark:border-[#222]">
                        {m.instructions || "No instructions specified."}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingMethod(m)}
                  className="w-full bg-slate-50 dark:bg-[#171717] hover:bg-slate-100 dark:hover:bg-[#222222] text-slate-800 dark:text-zinc-200 font-bold py-2.5 rounded-xl text-xs transition-colors border border-slate-200/80 dark:border-[#262626] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 size={13} /> Configure Gateway Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingMethod && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              Edit {editingMethod.name} Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              Update receiver numbers, automated PGW mode, and customer instructions
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Checkout Mode *
                  </label>
                  <select
                    value={editingMethod.type || "MANUAL"}
                    onChange={(e) => setEditingMethod({ ...editingMethod, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                  >
                    <option value="MANUAL">
                      MANUAL — Personal / Merchant Send Money (Customer submits TrxID)
                    </option>
                    <option value="AUTOMATED">
                      AUTOMATED — PGW Direct Checkout (Automatic Verification)
                    </option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Receiver Account / Merchant Number *
                  </label>
                  <input
                    type="text"
                    value={editingMethod.account_number}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, account_number: e.target.value })
                    }
                    className="w-full px-3 py-2.5 text-xs font-mono font-bold bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={editingMethod.account_type}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, account_type: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={editingMethod.sort_order || 0}
                    onChange={(e) =>
                      setEditingMethod({
                        ...editingMethod,
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Step-by-Step Payment Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={editingMethod.instructions}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, instructions: e.target.value })
                    }
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={editingMethod.active}
                  onChange={(e) => setEditingMethod({ ...editingMethod, active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="activeToggle"
                  className="text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  Active & Enabled in Checkout
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
