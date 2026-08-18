import { MobileNav } from "../../components/MobileNav";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Link from "next/link";
import { Send, Mail, Home, LayoutGrid, Headset, Search } from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { ThemeProvider } from "../../components/ThemeProvider";
import { ThemeToggle } from "../../components/ThemeToggle";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Offer TopUp",
  description: "Offer TopUp Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-950 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader color="#9333ea" showSpinner={false} />
          {/* Navbar */}
          <header className="bg-white dark:bg-slate-950 sticky top-0 z-50 shadow-sm border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-6xl h-20 flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="flex items-center font-bold text-2xl tracking-tighter">
                  <div className="flex relative items-center">
                    <div className="w-8 h-8 rounded-full border-4 border-black dark:border-white mr-1 relative flex items-center justify-center transition-colors">
                      <div className="w-2.5 h-2.5 bg-black dark:bg-white rounded-full mb-3 ml-2 transition-colors"></div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full"></div>
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-black dark:text-white font-black text-[18px] transition-colors">
                        XoXo
                      </span>
                      <span className="text-primary-600 font-black text-[14px]">Shop</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Navigation Links - Desktop */}
              <nav className="hidden md:flex items-center gap-8">
                <Link
                  href="/"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  <Home size={16} /> Home
                </Link>
                <Link
                  href="/uid-topup"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  <LayoutGrid size={16} /> Topup
                </Link>
                <Link
                  href="/#contact"
                  className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                >
                  <Headset size={16} /> Contact Us
                </Link>
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex relative mr-2">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 dark:text-white transition-all w-48"
                  />
                </div>
                <ThemeToggle />
                <Link
                  href="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center"
                >
                  Login
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 w-full max-w-6xl mx-auto">{children}</main>

          {/* Footer */}
          <footer className="bg-gradient-to-br from-primary-600 to-primary-900 text-white pt-16 pb-28 md:pb-8 mt-16 relative overflow-hidden shadow-inner">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 opacity-70"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 -left-12 w-48 h-48 bg-purple-900/30 rounded-full blur-2xl"></div>

            <div className="container mx-auto px-4 max-w-5xl relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 text-center md:text-left">
                <div className="flex flex-col items-center md:items-start">
                  <h3 className="font-bold text-sm mb-6 uppercase tracking-widest text-purple-200 drop-shadow-sm">
                    Stay Connected
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm">
                      <FaFacebook size={18} className="text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm">
                      <FaInstagram size={18} className="text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm">
                      <FaYoutube size={18} className="text-white" />
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all cursor-pointer backdrop-blur-sm">
                      <Mail size={18} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <h3 className="font-bold text-sm mb-6 uppercase tracking-widest text-purple-200 drop-shadow-sm">
                    Our Mobile App
                  </h3>
                  <a
                    href="#"
                    className="hover:scale-110 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all cursor-pointer inline-block"
                  >
                    <img
                      src="/FF/google-play.nDtcExnl.png"
                      alt="Get it on Google Play"
                      className="w-[150px] object-contain"
                    />
                  </a>
                </div>

                <div className="flex flex-col items-center md:items-end">
                  <h3 className="font-bold text-sm mb-6 uppercase tracking-widest text-purple-200 drop-shadow-sm">
                    Support Center
                  </h3>
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3 w-[240px] backdrop-blur-sm hover:bg-white/15 transition-colors shadow-lg">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 shadow-inner">
                      <Send size={18} className="ml-0.5" />
                    </div>
                    <div className="flex flex-col text-left leading-tight">
                      <span className="text-[11px] text-purple-200 font-medium">
                        Help line [9AM-12PM]
                      </span>
                      <span className="text-sm font-bold text-white mt-0.5 tracking-wide">
                        টেলিগ্রাম সাপোর্ট
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-primary-400/30 text-center text-[12px] text-primary-200 font-medium">
                <p>
                  &copy; 2026 <span className="text-white font-bold">XoXo Shop</span> | All Rights
                  Reserved
                </p>
              </div>
            </div>
          </footer>

          {/* Mobile Bottom Navigation */}
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
