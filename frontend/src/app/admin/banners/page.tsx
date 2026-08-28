"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import { Banner } from "../../../lib/api/types";
import {
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
} from "../../../lib/api/endpoints";
import { ImageUpload } from "../../../components/ImageUpload";

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
      setNotification({ type: "error", text: "Please enter banner title and upload an image." });
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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Promotions & Banners
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage dynamic homepage hero slides, special discounts, and promotional graphics
          </p>
        </div>

        <button
          onClick={() => {
            setEditingBanner({
              title: "",
              subtitle: "",
              image_url: "",
              link_url: "/uid-topup",
              active: true,
              sort_order: (banners.length || 0) + 1,
            });
            setIsCreating(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Add New Banner
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold border transition-all ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          {notification.text}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-purple-600" size={32} />
          <p className="text-xs text-slate-500 font-bold">Loading promotional banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] border border-slate-200/80 dark:border-[#222222] rounded-3xl p-12 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            No promotional banners active yet.
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            Create your first hero promotional slider to display on the storefront homepage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-[#111111] rounded-3xl border border-slate-200/80 dark:border-[#222222] overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div className="relative h-48 w-full bg-slate-100 dark:bg-[#171717] overflow-hidden">
                <img
                  src={b.image_url}
                  alt={b.title || "Banner"}
                  referrerPolicy="no-referrer"
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
                <h3 className="font-black text-base text-slate-900 dark:text-white">{b.title}</h3>
                {b.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{b.subtitle}</p>
                )}
                {b.link_url && (
                  <span className="text-[11px] font-mono text-purple-600 dark:text-purple-400">
                    Link: {b.link_url}
                  </span>
                )}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-[#171717] border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingBanner(b);
                  }}
                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              {isCreating ? "Add Promotional Banner" : "Edit Banner"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              Upload promotional banner image directly to ImgBB and set action link
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  value={editingBanner.title || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  placeholder="e.g. Weekly Mega Discount"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ""}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  placeholder="e.g. 20% bonus diamonds on first recharge"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* ImgBB Direct Image Upload Component */}
              <ImageUpload
                value={editingBanner.image_url || ""}
                onChange={(url) => setEditingBanner({ ...editingBanner, image_url: url })}
                label="Banner Image *"
                hint="Click to upload image directly to ImgBB"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Action Link (URL)
                </label>
                <input
                  type="text"
                  value={editingBanner.link_url || "/uid-topup"}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                  placeholder="/uid-topup"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bannerActiveToggle"
                  checked={editingBanner.active ?? true}
                  onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="bannerActiveToggle"
                  className="text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  Active and visible on Homepage
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editingBanner.image_url}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
