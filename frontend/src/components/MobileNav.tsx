"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Plus, CreditCard, User } from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";
import { ProfileDrawer } from "./ProfileDrawer";
import { AddMoneyModal } from "./AddMoneyModal";

export function MobileNav() {
  const pathname = usePathname();
  const { profile, isAuthenticated } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  const isHomeActive = pathname === "/";
  const isOrdersActive = pathname.startsWith("/orders");
  const isCodesActive = pathname.startsWith("/uid-topup");
  const isAccountActive = isDrawerOpen || pathname.startsWith("/profile");

  return (
    <>
      <nav
        aria-label="Mobile Bottom App Bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#120b22]/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-purple-950/80 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.6)] px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0.75rem)+4px)] transition-colors duration-300"
      >
        <div className="flex items-end justify-around max-w-md mx-auto relative">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex-1 flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all duration-200 select-none cursor-pointer active:scale-95 ${
              isHomeActive
                ? "text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
            }`}
          >
            <Home size={24} strokeWidth={isHomeActive ? 2.5 : 1.9} />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-1">Home</span>
          </Link>

          {/* 2. My Orders */}
          <Link
            href="/orders"
            className={`flex-1 flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all duration-200 select-none cursor-pointer active:scale-95 ${
              isOrdersActive
                ? "text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
            }`}
          >
            <ShoppingBag size={24} strokeWidth={isOrdersActive ? 2.5 : 1.9} />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-1">My Orders</span>
          </Link>

          {/* 3. Center Elevated Add Money Button (+) */}
          <div className="flex-1 flex flex-col items-center justify-center -mt-6">
            <button
              type="button"
              onClick={() => setIsAddMoneyOpen(true)}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(102,60,188,0.45)] border-4 border-white dark:border-[#120b22] active:scale-90 transition-all cursor-pointer group"
              title="Add Money to Wallet"
            >
              <Plus
                size={28}
                strokeWidth={3}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
            </button>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1">
              Add Money
            </span>
          </div>

          {/* 4. My Codes / Topup */}
          <Link
            href="/uid-topup"
            className={`flex-1 flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all duration-200 select-none cursor-pointer active:scale-95 ${
              isCodesActive
                ? "text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
            }`}
          >
            <CreditCard size={24} strokeWidth={isCodesActive ? 2.5 : 1.9} />
            <span className="text-[10px] sm:text-[11px] leading-tight mt-1">My Codes</span>
          </Link>

          {/* 5. My Account -> Opens Sidebar/Sidemenu */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center min-h-[54px] py-1 px-1 rounded-2xl transition-all duration-200 select-none cursor-pointer active:scale-95 ${
              isAccountActive
                ? "text-purple-600 dark:text-purple-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
            }`}
          >
            {isAuthenticated && profile?.avatar_url ? (
              <div
                className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-all ${
                  isAccountActive
                    ? "border-purple-600 dark:border-purple-400 shadow-sm"
                    : "border-transparent"
                }`}
              >
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Account"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <User size={24} strokeWidth={isAccountActive ? 2.5 : 1.9} />
            )}
            <span className="text-[10px] sm:text-[11px] leading-tight mt-1">My Account</span>
          </button>
        </div>
      </nav>

      {/* Mobile Profile Sidebar Drawer */}
      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        onSuccess={() => {
          setIsAddMoneyOpen(false);
        }}
      />
    </>
  );
}
