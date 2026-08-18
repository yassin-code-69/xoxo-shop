"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlaySquare, LayoutGrid, Headset } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Tutorial",
      href: "/tutorial", // change if tutorial route is different
      icon: PlaySquare,
    },
    {
      name: "TopUp",
      href: "/uid-topup", // or /#topup
      icon: LayoutGrid,
    },
    {
      name: "Support",
      href: "/contact",
      icon: Headset,
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
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-bold leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
