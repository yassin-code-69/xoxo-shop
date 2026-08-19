"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  Package,
  Sliders,
  FileText,
  LogOut,
  Zap,
  Image as ImageIcon,
  Store,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const coreLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/payments", label: "Payments & Verify", icon: CreditCard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Diamond Packages", icon: Package },
    { href: "/admin/payment-methods", label: "Payment Methods", icon: Zap },
    { href: "/admin/banners", label: "Hero Banners", icon: ImageIcon },
  ];

  const systemLinks = [
    { href: "/admin/users", label: "Customers", icon: Users },
    { href: "/admin/settings", label: "Store & Diamond API", icon: Sliders },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
  ];

  const isLinkActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white dark:bg-[#0a0a0a]">
      {/* Mobile Drawer Header */}
      <div className="lg:hidden p-4 border-b border-slate-200 dark:border-[#1f1f1f] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="font-black text-slate-900 dark:text-white text-sm block">
              XoXo Admin
            </span>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">
              Console Navigation
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#171717] text-slate-600 dark:text-zinc-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav Links */}
      <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
        <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
          Core Operations
        </div>

        {coreLinks.map((item) => {
          const active = isLinkActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                active
                  ? "bg-purple-50 text-purple-700 shadow-sm border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 font-bold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#171717] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon
                size={16}
                className={
                  active
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-slate-400 dark:text-zinc-400"
                }
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 pb-1 px-3 text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase">
          Administration
        </div>

        {systemLinks.map((item) => {
          const active = isLinkActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                active
                  ? "bg-purple-50 text-purple-700 shadow-sm border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60 font-bold"
                  : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#171717] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon
                size={16}
                className={
                  active
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-slate-400 dark:text-zinc-400"
                }
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Return Link & Logout Button */}
      <div className="p-3.5 border-t border-slate-200/80 dark:border-[#1f1f1f] bg-slate-50/80 dark:bg-[#050505] space-y-1.5 shrink-0">
        <Link
          href="/"
          onClick={handleLinkClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-white hover:shadow-xs dark:hover:bg-[#171717] hover:text-purple-600 dark:hover:text-white font-semibold text-xs transition-all cursor-pointer"
        >
          <Store size={15} /> Back to Storefront
        </Link>
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            logout();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-xs transition-all cursor-pointer text-left"
        >
          <LogOut size={15} /> Sign Out (Logout)
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Docked Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200/80 dark:border-[#1f1f1f] flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* 2. Mobile Drawer Overlay Backdrop (< 1024px) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* 3. Mobile Slide-over Drawer (< 1024px) */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#0a0a0a] z-50 shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
