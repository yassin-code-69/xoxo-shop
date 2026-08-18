import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ShieldCheck } from "lucide-react";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "../../lib/auth/AuthContext";
import { AdminHeaderUser } from "../../components/AdminHeaderUser";
import { ThemeProvider } from "../../components/ThemeProvider";
import { ThemeToggle } from "../../components/ThemeToggle";
import { AdminSidebar } from "../../components/AdminSidebar";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-[#f8fafc] dark:bg-black text-slate-800 dark:text-[#ededed] font-sans min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NextTopLoader color="#663cbc" showSpinner={false} />
            <div className="flex h-screen overflow-hidden">
              {/* Dynamic Sidebar with polished light & dark mode */}
              <AdminSidebar />

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc] dark:bg-black">
                <header className="h-16 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1f1f1f] flex items-center justify-between px-8 shrink-0 shadow-xs transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                      <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" /> Authorized Console
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <AdminHeaderUser />
                  </div>
                </header>

                <main className="flex-1 overflow-auto p-6 md:p-8 bg-[#f8fafc] dark:bg-black transition-colors duration-300">
                  {children}
                </main>
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
