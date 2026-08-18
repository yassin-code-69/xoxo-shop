"use client";

import Link from "next/link";
import { Home, ArrowLeft, Ghost } from "lucide-react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function NotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen flex flex-col font-sans items-center justify-center`}
      >
        <div className="flex flex-col items-center text-center px-4 max-w-lg">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-slate-900 rounded-full shadow-2xl flex items-center justify-center relative z-10 border border-slate-100 dark:border-slate-800 animate-bounce">
              <Ghost size={64} className="text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 drop-shadow-sm">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
            Oops! The page you are looking for seems to have vanished into the void. It might have
            been moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link
              href="/"
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Home size={18} /> Back to Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold px-8 py-3.5 rounded-xl transition-all shadow-sm hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Go Back
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
