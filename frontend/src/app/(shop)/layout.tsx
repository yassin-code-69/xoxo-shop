import { MobileNav } from "../../components/MobileNav";
import { ShopHeader } from "../../components/ShopHeader";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Send, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { ThemeProvider } from "../../components/ThemeProvider";
import { AuthProvider } from "../../lib/auth/AuthContext";
import { FloatingChatBot } from "../../components/FloatingChatBot";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XoXo Shop",
  description: "Instant, safe, and automated Free Fire diamond top-up platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-[#f4f6fb] dark:bg-[#0f0c20] text-slate-800 dark:text-[#ededed] min-h-screen flex flex-col font-sans transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NextTopLoader color="#663cbc" showSpinner={false} />
            {/* Top Navbar */}
            <ShopHeader />

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

            {/* Floating Gemini Chat Bot */}
            <FloatingChatBot />

            {/* Mobile Bottom Navigation */}
            <MobileNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
