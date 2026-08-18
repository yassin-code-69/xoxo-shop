"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Plus, Trash2, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import { Banner } from "../../../lib/api/types";
import {
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
} from "../../../lib/api/endpoints";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadBanners = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminBanners();
      setBanners(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load banners.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.title || !editingBanner?.image_url) {
      setNotification({ type: "error", text: "Please enter banner title and image URL." });
      return;
    }

    setIsSaving(true);
    setNotification(null);
    try {
      if (isCreating) {
        await createAdminBanner(editingBanner);
        setNotification({ type: "success", text: "New banner created successfully!" });
      } else if (editingBanner.id) {
        await updateAdminBanner(editingBanner.id, editingBanner);
        setNotification({ type: "success", text: "Banner updated successfully!" });
      }
      setEditingBanner(null);
      setIsCreating(false);
      await loadBanners();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save banner.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promotional banner?")) return;
    try {
      await deleteAdminBanner(id);
      setNotification({ type: "success", text: "Banner removed successfully." });
      await loadBanners();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete banner.";
      setNotification({ type: "error", text: msg });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Promotions & Banners</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage dynamic homepage hero slides, special discounts, and promotional graphics
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingBanner({
              title: "",
              subtitle: "",
              image_url: "",
              link_url: "/uid-topup",
              active: true,
              sort_order: banners.length + 1,
            });
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Hero Banner
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

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="animate-spin inline-block mr-2" size={24} /> Loading banners...
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <ImageIcon size={36} className="mx-auto text-slate-400 mb-2" />
          <h3 className="font-bold text-slate-800 text-base">No Banners Configured</h3>
          <p className="text-xs text-slate-500 mt-1">
            Add banners to display featured offers on the homepage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                <img
                  src={b.image_url}
                  alt={b.title || "Banner"}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    b.active ? "bg-green-600 text-white" : "bg-slate-800/80 text-white"
                  }`}
                >
                  {b.active ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="p-5 flex flex-col gap-2">
                <h3 className="font-black text-base text-slate-900">{b.title}</h3>
                {b.subtitle && <p className="text-xs text-slate-500">{b.subtitle}</p>}
                {b.link_url && (
                  <span className="text-[11px] font-mono text-purple-600">Link: {b.link_url}</span>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingBanner(b);
                  }}
                  className="text-purple-600 hover:text-purple-800 text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {isCreating ? "Add Promotional Banner" : "Edit Banner"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter promotional image URL and call-to-action link
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  value={editingBanner.title || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  placeholder="e.g. Weekly Mega Discount"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  placeholder="e.g. 20% bonus diamonds on first recharge"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Image URL *</label>
                <input
                  type="url"
                  value={editingBanner.image_url || ""}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, image_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Action Link (URL)
                </label>
                <input
                  type="text"
                  value={editingBanner.link_url || "/uid-topup"}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                  placeholder="/uid-topup"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bannerActiveToggle"
                  checked={editingBanner.active ?? true}
                  onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label htmlFor="bannerActiveToggle" className="text-xs font-bold text-slate-800">
                  Active and visible on Homepage
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner(null);
                    setIsCreating(false);
                  }}
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
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
