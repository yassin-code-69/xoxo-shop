"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Zap,
  ChevronRight,
  LogOut,
  Sparkles,
  ArrowRight,
  Headset,
  Send,
  HelpCircle,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { getMyOrders, updateMyProfile } from "../../../lib/api/endpoints";
import { Order } from "../../../lib/api/types";

export default function ProfilePage() {
  const {
    profile,
    refreshProfile,
    isAuthenticated,
    isAdmin,
    logout,
    isLoading: authLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "edit" | "support">(
    "overview",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) return;
      setIsLoadingOrders(true);
      try {
        const res = await getMyOrders(1, 50);
        setOrders(res.items || []);
      } catch (err) {
        console.error("Failed to load user orders", err);
      } finally {
        setIsLoadingOrders(false);
      }
    }
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    try {
      await updateMyProfile({ full_name: fullName.trim(), phone: phone.trim() });
      await refreshProfile();
      setNotification({ type: "success", text: "Profile information updated successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={40} />
        <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto min-h-[65vh] flex flex-col justify-center items-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <User size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Access Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            Log in to view your diamond top-up history, track orders, and manage account details.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all shadow-lg text-center cursor-pointer"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/register"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all text-center cursor-pointer"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculated user stats
  const totalOrders = orders.length;
  const totalSpent = orders
    .filter((o) => o.payment_status === "VERIFIED" || o.order_status === "COMPLETED")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const completedOrders = orders.filter((o) => o.order_status === "COMPLETED").length;
  const pendingOrders = orders.filter(
    (o) => o.order_status === "PENDING_PAYMENT" || o.order_status === "PAYMENT_SUBMITTED",
  ).length;

  const joinDate = profile?.created_at ? profile.created_at.slice(0, 10) : "Member";

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8 min-h-[75vh]">
      {/* Top Banner / User Hero Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-purple-800/30">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 p-1 shadow-2xl">
                <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-white text-3xl font-black">
                  {profile?.full_name
                    ? profile.full_name.charAt(0).toUpperCase()
                    : profile?.email.charAt(0).toUpperCase()}
                </div>
              </div>
              <div
                className="absolute -bottom-1.5 -right-1.5 bg-green-500 text-white p-1 rounded-full border-2 border-slate-900 shadow-md"
                title="Verified Customer"
              >
                <ShieldCheck size={14} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {profile?.full_name || "Free Fire Player"}
                </h1>
                <span className="bg-purple-500/30 text-purple-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-purple-400/40">
                  {profile?.roles?.[0] || "CUSTOMER"}
                </span>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-indigo-400/50 flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                  >
                    <ShieldAlert size={11} /> Admin Panel
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-purple-200/90 font-medium mt-1">
                <div className="flex items-center gap-1.5">
                  <Mail size={13} className="text-purple-400" />
                  <span>{profile?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={13} className="text-purple-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-purple-400" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/uid-topup"
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={14} fill="currentColor" /> Quick Top-Up
            </Link>
            <button
              onClick={logout}
              className="bg-white/10 hover:bg-red-600/80 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Logout from account"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-purple-800/40">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              Total Orders
            </span>
            <span className="text-2xl font-black text-white mt-1">{totalOrders}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              Total Spent
            </span>
            <span className="text-2xl font-black text-white mt-1">৳ {totalSpent.toFixed(2)}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Completed
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1">{completedOrders}</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              In-Progress / Pending
            </span>
            <span className="text-2xl font-black text-amber-300 mt-1">{pendingOrders}</span>
          </div>
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm transition-all ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
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

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "overview"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sparkles size={16} /> Overview & Orders
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "orders"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ShoppingBag size={16} /> All Orders ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "edit"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <User size={16} /> Edit Profile
        </button>

        <button
          onClick={() => setActiveTab("support")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === "support"
              ? "bg-purple-600 text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Headset size={16} /> Help & Support
        </button>
      </div>

      {/* Tab Content */}
      {/* 1. Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders Summary (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Recent Top-Up Orders
                  </h3>
                  <p className="text-xs text-slate-500">Your latest diamond delivery status</p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All ({orders.length}) →
                </button>
              </div>

              {isLoadingOrders ? (
                <div className="flex items-center justify-center py-10 text-slate-400 gap-2 font-medium text-xs">
                  <Loader2 className="animate-spin" size={20} /> Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <ShoppingBag
                    className="mx-auto text-slate-300 dark:text-slate-700 mb-2"
                    size={36}
                  />
                  <p className="font-semibold text-xs text-slate-500">No orders placed yet.</p>
                  <Link
                    href="/uid-topup"
                    className="mt-3 inline-block bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer"
                  >
                    Top Up Diamonds Now
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.slice(0, 5).map((o) => {
                    const isCompleted = o.order_status === "COMPLETED";
                    return (
                      <Link
                        key={o.id}
                        href={`/payment/${o.public_order_id}`}
                        className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-2xl transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isCompleted
                                ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                                : "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-white text-xs block">
                              {o.product_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              UID: {o.player_uid} • #{o.public_order_id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className="font-black text-xs text-slate-900 dark:text-white block">
                              ৳ {o.total_amount}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isCompleted
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                              }`}
                            >
                              {o.order_status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Short Profile (1 col) */}
          <div className="flex flex-col gap-5">
            {/* Quick Topup shortcuts */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
                Quick Top-Up Options
              </h3>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/uid-topup"
                  className="flex items-center justify-between p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs flex items-center gap-2">
                    <Zap size={14} /> Free Fire UID Topup (BD)
                  </span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/weekly-monthly"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs flex items-center gap-2">
                    <Sparkles size={14} /> Weekly & Monthly Pass
                  </span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/level-up-pass"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-xs flex items-center gap-2">
                    <ShieldCheck size={14} /> Level Up Pass
                  </span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-md">
              <h4 className="font-bold text-sm mb-1">Need Order Assistance?</h4>
              <p className="text-xs text-purple-200 mb-4">
                Our support team is active everyday to help you with instant Free Fire delivery.
              </p>
              <a
                href="https://t.me/xoxoshop_support"
                target="_blank"
                rel="noreferrer"
                className="bg-white text-purple-900 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow hover:bg-purple-50 transition-all cursor-pointer"
              >
                <Send size={14} /> Telegram Helpline
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. All Orders Tab */}
      {activeTab === "orders" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Full Order History
              </h3>
              <p className="text-xs text-slate-500">
                All Free Fire top-ups and packages ordered under your account
              </p>
            </div>
            <Link
              href="/uid-topup"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow cursor-pointer"
            >
              + New Topup
            </Link>
          </div>

          {isLoadingOrders ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2 font-medium">
              <Loader2 className="animate-spin" size={24} /> Loading all orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ShoppingBag className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={40} />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                No orders recorded yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((o) => {
                const isCompleted = o.order_status === "COMPLETED";
                const isSubmitted =
                  o.payment_status === "SUBMITTED" || o.payment_status === "VERIFIED";

                return (
                  <Link
                    key={o.id}
                    href={`/payment/${o.public_order_id}`}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-2xl transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                          isCompleted
                            ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                            : isSubmitted
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                              : "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                            #{o.public_order_id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {o.created_at ? o.created_at.slice(0, 10) : ""}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mt-0.5">
                          {o.product_name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Player UID:{" "}
                          <span className="font-mono font-semibold">{o.player_uid}</span> • Method:{" "}
                          {o.payment_method_code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pl-16 sm:pl-0">
                      <span className="font-black text-base text-slate-900 dark:text-white">
                        ৳ {o.total_amount}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCompleted
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : o.order_status === "PAYMENT_SUBMITTED"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : o.order_status === "PAYMENT_VERIFIED"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}
                      >
                        {o.order_status.replace(/_/g, " ")}
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Edit Profile Tab */}
      {activeTab === "edit" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm max-w-2xl">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
            Personal Information
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Update your display name and contact phone number
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white font-medium"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Support Tab */}
      {activeTab === "support" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-4">
              <Headset size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
              Customer Support Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              If your diamonds haven&apos;t arrived within 5 minutes or you entered an incorrect
              UID, contact our 24/7 customer care team on Telegram.
            </p>

            <div className="space-y-3">
              <a
                href="https://t.me/xoxoshop_support"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-2xl text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Send size={16} /> Official Telegram Support
                </span>
                <ArrowRight size={14} />
              </a>

              <Link
                href="/tutorial"
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle size={16} /> Top-Up Tutorial & FAQs
                </span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mb-4">
                <CreditCard size={24} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                Payment Verification Info
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Supported manual payment gateways in Bangladesh: <strong>bKash</strong>,{" "}
                <strong>Nagad</strong>, and <strong>Rocket</strong>. Always submit the exact
                Transaction ID for immediate automatic diamond top-up.
              </p>
            </div>

            <Link
              href="/uid-topup"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3.5 rounded-2xl text-xs text-center shadow-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              Order Free Fire Diamonds
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
