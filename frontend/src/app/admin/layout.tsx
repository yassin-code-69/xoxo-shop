import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "../../lib/auth/AuthContext";
import { ThemeProvider } from "../../components/ThemeProvider";
import { AdminLayoutShell } from "../../components/AdminLayoutShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Panel — XoXo Shop",
  description: "XoXo Shop Administration & Operations Console",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-[#f8fafc] dark:bg-black text-slate-800 dark:text-[#ededed] font-sans min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <NextTopLoader color="#663cbc" showSpinner={false} />
            <AdminLayoutShell>{children}</AdminLayoutShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
