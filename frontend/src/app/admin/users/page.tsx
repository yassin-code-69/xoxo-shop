"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Loader2,
  RefreshCw,
  UserPlus,
  Trash2,
  Edit2,
  CheckCircle2,
  ShieldCheck,
  Download,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { CustomerAdmin } from "../../../lib/api/types";
import {
  getAdminCustomers,
  createAdminCustomer,
  updateAdminCustomer,
  deleteAdminCustomer,
} from "../../../lib/api/endpoints";
import { useDebounce } from "../../../lib/hooks/useDebounce";
import { exportToCsv } from "../../../lib/utils/csv";

const AVAILABLE_ROLES = ["CUSTOMER", "SUPPORT", "ADMIN", "SUPER_ADMIN"];

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<CustomerAdmin[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("CUSTOMER");
  const [newStatus, setNewStatus] = useState("ACTIVE");

  const [editingCustomer, setEditingCustomer] = useState<CustomerAdmin | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("ACTIVE");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const loadCustomers = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await getAdminCustomers({
        page,
        pageSize: 20,
        search: debouncedSearch.trim() || undefined,
      });
      setCustomers(res.items);
      setTotalPages(res.total_pages || 1);
      setTotalCount(res.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load users.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers(true);
  }, [page, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers(true);
  };

  const handleOpenEdit = (c: CustomerAdmin) => {
    setEditingCustomer(c);
    setEditName(c.full_name || "");
    setEditPhone(c.phone || "");
    setSelectedRoles(c.roles || ["CUSTOMER"]);
    setSelectedStatus(c.status || "ACTIVE");
  };

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1 && role === "CUSTOMER") return; // prevent zero roles
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setIsSaving(true);
    setNotification(null);
    try {
      await createAdminCustomer({
        email: newEmail.trim().toLowerCase(),
        full_name: newName.trim() || undefined,
        phone: newPhone.trim() || undefined,
        role: newRole,
        status: newStatus,
      });
      setNotification({ type: "success", text: `User ${newEmail} created successfully!` });
      setIsCreating(false);
      setNewEmail("");
      setNewName("");
      setNewPhone("");
      await loadCustomers(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSaving(true);
    setNotification(null);
    try {
      await updateAdminCustomer(editingCustomer.id, {
        full_name: editName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        status: selectedStatus,
        is_active: selectedStatus === "ACTIVE",
        roles: selectedRoles,
      });
      setNotification({
        type: "success",
        text: `User ${editingCustomer.email} updated successfully!`,
      });
      setEditingCustomer(null);
      await loadCustomers(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update user.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete user "${email}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteAdminCustomer(id);
      setNotification({ type: "success", text: `User ${email} deleted successfully.` });
      await loadCustomers(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user.";
      setNotification({ type: "error", text: msg });
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      `xoxo-shop-users-${new Date().toISOString().split("T")[0]}`,
      [
        { key: "id", label: "User ID" },
        { key: "full_name", label: "Full Name" },
        { key: "email", label: "Email Address" },
        { key: "phone", label: "Phone Number" },
        { key: "roles", label: "Assigned Roles" },
        { key: "status", label: "Account Status" },
        { key: "total_orders", label: "Total Orders" },
        { key: "total_spent", label: "Total Spent" },
        { key: "created_at", label: "Joined Date" },
      ],
      customers.map((c) => ({
        ...c,
        roles: c.roles.join(", "),
        created_at: new Date(c.created_at).toLocaleString(),
      })),
    );
  };

  const filteredCustomers = customers.filter((c) => {
    if (roleFilter === "ALL") return true;
    return c.roles.includes(roleFilter);
  });

  const staffCount = customers.filter((c) =>
    c.roles.some((r) => r === "ADMIN" || r === "SUPER_ADMIN" || r === "SUPPORT"),
  ).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-purple-600 dark:text-purple-400" />
            User & Customer Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Create, update, and manage registered player accounts, security status (Active /
            Blocked), and assign administrative roles
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={customers.length === 0}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <UserPlus size={14} /> Add User
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadCustomers(false);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#222222] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin text-purple-600" : ""} />{" "}
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Users
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-white">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Accounts
            </span>
            <span className="text-2xl font-black text-green-600 dark:text-green-400">
              {customers.filter((c) => c.status === "ACTIVE").length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] p-5 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Staff & Admins
            </span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {staffCount}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
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
            type="button"
            onClick={() => setNotification(null)}
            className="uppercase text-[10px] ml-4 font-black cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col sm:flex-row justify-between gap-4">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
          {["ALL", "SUPER_ADMIN", "ADMIN", "SUPPORT", "CUSTOMER"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === role
                  ? "bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-300 shadow-sm"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {role}
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
              placeholder="Search name, email, phone..."
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl text-xs focus:outline-none focus:border-purple-500 transition-all text-slate-800 dark:text-white w-64"
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

      {/* Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#171717] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-[#1f1f1f]">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Assigned Roles</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Total Spent</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-zinc-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading
                    users...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-slate-400 dark:text-zinc-500 font-medium"
                  >
                    No user accounts found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {c.full_name || "Customer"}
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-zinc-400">{c.email}</td>
                    <td className="p-4 font-mono text-slate-600 dark:text-zinc-400">
                      {c.phone || <span className="text-slate-400 italic">None</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {c.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              r === "ADMIN" || r === "SUPER_ADMIN"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                : r === "SUPPORT"
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                  : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white">
                      {c.total_orders}
                    </td>
                    <td className="p-4 font-black text-slate-900 dark:text-white">
                      {c.total_spent}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          c.status === "ACTIVE"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                            : c.status === "BLOCKED"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 font-bold p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.email)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-[#1f1f1f] flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-500 dark:text-zinc-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create New User Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f1f1f] pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Add New User / Staff
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+880 1700 000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Initial Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white font-bold"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white font-bold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f1f1f] pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Edit User Details & Roles
                </h3>
                <p className="text-xs text-slate-400 font-mono">{editingCustomer.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+880 1700 000000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800 dark:text-white font-mono"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                  Account Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                >
                  <option value="ACTIVE">ACTIVE (Full access)</option>
                  <option value="BLOCKED">BLOCKED (Cannot place orders)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily locked)</option>
                </select>
              </div>

              {/* Roles Multi-Check */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-2">
                  Assigned Administrative Roles
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const isChecked = selectedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggle(role)}
                        className={`p-2.5 rounded-xl border text-left font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 shadow-xs"
                            : "bg-slate-50 dark:bg-[#171717] border-slate-200 dark:border-[#262626] text-slate-600 dark:text-zinc-400 hover:bg-slate-100"
                        }`}
                      >
                        <span>{role}</span>
                        {isChecked && <CheckCircle2 size={14} className="text-purple-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
