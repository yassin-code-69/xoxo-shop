"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Download } from "lucide-react";
import { AuditLog } from "../../../lib/api/types";
import { getAdminAuditLogs } from "../../../lib/api/endpoints";
import { exportToCsv } from "../../../lib/utils/csv";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminAuditLogs({ page, pageSize: 50 });
      setLogs(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "action", label: "Action" },
      { key: "actor_email", label: "Actor Email" },
      { key: "entity_type", label: "Entity Type" },
      { key: "entity_id", label: "Entity ID" },
      { key: "ip_address", label: "IP Address" },
      { key: "timestamp", label: "Timestamp" },
    ];

    const rows = logs.map((l) => ({
      id: l.id,
      action: l.action,
      actor_email: l.actor_email || "SYSTEM",
      entity_type: l.entity_type,
      entity_id: l.entity_id || "N/A",
      ip_address: l.ip_address || "N/A",
      timestamp: new Date(l.created_at).toISOString(),
    }));

    exportToCsv(`audit_logs_export_${new Date().toISOString().slice(0, 10)}`, columns, rows);
  };

  useEffect(() => {
    loadLogs();
  }, [page]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Immutable operational audit trail for payment verification, pricing changes, and
            administrative actions
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isLoading || logs.length === 0}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="Export current audit logs to CSV"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#171717] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-[#1f1f1f]">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-[#1f1f1f] font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 dark:text-zinc-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading audit
                    logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-slate-400 dark:text-zinc-500 font-medium"
                  >
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors"
                  >
                    <td className="p-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-white">
                      {log.actor_email || "SYSTEM"}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900/60 px-2 py-0.5 rounded text-[10px] uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-zinc-300">
                      {log.entity_type} #{log.entity_id?.slice(0, 8)}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-zinc-400 truncate max-w-md">
                      {log.metadata_json || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
