"use client";

import { useState, useEffect } from "react";
import { Sliders, CheckCircle2, Loader2 } from "lucide-react";
import { getAdminSettings, updateAdminSettings } from "../../../lib/api/endpoints";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await getAdminSettings();
        const map: Record<string, string> = {};
        res.forEach((item) => {
          map[item.key] = item.value;
        });
        setSettings(map);
      } catch (err: any) {
        setNotification({ type: "error", text: err.message || "Failed to load settings." });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    try {
      await updateAdminSettings(settings);
      setNotification({ type: "success", text: "Store settings saved successfully!" });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={32} />
        <p className="text-slate-600 text-xs font-medium">Loading store settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Store Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure public announcements, customer support channels, and store identity
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

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Store Brand Title</label>
          <input
            type="text"
            value={settings["site_title"] || ""}
            onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Top Notice Announcement Bar
          </label>
          <textarea
            rows={2}
            value={settings["notice"] || ""}
            onChange={(e) => setSettings({ ...settings, notice: e.target.value })}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Support Phone Helpline
            </label>
            <input
              type="text"
              value={settings["support_phone"] || ""}
              onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Telegram Support Link
            </label>
            <input
              type="text"
              value={settings["support_telegram"] || ""}
              onChange={(e) => setSettings({ ...settings, support_telegram: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
