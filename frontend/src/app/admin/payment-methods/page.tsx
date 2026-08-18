"use client";

import { useState, useEffect } from "react";
import { Zap, CheckCircle2, Loader2, Edit2 } from "lucide-react";
import { PaymentMethodAdmin } from "../../../lib/api/types";
import { getAdminPaymentMethods, updateAdminPaymentMethod } from "../../../lib/api/endpoints";

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethodAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodAdmin | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
        account_number: editingMethod.account_number,
        account_type: editingMethod.account_type,
        instructions: editingMethod.instructions,
        active: editingMethod.active,
      });
      setNotification({
        type: "success",
        text: `${editingMethod.name} settings updated successfully!`,
      });
      setEditingMethod(null);
      await loadMethods();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to update payment method." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payment Methods Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage receiver mobile banking numbers (bKash, Nagad, Rocket) and customer payment
          instructions
        </p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methods.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between gap-6"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-black text-slate-900">{m.name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    m.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {m.active ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Receiver Number</span>
                  <span className="font-mono font-black text-base text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 inline-block">
                    {m.account_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Account Type</span>
                  <span className="font-bold text-slate-800">{m.account_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">Instructions</span>
                  <p className="text-slate-600 line-clamp-3 text-[11px] leading-relaxed">
                    {m.instructions}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditingMethod(m)}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Edit2 size={13} /> Edit Account Details
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingMethod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Edit {editingMethod.name} Configuration
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Update receiver account number and step-by-step instructions
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Receiver Account Number *
                </label>
                <input
                  type="text"
                  value={editingMethod.account_number}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, account_number: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                <select
                  value={editingMethod.account_type}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, account_type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="Personal">Personal</option>
                  <option value="Merchant">Merchant</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instructions for Customers
                </label>
                <textarea
                  rows={4}
                  value={editingMethod.instructions}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, instructions: e.target.value })
                  }
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={editingMethod.active}
                  onChange={(e) => setEditingMethod({ ...editingMethod, active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label htmlFor="activeToggle" className="text-xs font-bold text-slate-800">
                  Enable this payment method for checkout
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
