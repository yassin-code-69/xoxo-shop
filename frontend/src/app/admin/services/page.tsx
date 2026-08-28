"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, CheckCircle2, Loader2, Trophy, Eye, EyeOff, ExternalLink } from "lucide-react";
import { ImageUpload } from "../../../components/ImageUpload";

export interface HomepageService {
  id: string;
  name: string;
  src: string;
  href: string;
  tag?: string;
  active: boolean;
  sort_order: number;
}

export default function AdminHomepageServicesPage() {
  const [services, setServices] = useState<HomepageService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<Partial<HomepageService> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/homepage-services", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      setServices(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load services.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleToggleActive = async (service: HomepageService) => {
    const updated = { ...service, active: !service.active };
    try {
      const res = await fetch("/api/homepage-services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      setServices(services.map((s) => (s.id === service.id ? updated : s)));
      setNotification({
        type: "success",
        text: `"${service.name}" is now ${updated.active ? "Visible on Homepage" : "Hidden from Homepage"}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle status.";
      setNotification({ type: "error", text: msg });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.name || !editingService?.src) {
      setNotification({ type: "error", text: "Please provide service name and image." });
      return;
    }

    setIsSaving(true);
    setNotification(null);
    try {
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch("/api/homepage-services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });

      if (!res.ok) throw new Error("Failed to save service");
      setNotification({
        type: "success",
        text: isCreating
          ? "New Homepage Service added successfully!"
          : "Service card updated successfully!",
      });

      setEditingService(null);
      setIsCreating(false);
      await loadServices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save service.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service card?")) return;
    try {
      const res = await fetch(`/api/homepage-services?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete service");
      setNotification({ type: "success", text: "Service card deleted." });
      await loadServices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete service.";
      setNotification({ type: "error", text: msg });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="text-purple-600 dark:text-purple-400" /> Diamond Packages & Services
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage the category service cards on the homepage (toggle display ON/OFF, change graphics via ImgBB, edit tags & links)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingService({
              id: `service-${Date.now()}`,
              name: "",
              src: "",
              href: "/uid-topup",
              tag: "",
              active: true,
              sort_order: (services.length || 0) + 1,
            });
            setIsCreating(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Add New Service Card
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
          <p className="text-xs text-slate-500 font-bold">Loading homepage service cards...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] border border-slate-200/80 dark:border-[#222222] rounded-3xl p-12 text-center flex flex-col items-center gap-3">
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            No service cards configured yet.
          </p>
          <p className="text-xs text-slate-400 max-w-sm">
            Add your first category card to show up on the homepage grid.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {services.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-[#111111] rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden relative ${
                item.active
                  ? "border-slate-200/90 dark:border-[#262626]"
                  : "border-dashed border-slate-300 dark:border-zinc-800 opacity-60"
              }`}
            >
              {/* Badge Tag */}
              {item.tag && (
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md z-10 shadow-xs">
                  {item.tag}
                </div>
              )}

              {/* Status Indicator */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item)}
                  title={item.active ? "Click to Hide from Homepage" : "Click to Show on Homepage"}
                  className={`p-1.5 rounded-full shadow-md text-white transition-transform hover:scale-110 cursor-pointer ${
                    item.active ? "bg-emerald-600 hover:bg-emerald-700" : "bg-zinc-600 hover:bg-zinc-700"
                  }`}
                >
                  {item.active ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>

              {/* Image Preview */}
              <div className="w-full aspect-square bg-slate-100 dark:bg-[#171717] overflow-hidden relative">
                <img
                  src={item.src}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="p-3 flex flex-col gap-1 text-center">
                <h3 className="font-black text-xs text-slate-900 dark:text-white truncate">
                  {item.name}
                </h3>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono truncate">
                  {item.href}
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                    item.active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                  }`}
                >
                  {item.active ? "● Visible" : "○ Hidden"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="p-2.5 bg-slate-50 dark:bg-[#171717] border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingService(item);
                  }}
                  className="text-purple-600 hover:text-purple-800 dark:text-purple-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              {isCreating ? "Add Service Card" : "Edit Service Card"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
              Update card image via ImgBB, title, action link, and display status
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Card Name *
                </label>
                <input
                  type="text"
                  value={editingService.name || ""}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  placeholder="e.g. UID TOPUP (BD)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Badge Tag (Optional)
                </label>
                <input
                  type="text"
                  value={editingService.tag || ""}
                  onChange={(e) => setEditingService({ ...editingService, tag: e.target.value })}
                  placeholder="e.g. INSTANT, BEST VALUE, REWARD (or leave empty)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* ImgBB Image Upload */}
              <ImageUpload
                value={editingService.src || ""}
                onChange={(url) => setEditingService({ ...editingService, src: url })}
                label="Card Graphic / Image *"
                hint="Upload HD square graphic directly to ImgBB"
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Target Route / Link URL *
                </label>
                <input
                  type="text"
                  value={editingService.href || ""}
                  onChange={(e) => setEditingService({ ...editingService, href: e.target.value })}
                  placeholder="e.g. /uid-topup or /weekly-monthly"
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={editingService.sort_order ?? 1}
                  onChange={(e) =>
                    setEditingService({ ...editingService, sort_order: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="serviceActiveToggle"
                  checked={editingService.active ?? true}
                  onChange={(e) => setEditingService({ ...editingService, active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="serviceActiveToggle"
                  className="text-xs font-bold text-slate-800 dark:text-zinc-200 cursor-pointer"
                >
                  Active & Display on Storefront Homepage
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingService(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !editingService.src}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
