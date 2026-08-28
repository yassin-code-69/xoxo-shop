import { MobileNav } from "../../components/MobileNav";
import { ShopHeader } from "../../components/ShopHeader";
import { ShopFooter } from "../../components/ShopFooter";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
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
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
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
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <NextTopLoader color="#663cbc" showSpinner={false} />
            {/* Top Navbar */}
            <ShopHeader />

            {/* Main Content */}
            <main className="flex-1 w-full max-w-6xl mx-auto">{children}</main>

            {/* Dynamic Footer with Admin Managed Links */}
            <ShopFooter />

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
