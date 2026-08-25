"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  User,
  ShoppingBag,
  CreditCard,
  Plus,
  Headset,
  PlaySquare,
  ShieldAlert,
  LogOut,
  Sparkles,
  ChevronRight,
  LogIn,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { AddMoneyModal } from "./AddMoneyModal";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const pathname = usePathname();
  const { profile, isAuthenticated, isAdmin, logout, refreshProfile } = useAuth();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        {/* Backdrop Click */}
        <div className="flex-1" onClick={onClose} />

        {/* Drawer Content */}
        <div className="w-full max-w-[320px] sm:max-w-sm bg-white dark:bg-[#120b22] text-slate-800 dark:text-white h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-purple-900/40 animate-in slide-in-from-right duration-300 overflow-y-auto">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-purple-900/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black">
                X
              </div>
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">
                Account Menu
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-purple-950/60 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
            {/* User Profile Card if logged in */}
            {isAuthenticated ? (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 dark:from-[#1c1236] dark:to-[#170e2c] rounded-2xl p-4 border border-purple-100 dark:border-purple-900/50 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-purple-800 shadow-md bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || "Profile"}
                        className="w-full h-full object-cover"
                      />
                    ) : profile?.full_name ? (
                      profile.full_name.charAt(0).toUpperCase()
                    ) : (
                      "U"
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-slate-900 dark:text-white truncate">
                        {profile?.full_name || "Verified Member"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {profile?.email}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                    </span>
                  </div>
                </div>

                {/* Wallet Balance Strip in Drawer */}
                <div className="bg-white dark:bg-[#150a2b] rounded-xl p-3 border border-purple-100 dark:border-purple-900/40 flex items-center justify-between shadow-xs">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <span>Wallet Balance</span>
                      <button
                        onClick={handleRefresh}
                        className={`text-slate-400 hover:text-purple-600 transition-colors ${
                          isRefreshing ? "animate-spin text-purple-600" : ""
                        }`}
                      >
                        <RefreshCw size={10} />
                      </button>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      ৳ {profile?.balance || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddMoney(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Plus size={13} strokeWidth={3} /> Add Money
                  </button>
                </div>
              </div>
            ) : (
              /* Guest Card */
              <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-800/40 text-center flex flex-col gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                  <Sparkles size={20} />
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Welcome to XoXo Shop
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in to view rank perks, order history, and deposit wallet funds
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md"
                  >
                    <LogIn size={13} /> Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation List */}
            <div className="flex flex-col gap-1 text-xs font-semibold py-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 py-1">
                Navigation
              </span>

              {isAuthenticated && (
                <>
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors ${
                      pathname === "/profile"
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-purple-950/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <User size={16} />
                      <span>My Profile & Rank</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setShowAddMoney(true)}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors font-bold cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={16} />
                      <span>Add Money to Wallet</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-purple-600 text-white px-2 py-0.5 rounded-full">
                      + Add
                    </span>
                  </button>

                  <Link
                    href="/orders"
                    onClick={onClose}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors ${
                      pathname === "/orders"
                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-purple-950/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={16} />
                      <span>My Orders</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={onClose}
                      className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/50 transition-colors my-1"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert size={16} />
                        <span>Admin Dashboard</span>
                      </div>
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </>
              )}

              <Link
                href="/uid-topup"
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors ${
                  pathname === "/uid-topup"
                    ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-purple-950/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Zap size={16} />
                  <span>Free Fire Diamonds Top-Up</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>

              <Link
                href="/tutorial"
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors ${
                  pathname === "/tutorial"
                    ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-purple-950/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlaySquare size={16} />
                  <span>How to Top-Up Tutorial</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>

              <Link
                href="/contact"
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl transition-colors ${
                  pathname === "/contact"
                    ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-purple-950/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Headset size={16} />
                  <span>Help Line & Support</span>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
            </div>

            {/* Dark Mode & System Theme Switcher */}
            <div className="pt-3 pb-1 border-t border-slate-100 dark:border-purple-900/30 flex items-center justify-between px-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-purple-950/60 text-slate-700 dark:text-purple-300 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    App Theme
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Switch Light / Dark mode
                  </span>
                </div>
              </div>
              <ThemeToggle />
            </div>

            {/* Logout Button */}
            {isAuthenticated && (
              <div className="mt-auto pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    void logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold transition-all cursor-pointer"
                >
                  <LogOut size={15} /> Sign Out Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Add Money Modal */}
      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => setShowAddMoney(false)}
        onSuccess={() => {
          setShowAddMoney(false);
          void refreshProfile();
        }}
      />
    </>
  );
}
