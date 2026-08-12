import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Send, Mail } from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
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
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-[#f4f6fb] text-slate-800 min-h-screen flex flex-col font-sans`}>
        {/* Navbar */}
        <header className="bg-white sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 max-w-6xl h-20 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center font-bold text-2xl tracking-tighter">
                <div className="flex relative items-center">
                  <div className="w-8 h-8 rounded-full border-4 border-black mr-1 relative flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-black rounded-full mb-3 ml-2"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full"></div>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-black font-black text-[18px]">XoXo</span>
                    <span className="text-[#6b46c1] font-black text-[14px]">Shop</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-4 md:gap-8">
              <Link href="/" className="text-sm font-bold text-slate-700 hover:text-[#6b46c1] hidden md:block">
                Topup
              </Link>
              <Link href="/" className="text-sm font-bold text-slate-700 hover:text-[#6b46c1] hidden md:block">
                Contact Us
              </Link>
              <button className="bg-[#6b46c1] hover:bg-purple-700 text-white px-6 py-2.5 rounded font-bold text-sm transition-colors">
                Login
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto">{children}</main>

        {/* Footer */}
        <footer className="bg-[#0b132b] text-white pt-12 pb-6 mt-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-center md:text-left">
              
              <div className="flex flex-col items-center md:items-start">
                <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-slate-200">Stay Connected</h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer">
                    <FaFacebook size={16} />
                  </div>
                  <div className="w-9 h-9 rounded-md border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer">
                    <FaInstagram size={16} />
                  </div>
                  <div className="w-9 h-9 rounded-md border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer">
                    <FaYoutube size={16} />
                  </div>
                  <div className="w-9 h-9 rounded-md border border-slate-700 flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer">
                    <Mail size={16} />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-slate-200">Our Mobile App</h3>
                <div className="bg-black border border-slate-700 rounded-lg py-1.5 px-3 inline-flex items-center gap-2 cursor-pointer w-[140px] justify-center hover:bg-slate-900 transition-colors">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.61 3 21.09 3 20.5ZM14.81 10.88L5.54 5.53L14 12L5.54 18.47L14.81 13.12C15.17 12.91 15.17 12.59 14.81 12.38V10.88ZM15.8 13.68L20.16 11.16C20.9 10.73 20.9 10.02 20.16 9.59L15.8 7.07L14.47 8.4L18.06 10.46L14.47 12.52L15.8 13.68Z"/></svg>
                  <div className="flex flex-col items-start leading-[1.1]">
                    <span className="text-[9px] text-white font-medium">GET IT ON</span>
                    <span className="text-[15px] font-semibold text-white">Google Play</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end">
                <h3 className="font-bold text-sm mb-6 uppercase tracking-wider text-slate-200">Support Center</h3>
                <div className="border border-slate-700 rounded-md p-2.5 flex items-center gap-3 w-[220px]">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#0b132b]">
                    <Send size={14} className="ml-0.5" />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] text-slate-300 font-medium">Help line [9AM-12PM]</span>
                    <span className="text-xs font-semibold text-white mt-0.5">টেলিগ্রাম সাপোর্ট</span>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="pt-6 border-t border-slate-800 text-center text-[11px] text-slate-400 font-medium">
              <p>&copy; Offer TopUp 2026 | All Rights Reserved | Developed by <span className="font-bold text-white">Team Mahal</span></p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
