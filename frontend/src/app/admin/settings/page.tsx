"use client";

import { useState, useEffect } from "react";
import { FaFacebook, FaInstagram, FaYoutube, FaTelegram } from "react-icons/fa";
import { Share2, Headphones, Smartphone } from "lucide-react";
import {
  Sliders,
  CheckCircle2,
  Loader2,
  Zap,
  Bot,
  Key,
  Globe,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  testExternalDiamondApi,
  syncExternalDiamondProducts,
} from "../../../lib/api/endpoints";
import { TestExternalApiResponse } from "../../../lib/api/types";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "diamond_api" | "pgw" | "gemini">(
    "general",
  );
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // External API Testing State
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPgwKeys, setShowPgwKeys] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState<TestExternalApiResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load settings.";
        setNotification({ type: "error", text: msg });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    try {
      await updateAdminSettings(settings);
      setNotification({ type: "success", text: "Store settings saved and updated successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const url = settings["diamond_api_url"] || "";
    const key = settings["diamond_api_key"] || "";
    if (!url.trim()) {
      setNotification({ type: "error", text: "Please enter an External Diamond API URL to test." });
      return;
    }

    setIsTestingApi(true);
    setTestResult(null);
    try {
      const res = await testExternalDiamondApi(url, key);
      setTestResult(res);
      if (res.success) {
        setNotification({
          type: "success",
          text: `Connection verified! Found ${res.packages_found} diamond packages.`,
        });
      } else {
        setNotification({
          type: "error",
          text: res.message || "External API test failed.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection test failed.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSyncProducts = async () => {
    const url = settings["diamond_api_url"] || "";
    const key = settings["diamond_api_key"] || "";

    setIsSyncing(true);
    try {
      const res = await syncExternalDiamondProducts(url, key);
      if (res.success) {
        setNotification({
          type: "success",
          text: res.message || "Successfully synced products to store catalog!",
        });
      } else {
        setNotification({
          type: "error",
          text: res.message || "Failed to sync products.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync failed.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={32} />
        <p className="text-slate-600 dark:text-zinc-400 text-xs font-medium">
          Loading store settings...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Store Settings & Integrations
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
          Manage store identity, payment gateway credentials, diamond top-up provider, and Gemini AI
          chatbot
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#222222] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "general"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#171717]"
          }`}
        >
          <Sliders size={15} /> General Store Info
        </button>

        <button
          onClick={() => setActiveTab("diamond_api")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "diamond_api"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#171717]"
          }`}
        >
          <Zap size={15} /> Diamond Top-up API
        </button>

        <button
          onClick={() => setActiveTab("pgw")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "pgw"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#171717]"
          }`}
        >
          <Key size={15} /> bKash & Nagad PGW
        </button>

        <button
          onClick={() => setActiveTab("gemini")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "gemini"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#171717]"
          }`}
        >
          <Bot size={15} /> Gemini AI Chatbot
        </button>
      </div>

      {/* Tab 1: General Store Settings */}
      {activeTab === "general" && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-[#222222] shadow-xs space-y-6"
        >
          {/* Section: Basic Store Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1f1f1f]">
              <Sliders size={16} className="text-purple-600" /> Basic Store Info & Notice
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Store Brand Title
              </label>
              <input
                type="text"
                value={settings["site_title"] || ""}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                placeholder="XoXo Shop"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Top Notice Announcement Bar
              </label>
              <textarea
                rows={2}
                value={settings["notice"] || ""}
                onChange={(e) => setSettings({ ...settings, notice: e.target.value })}
                placeholder="১৮ বছরের নিচে কেউ অর্ডার করবেন না..."
                className="w-full p-3 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 leading-relaxed text-slate-800 dark:text-zinc-200 font-medium"
              />
            </div>
          </div>

          {/* Section: Social Media Links */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1f1f1f]">
              <Share2 size={16} className="text-purple-600" /> Social Media Icons (Footer)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <FaFacebook className="text-blue-600" /> Facebook Page / Group URL
                </label>
                <input
                  type="url"
                  value={settings["support_facebook"] || settings["support_facebook_group"] || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      support_facebook: e.target.value,
                      support_facebook_group: e.target.value,
                    })
                  }
                  placeholder="https://facebook.com/xoxoshop"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <FaInstagram className="text-pink-600" /> Instagram Profile URL
                </label>
                <input
                  type="url"
                  value={settings["support_instagram"] || ""}
                  onChange={(e) => setSettings({ ...settings, support_instagram: e.target.value })}
                  placeholder="https://instagram.com/xoxoshop"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <FaYoutube className="text-red-600" /> YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={settings["support_youtube"] || ""}
                  onChange={(e) => setSettings({ ...settings, support_youtube: e.target.value })}
                  placeholder="https://youtube.com/@xoxoshop"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  Support Email (Mailto Link)
                </label>
                <input
                  type="email"
                  value={settings["support_email"] || ""}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  placeholder="support@xoxoshop.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section: Support Helpline & Telegram */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1f1f1f]">
              <Headphones size={16} className="text-purple-600" /> Helpline & Telegram Support Button
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <FaTelegram className="text-sky-500" /> Telegram Support Group / User Link *
                </label>
                <input
                  type="url"
                  value={settings["support_telegram"] || ""}
                  onChange={(e) => setSettings({ ...settings, support_telegram: e.target.value })}
                  placeholder="https://t.me/xoxoshop"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Helpline Working Hours Text
                </label>
                <input
                  type="text"
                  value={settings["telegram_helpline_text"] || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, telegram_helpline_text: e.target.value })
                  }
                  placeholder="Help line [9AM-12PM]"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Telegram Button Title Label
                </label>
                <input
                  type="text"
                  value={settings["telegram_helpline_label"] || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, telegram_helpline_label: e.target.value })
                  }
                  placeholder="টেলিগ্রাম সাপোর্ট"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Emergency Phone Support
                </label>
                <input
                  type="text"
                  value={settings["support_phone"] || ""}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  placeholder="+880 1700-000000"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Smartphone size={14} className="text-purple-600" /> Google Play / Mobile App Link
                </label>
                <input
                  type="url"
                  value={settings["app_download_url"] || ""}
                  onChange={(e) => setSettings({ ...settings, app_download_url: e.target.value })}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-zinc-200 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-amber-900 dark:text-amber-300 block">
                Store Maintenance Mode
              </span>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                When enabled, visitors will see a maintenance screen and order placements are
                paused.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings["maintenance_mode"] === "true"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenance_mode: e.target.checked ? "true" : "false",
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Save Settings & Social Links
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: External Diamond API Integration */}
      {activeTab === "diamond_api" && (
        <div className="space-y-6">
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-[#222222] shadow-xs space-y-6"
          >
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-[#1f1f1f]">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Globe className="text-purple-600 dark:text-purple-400" size={18} />
                  External Diamond Provider API
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Configure the 3rd party diamond buying API URL and API Key for dynamic
                  `/uid-topup` data.
                </p>
              </div>
              <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[10px] uppercase px-3 py-1 rounded-full">
                {settings["diamond_api_mode"] || "LOCAL"} Mode
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                External Diamond API URL / Endpoint <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={settings["diamond_api_url"] || ""}
                  onChange={(e) => setSettings({ ...settings, diamond_api_url: e.target.value })}
                  placeholder="https://api.provider.com/v1/diamonds"
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-slate-800 dark:text-zinc-200"
                />
                <LinkIcon size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                The endpoint that provides packages and prices for Free Fire diamond top-up.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Provider API Key / Secret Token
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings["diamond_api_key"] || ""}
                  onChange={(e) => setSettings({ ...settings, diamond_api_key: e.target.value })}
                  placeholder="sk_live_..."
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-slate-800 dark:text-zinc-200"
                />
                <Key size={14} className="absolute left-3 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
                Passed automatically in request headers as{" "}
                <code className="text-purple-600 dark:text-purple-400">
                  Authorization: Bearer [KEY]
                </code>{" "}
                and <code className="text-purple-600 dark:text-purple-400">x-api-key: [KEY]</code>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
                Diamond Data Operation Mode
              </label>
              <select
                value={settings["diamond_api_mode"] || "LOCAL"}
                onChange={(e) => setSettings({ ...settings, diamond_api_mode: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold text-slate-800 dark:text-zinc-200"
              >
                <option value="DYNAMIC">
                  ⚡ Dynamic Proxy Mode (Fetch live packages directly from external API for
                  /uid-topup)
                </option>
                <option value="SYNCED">
                  🔄 Synced Catalog Mode (Serve packages from database synced from external API)
                </option>
                <option value="LOCAL">
                  📦 Local Database Mode (Use manual product catalog from Admin Products)
                </option>
              </select>
            </div>

            {/* Test Connection & Sync Controls */}
            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingApi}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingApi ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Globe size={13} />
                  )}
                  Test API Connection
                </button>

                <button
                  type="button"
                  onClick={handleSyncProducts}
                  disabled={isSyncing}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Sync Diamond Packages
                </button>
              </div>

              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                Tested against external endpoint
              </span>
            </div>

            {/* Discovered Packages Preview if available */}
            {testResult?.sample_data && testResult.sample_data.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-[#171717] rounded-2xl border border-slate-200 dark:border-[#262626]">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-green-600" /> Discovered Diamond Packages
                  ({testResult.packages_found}):
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {testResult.sample_data.map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-[#111111] p-2.5 rounded-xl border border-slate-200 dark:border-[#222222] text-xs"
                    >
                      <p className="font-bold text-slate-800 dark:text-white">{p.name}</p>
                      <p className="text-purple-600 dark:text-purple-400 font-black text-[11px]">
                        ৳ {p.selling_price}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                        SKU: {p.provider_sku}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Save Diamond API Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: PGW Direct Credentials (bKash / Nagad) */}
      {activeTab === "pgw" && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-[#222222] shadow-xs space-y-6"
        >
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-[#1f1f1f]">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Key className="text-purple-600 dark:text-purple-400" size={18} />
                Automated Payment Gateway (PGW) Credentials
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Configure bKash PGW (Direct Merchant Checkout) and Nagad PGW API credentials
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPgwKeys(!showPgwKeys)}
              className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {showPgwKeys ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPgwKeys ? "Hide Secrets" : "Show Secrets"}
            </button>
          </div>

          {/* bKash Section */}
          <div className="p-4 bg-pink-50/50 dark:bg-pink-950/20 rounded-2xl border border-pink-100 dark:border-pink-900/40 space-y-3">
            <h4 className="font-bold text-pink-950 dark:text-pink-200 text-xs">
              bKash Payment Gateway (PGW)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  bKash App Key
                </label>
                <input
                  type={showPgwKeys ? "text" : "password"}
                  value={settings["bkash_app_key"] || ""}
                  onChange={(e) => setSettings({ ...settings, bkash_app_key: e.target.value })}
                  placeholder="bkash_app_key_..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl font-mono text-slate-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  bKash App Secret
                </label>
                <input
                  type={showPgwKeys ? "text" : "password"}
                  value={settings["bkash_app_secret"] || ""}
                  onChange={(e) => setSettings({ ...settings, bkash_app_secret: e.target.value })}
                  placeholder="bkash_secret_..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl font-mono text-slate-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  bKash Username
                </label>
                <input
                  type="text"
                  value={settings["bkash_username"] || ""}
                  onChange={(e) => setSettings({ ...settings, bkash_username: e.target.value })}
                  placeholder="merchant_user"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl font-mono text-slate-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  bKash Password
                </label>
                <input
                  type={showPgwKeys ? "text" : "password"}
                  value={settings["bkash_password"] || ""}
                  onChange={(e) => setSettings({ ...settings, bkash_password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl font-mono text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          {/* Nagad Section */}
          <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/40 space-y-3">
            <h4 className="font-bold text-orange-950 dark:text-orange-200 text-xs">
              Nagad Payment Gateway (PGW)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Nagad Merchant ID
                </label>
                <input
                  type="text"
                  value={settings["nagad_merchant_id"] || ""}
                  onChange={(e) => setSettings({ ...settings, nagad_merchant_id: e.target.value })}
                  placeholder="680000000000000"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl font-mono text-slate-800 dark:text-zinc-200"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Nagad Public Key / Secret
                </label>
                <input
                  type={showPgwKeys ? "text" : "password"}
                  value={settings["nagad_public_key"] || ""}
                  onChange={(e) => setSettings({ ...settings, nagad_public_key: e.target.value })}
                  placeholder="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl font-mono text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Save Payment Gateway Credentials
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Gemini AI Chatbot Settings */}
      {activeTab === "gemini" && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-[#222222] shadow-xs space-y-6"
        >
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-[#1f1f1f]">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Bot className="text-purple-600 dark:text-purple-400" size={18} />
                Gemini AI Chatbot Integration
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Configure Google Gemini API Key and model version for the floating support
                assistant.
              </p>
            </div>
            <span className="bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 font-bold text-[10px] uppercase px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Active
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={settings["gemini_api_key"] || ""}
                onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-slate-800 dark:text-zinc-200"
              />
              <Key size={14} className="absolute left-3 top-3 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">
              Get your key from Google AI Studio (aistudio.google.com). If empty, built-in smart
              assistant engine responds to FAQs.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
              Gemini Model Version
            </label>
            <select
              value={settings["gemini_model"] || "gemini-2.5-flash"}
              onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold text-slate-800 dark:text-zinc-200"
            >
              <option value="gemini-2.5-flash">
                Gemini 2.5 Flash (Recommended - Fastest & High Quality)
              </option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Custom Spec)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 flex items-start gap-3">
            <Sparkles size={18} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
              <strong>Floating Chatbot Feature:</strong> When enabled, a floating bot appears on all
              customer shop pages. Customers can ask questions in Bangla or English regarding Free
              Fire top-ups, payment verification steps, and order issues.
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#1f1f1f] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              Save Gemini AI Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
