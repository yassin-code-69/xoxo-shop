import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Link from "next/link";
import { LayoutDashboard, Users, ShoppingBag, Settings, LogOut } from "lucide-react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin Panel",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-slate-50 text-slate-800 font-sans`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-slate-200">
              <span className="text-xl font-black text-[#6b46c1]">Admin Panel</span>
            </div>
            <div className="flex-1 py-4 flex flex-col gap-1 px-3">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
              >
                <LayoutDashboard size={18} /> Dashboard
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
              >
                <ShoppingBag size={18} /> Orders
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Users size={18} /> Users
              </Link>
              <Link
                href="/admin/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
              >
                <Settings size={18} /> Settings
              </Link>
            </div>
            <div className="p-4 border-t border-slate-200">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 font-medium transition-colors"
              >
                <LogOut size={18} /> Back to Site
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
              <h2 className="font-bold text-slate-800">Admin Dashboard</h2>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#6b46c1] flex items-center justify-center font-bold text-white">
                  A
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6 bg-slate-50">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
