"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlaySquare, LayoutGrid, Headset, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "TopUp",
      href: "/uid-topup",
      icon: LayoutGrid,
    },
    {
      name: "Tutorial",
      href: "/tutorial",
      icon: PlaySquare,
    },
    {
      name: "Support",
      href: "/contact",
      icon: Headset,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-slate-100 dark:border-neutral-800/80 z-50 rounded-t-[1.5rem] shadow-[0_-8px_20px_rgba(0,0,0,0.3)] pt-3 pb-[env(safe-area-inset-bottom,1.25rem)] px-2 transition-colors duration-300">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                isActive
                  ? "text-purple-600 dark:text-purple-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 font-medium"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
