import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  CreditCard,
  Package,
  Sliders,
  FileText,
  LogOut,
  ShieldCheck,
  Zap,
} from "lucide-react";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "../../lib/auth/AuthContext";
import { AdminHeaderUser } from "../../components/AdminHeaderUser";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Panel — XoXo Shop",
  description: "XoXo Shop Administration & Operations Console",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-slate-100 text-slate-800 font-sans`}>
        <AuthProvider>
          <NextTopLoader color="#9333ea" showSpinner={false} />
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
              <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-950">
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-sm">
                  X
                </div>
                <span className="text-lg font-black text-white">XoXo Admin</span>
              </div>

              <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Core Management
                </div>

                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <LayoutDashboard size={17} /> Overview
                </Link>

                <Link
                  href="/admin/payments"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <CreditCard size={17} /> Payments & Verify
                </Link>

                <Link
                  href="/admin/orders"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <ShoppingBag size={17} /> Orders
                </Link>

                <Link
                  href="/admin/products"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <Package size={17} /> Diamond Packages
                </Link>

                <Link
                  href="/admin/payment-methods"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <Zap size={17} /> Payment Methods
                </Link>

                <Link
                  href="/admin/banners"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <Package size={17} /> Hero Banners
                </Link>

                <div className="px-3 pt-4 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  System & Logs
                </div>

                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <Users size={17} /> Customers
                </Link>

                <Link
                  href="/admin/audit-logs"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <FileText size={17} /> Audit Logs
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 hover:text-white text-slate-300 font-medium text-sm transition-colors"
                >
                  <Sliders size={17} /> Store Settings
                </Link>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/60">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs transition-colors"
                >
                  <LogOut size={16} /> Back to Storefront
                </Link>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="bg-purple-100 text-purple-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={14} /> Authorized Console
                  </span>
                </div>
                <AdminHeaderUser />
              </header>

              <main className="flex-1 overflow-auto p-8 bg-slate-100">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
