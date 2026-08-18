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
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

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
    { href: "/admin/audit-logs", label: "Audit Logs", icon: FileText },
    { href: "/admin/settings", label: "Store Settings", icon: Sliders },
  ];

  const isLinkActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-64 bg-white dark:bg-[#0a0a0a] text-slate-600 dark:text-zinc-300 flex flex-col shrink-0 border-r border-slate-200/80 dark:border-[#1f1f1f] transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200/80 dark:border-[#1f1f1f] bg-white dark:bg-black">
        <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-purple-600/30">
          X
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-black text-slate-900 dark:text-white">XoXo Shop</span>
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-0.5">
            Admin Console
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-5 flex flex-col gap-1 px-3.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          Core Management
        </div>

        {coreLinks.map((item) => {
          const active = isLinkActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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

        <div className="px-3 pt-5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
          System & Logs
        </div>

        {systemLinks.map((item) => {
          const active = isLinkActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Footer Return Link */}
      <div className="p-3.5 border-t border-slate-200/80 dark:border-[#1f1f1f] bg-slate-50/80 dark:bg-[#050505]">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-white hover:shadow-xs dark:hover:bg-[#171717] hover:text-purple-600 dark:hover:text-white font-semibold text-xs transition-all"
        >
          <LogOut size={15} /> Back to Storefront
        </Link>
      </div>
    </aside>
  );
}
