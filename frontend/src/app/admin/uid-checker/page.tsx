"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Zap,
  Activity,
  Server,
  Layers,
  Search,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { UidCheckerConfig, CreateUidCheckerConfigInput } from "../../../lib/api/types";
import {
  getUidCheckerConfigs,
  createUidCheckerConfig,
  updateUidCheckerConfig,
  deleteUidCheckerConfig,
  setPrimaryUidCheckerConfig,
} from "../../../lib/api/endpoints";

export default function AdminUidCheckerPage() {
  const [configs, setConfigs] = useState<UidCheckerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Masking state for API keys (map of config.id -> boolean)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<UidCheckerConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<CreateUidCheckerConfigInput>({
    provider_name: "Games Kinbo",
    endpoint_url: "https://api.gameskinbo.com/ff-info/get",
    api_key: "",
    header_name: "x-api-key",
    default_region: "BD",
    is_active: true,
    is_primary: false,
    rate_limit_per_min: 30,
    notes: "",
  });

  // Live Testing Sandbox State
  const [testUid, setTestUid] = useState("2312730961");
  const [testRegion, setTestRegion] = useState("BD");
  const [testConfigId, setTestConfigId] = useState<string>("primary");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testDuration, setTestDuration] = useState<number | null>(null);

  const loadConfigs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUidCheckerConfigs();
      setConfigs(data);
      setTestConfigId((prev) => {
        if (prev !== "primary" && !data.some((c) => c.id === prev)) {
          return "primary";
        }
        return prev;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load API configurations.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadConfigs();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingConfig(null);
    setFormData({
      provider_name: "Games Kinbo",
      endpoint_url: "https://api.gameskinbo.com/ff-info/get",
      api_key: "",
      header_name: "x-api-key",
      default_region: "BD",
      is_active: true,
      is_primary: configs.length === 0,
      rate_limit_per_min: 30,
      notes: "Free Fire player profile and UUID verification integration.",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cfg: UidCheckerConfig) => {
    setEditingConfig(cfg);
    setFormData({
      provider_name: cfg.provider_name,
      endpoint_url: cfg.endpoint_url,
      api_key: cfg.api_key,
      header_name: cfg.header_name,
      default_region: cfg.default_region,
      is_active: cfg.is_active,
      is_primary: cfg.is_primary,
      rate_limit_per_min: cfg.rate_limit_per_min || 30,
      notes: cfg.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider_name.trim()) {
      setError("Provider name is required.");
      return;
    }
    if (!formData.endpoint_url.trim()) {
      setError("Endpoint URL is required.");
      return;
    }
    if (!formData.api_key.trim()) {
      setError("API Key is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingConfig) {
        await updateUidCheckerConfig(editingConfig.id, formData);
        setSuccessMessage(`API configuration "${formData.provider_name}" updated successfully.`);
      } else {
        await createUidCheckerConfig(formData);
        setSuccessMessage(`API configuration "${formData.provider_name}" created successfully.`);
      }
      setIsModalOpen(false);
      await loadConfigs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save API configuration.";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfig = async (cfg: UidCheckerConfig) => {
    if (!confirm(`Are you sure you want to delete "${cfg.provider_name}" API Key configuration?`)) {
      return;
    }

    try {
      await deleteUidCheckerConfig(cfg.id);
      setSuccessMessage(`Configuration "${cfg.provider_name}" deleted.`);
      await loadConfigs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete configuration.";
      setError(msg);
    }
  };

  const handleSetPrimary = async (cfg: UidCheckerConfig) => {
    try {
      await setPrimaryUidCheckerConfig(cfg.id);
      setSuccessMessage(`"${cfg.provider_name}" is now set as the Primary UUID verification API.`);
      await loadConfigs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set primary provider.";
      setError(msg);
    }
  };

  const handleCopyKey = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRunLiveTest = async () => {
    if (!testUid.trim()) {
      setError("Please enter a test Player UUID.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setTestDuration(null);
    setError(null);

    const startTime = performance.now();

    try {
      const bodyPayload: Record<string, string> = {
        uid: testUid.trim(),
        region: testRegion,
      };
      if (testConfigId !== "primary") {
        bodyPayload["config_id"] = testConfigId;
      }

      const res = await fetch("/api/uid-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      const endTime = performance.now();
      setTestDuration(Math.round(endTime - startTime));
      setTestResult(data);
      // Reload configs to see updated usage count
      void loadConfigs();
    } catch (err: unknown) {
      const endTime = performance.now();
      setTestDuration(Math.round(endTime - startTime));
      const msg = err instanceof Error ? err.message : "Test request failed.";
      setTestResult({ valid: false, error: msg });
    } finally {
      setIsTesting(false);
    }
  };

  const totalUsage = configs.reduce((acc, c) => acc + (c.usage_count || 0), 0);
  const primaryConfig = configs.find((c) => c.is_primary) || configs[0];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-[#120b22] border border-slate-200 dark:border-purple-950/60 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1.5">
              <KeyRound size={12} /> External Service
            </span>
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Free Fire UUID Checker API
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Manage provider credentials, API endpoints, rate limits, and live player verification
            lookups for diamond top-ups.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadConfigs}
            disabled={isLoading}
            className="p-3 rounded-2xl bg-slate-100 dark:bg-[#1c1236] hover:bg-slate-200 dark:hover:bg-purple-950/80 text-slate-700 dark:text-purple-300 transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin text-purple-600" : ""} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} /> Add API Key / Provider
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-[10px] uppercase font-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 text-[10px] uppercase font-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#120b22] border border-slate-200 dark:border-purple-950/60 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Providers
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {configs.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#120b22] border border-slate-200 dark:border-purple-950/60 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Server size={22} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Primary
            </span>
            <span className="text-sm font-black text-slate-900 dark:text-white truncate block">
              {primaryConfig?.provider_name || "None"}
            </span>
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
              Region: {primaryConfig?.default_region || "BD"}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#120b22] border border-slate-200 dark:border-purple-950/60 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Checks
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalUsage}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#120b22] border border-slate-200 dark:border-purple-950/60 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Rate Limit
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {primaryConfig?.rate_limit_per_min || 30}{" "}
              <span className="text-xs font-semibold text-slate-400">req/min</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Live Testing Sandbox */}
      <div className="bg-white dark:bg-[#120b22] border border-slate-200 dark:border-purple-950/60 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-purple-900/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
              <Search size={16} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Live Verification Sandbox
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Test any Free Fire Player UUID in real-time to verify live responses and latency.
              </p>
            </div>
          </div>

          {testDuration !== null && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-purple-950 text-slate-700 dark:text-purple-300">
              ⚡ Latency: {testDuration}ms
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              Test Player UUID
            </label>
            <input
              type="text"
              value={testUid}
              onChange={(e) => setTestUid(e.target.value)}
              placeholder="e.g. 2312730961"
              className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              API Provider Key
            </label>
            <select
              value={testConfigId}
              onChange={(e) => setTestConfigId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
            >
              <option value="primary">Active Primary Provider</option>
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.provider_name} ({c.default_region})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              Server Region
            </label>
            <select
              value={testRegion}
              onChange={(e) => setTestRegion(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
            >
              <option value="BD">BD (Bangladesh)</option>
              <option value="IND">IND (India)</option>
              <option value="SG">SG (Singapore)</option>
              <option value="ID">ID (Indonesia)</option>
              <option value="BR">BR (Brazil)</option>
              <option value="US">US (United States)</option>
              <option value="PK">PK (Pakistan)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleRunLiveTest}
              disabled={isTesting || !testUid.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Zap size={14} /> Test API Key
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Test Results Card */}
        {testResult && (
          <div className="mt-4 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-[#150a2b] animate-in fade-in duration-200">
            {testResult.valid ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 dark:border-purple-900/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <UserCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {testResult.player_name}
                    </span>
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Verified Active
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Provider: <strong className="text-purple-600">{testResult.provider}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-white dark:bg-[#1c1236] rounded-xl border border-purple-100/60 dark:border-purple-900/30">
                    <span className="text-[10px] text-slate-400 block">Level</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Lv. {testResult.level || "N/A"}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1c1236] rounded-xl border border-purple-100/60 dark:border-purple-900/30">
                    <span className="text-[10px] text-slate-400 block">Likes</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ❤️ {testResult.likes ? testResult.likes.toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1c1236] rounded-xl border border-purple-100/60 dark:border-purple-900/30">
                    <span className="text-[10px] text-slate-400 block">Guild</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {testResult.guild_name || "None"}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#1c1236] rounded-xl border border-purple-100/60 dark:border-purple-900/30">
                    <span className="text-[10px] text-slate-400 block">Server Region</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {testResult.region}
                    </span>
                  </div>
                </div>

                {/* Raw JSON Details */}
                <details className="mt-1">
                  <summary className="text-[11px] font-bold text-purple-600 dark:text-purple-400 cursor-pointer select-none">
                    Inspect Raw Response Payload (JSON)
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                    {JSON.stringify(testResult.raw || testResult, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs font-bold">
                <AlertTriangle size={18} className="shrink-0" />
                <span>{testResult.error || "Verification failed."}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. CRUD Configurations List */}
      <div className="bg-white dark:bg-[#120b22] border border-slate-200 dark:border-purple-950/60 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-purple-600" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Configured API Keys &amp; Providers
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{configs.length} Configs</span>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center gap-2 text-slate-400 font-medium">
            <Loader2 className="animate-spin text-purple-600" size={24} /> Loading credentials...
          </div>
        ) : configs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <p className="font-semibold text-sm">No API configurations found in database.</p>
            <p className="text-xs mt-1">
              Click &quot;Add API Key / Provider&quot; above to add your Games Kinbo key.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-purple-950/40">
            {configs.map((cfg) => {
              const isRevealed = !!revealedKeys[cfg.id];
              const isCopied = copiedId === cfg.id;

              return (
                <div
                  key={cfg.id}
                  className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-[#170e2c]/50 transition-colors"
                >
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">
                        {cfg.provider_name}
                      </h3>

                      {cfg.is_primary && (
                        <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> Primary
                        </span>
                      )}

                      {cfg.is_active ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="bg-slate-100 dark:bg-neutral-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle size={10} /> Inactive
                        </span>
                      )}

                      <span className="bg-slate-100 dark:bg-purple-950/60 text-slate-600 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Region: {cfg.default_region}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="font-mono text-[11px] truncate max-w-md">
                        {cfg.endpoint_url}
                      </span>
                      <span>• Header: {cfg.header_name}</span>
                      <span>• Rate: {cfg.rate_limit_per_min || 30} req/min</span>
                      <span>• Used: {cfg.usage_count} lookups</span>
                    </div>

                    {/* API Key Box */}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-slate-100 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 flex items-center gap-2 max-w-sm overflow-hidden">
                        <span className="truncate">
                          {isRevealed ? cfg.api_key : `${cfg.api_key.slice(0, 6)}••••••••••••••••`}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleReveal(cfg.id)}
                          className="text-slate-400 hover:text-purple-600 cursor-pointer shrink-0"
                          title={isRevealed ? "Hide Key" : "Show Key"}
                        >
                          {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyKey(cfg.id, cfg.api_key)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#1c1236] hover:bg-slate-200 text-slate-600 dark:text-purple-300 text-xs transition-colors cursor-pointer"
                        title="Copy Key"
                      >
                        {isCopied ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>

                    {cfg.notes && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-0.5">
                        {cfg.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                    {!cfg.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(cfg)}
                        className="bg-slate-100 dark:bg-[#1c1236] hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-700 dark:text-purple-300 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Star size={12} /> Set Primary
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cfg)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#1c1236] hover:bg-purple-100 dark:hover:bg-purple-900/60 text-slate-700 dark:text-purple-300 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteConfig(cfg)}
                      className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#120b22] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-purple-900/60 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-purple-900/40 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                  <KeyRound size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingConfig ? "Edit API Configuration" : "Add New API Configuration"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-purple-950 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Provider Presets */}
            {!editingConfig && (
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      provider_name: "Games Kinbo",
                      endpoint_url: "https://api.gameskinbo.com/ff-info/get",
                      header_name: "x-api-key",
                      default_region: "BD",
                      rate_limit_per_min: 30,
                    }))
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer"
                >
                  ⚡ Preset: Games Kinbo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      provider_name: "Custom Free Fire API",
                      endpoint_url: "https://",
                      header_name: "Authorization",
                      default_region: "BD",
                      rate_limit_per_min: 60,
                    }))
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Custom Provider
                </button>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Provider Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.provider_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, provider_name: e.target.value }))
                  }
                  placeholder="e.g. Games Kinbo"
                  className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Base Endpoint URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.endpoint_url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endpoint_url: e.target.value }))
                  }
                  placeholder="https://api.gameskinbo.com/ff-info/get"
                  className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  API Key / Secret Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.api_key}
                  onChange={(e) => setFormData((prev) => ({ ...prev, api_key: e.target.value }))}
                  placeholder="Paste your API key here..."
                  className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Header Name
                  </label>
                  <input
                    type="text"
                    value={formData.header_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, header_name: e.target.value }))
                    }
                    placeholder="x-api-key"
                    className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Default Region
                  </label>
                  <select
                    value={formData.default_region}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, default_region: e.target.value }))
                    }
                    className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="BD">BD (Bangladesh)</option>
                    <option value="IND">IND (India)</option>
                    <option value="SG">SG (Singapore)</option>
                    <option value="ID">ID (Indonesia)</option>
                    <option value="BR">BR (Brazil)</option>
                    <option value="US">US (United States)</option>
                    <option value="PK">PK (Pakistan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Rate Limit (Requests / min)
                </label>
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={formData.rate_limit_per_min}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rate_limit_per_min: Number(e.target.value) || 30,
                    }))
                  }
                  className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes about this API key or subscription plan..."
                  className="w-full bg-slate-50 dark:bg-[#150a2b] border border-slate-200 dark:border-purple-950/80 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 resize-none"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-purple-900/30">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Active (Allow requests to use this provider)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_primary: e.target.checked }))
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Set as Primary Default Provider</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-purple-900/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>Save Configuration</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
