"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Send,
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronRight,
  Star,
  Flame,
  Trophy,
  Loader2,
} from "lucide-react";
import { Banner, OrderPublicFeedItem } from "../../lib/api/types";
import { getBanners, getSiteSettings, getPublicOrderFeed } from "../../lib/api/endpoints";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotice, setShowNotice] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [recentOrders, setRecentOrders] = useState<OrderPublicFeedItem[]>([]);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadHomeData = async () => {
    try {
      const [fetchedBanners, fetchedSettings, feed] = await Promise.all([
        getBanners().catch(() => []),
        getSiteSettings().catch(() => ({})),
        getPublicOrderFeed(8).catch(() => []),
      ]);
      setBanners(fetchedBanners);
      setSettings(fetchedSettings);
      setRecentOrders(feed);
    } finally {
      setIsLoading(false);
      setIsRefreshingFeed(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const defaultBanners = [
    {
      id: "default-1",
      image_url:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
      title: "Fast & Automated Top-Up",
      subtitle: "Instant Free Fire diamonds directly to your UID",
      link_url: "/uid-topup",
      active: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
    },
  ];

  const activeSlides = banners.length > 0 ? banners : defaultBanners;

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const handleRefreshFeed = async () => {
    setIsRefreshingFeed(true);
    try {
      const feed = await getPublicOrderFeed(8);
      setRecentOrders(feed);
    } finally {
      setIsRefreshingFeed(false);
    }
  };

  const noticeText =
    settings["notice"] || "১০০% নিরাপদ ও ইনস্ট্যান্ট ফ্রি ফায়ার ডায়মন্ড টপ-আপ। ২৪/৭ কাস্টমার সাপোর্ট।";

  return (
    <div className="flex flex-col gap-3.5 sm:gap-6 py-3 sm:py-6 px-2.5 sm:px-4 lg:px-6 max-w-7xl mx-auto">
      {/* Dynamic Announcement Notice Bar */}
      {showNotice && (
        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200/90 dark:border-[#1f1f1f] rounded-lg sm:rounded-xl shadow-xs flex items-center h-8 sm:h-11 overflow-hidden relative transition-all">
          {/* Left Attached NOTICE Badge */}
          <div className="h-full px-2.5 sm:px-4 bg-[#7e22ce] text-white flex items-center gap-1.5 shrink-0 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-[3px_0_10px_rgba(126,34,206,0.2)] z-10 select-none">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white ring-2 ring-white/40 inline-block animate-pulse shrink-0" />
            <span>NOTICE</span>
          </div>

          {/* Scrolling Marquee Message */}
          <div className="flex-1 overflow-hidden relative flex items-center px-2 sm:px-4">
            <div className="animate-marquee whitespace-nowrap text-[11px] sm:text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {noticeText}
            </div>
          </div>

          {/* Right Close Button */}
          <button
            onClick={() => setShowNotice(false)}
            aria-label="Close Notice"
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#7e22ce] hover:bg-[#6b21a8] text-white flex items-center justify-center shrink-0 mr-2 sm:mr-3 transition-transform hover:scale-105 shadow-xs z-10"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Hero Banner Slider */}
      <div className="w-full flex flex-col items-center group">
        <div className="w-full rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 shadow-md sm:shadow-xl relative overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="w-full h-[135px] xs:h-[160px] sm:h-[240px] md:h-[340px] lg:h-[380px] relative flex items-center justify-center overflow-hidden">
            <div
              className="flex w-full h-full transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {activeSlides.map((slide, idx) => (
                <div key={slide.id || idx} className="w-full h-full flex-shrink-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-10"></div>
                  <Image
                    src={slide.image_url}
                    alt={slide.title || `Promotion ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 sm:bottom-8 left-3.5 sm:left-8 z-20 text-white max-w-lg pr-4">
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-purple-600 text-[9px] sm:text-xs font-black uppercase rounded-full mb-1 sm:mb-2 inline-block shadow-md">
                      Featured Top-Up
                    </span>
                    <h2 className="text-sm xs:text-base sm:text-3xl font-black mb-0.5 sm:mb-1.5 drop-shadow-md leading-tight">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-white/85 text-[10px] sm:text-sm font-medium drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.link_url && (
                      <Link
                        href={slide.link_url}
                        className="mt-1.5 sm:mt-3 inline-flex items-center gap-1 bg-white text-purple-900 hover:bg-purple-50 font-black text-[10px] sm:text-xs uppercase px-3 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-md transition-transform hover:scale-105"
                      >
                        Order Now <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activeSlides.length > 1 && (
            <div className="absolute bottom-2.5 right-3 sm:bottom-5 sm:right-6 z-20 flex gap-1.5 sm:gap-2">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? "w-5 sm:w-8 bg-white" : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons (Side by Side on Mobile) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <a
          href={settings["support_telegram"] || "https://t.me/xoxoshop"}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-start gap-2 sm:gap-3 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
        >
          <div className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-white group-hover:scale-105 transition-transform shrink-0">
            <Send size={16} className="sm:w-5 sm:h-5 ml-0.5" />
          </div>
          <div className="text-left flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-white/70 tracking-tight leading-none truncate">
              24/7 Support
            </span>
            <span className="font-black text-xs sm:text-base leading-tight mt-0.5 truncate">
              Telegram Helpdesk
            </span>
          </div>
        </a>

        <Link
          href="/contact"
          className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-center justify-start gap-2 sm:gap-3 transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5 group"
        >
          <div className="bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-white group-hover:scale-105 transition-transform shrink-0">
            <Users size={16} className="sm:w-5 sm:h-5" />
          </div>
          <div className="text-left flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[10px] uppercase font-bold text-white/70 tracking-tight leading-none truncate">
              Assistance & FAQ
            </span>
            <span className="font-black text-xs sm:text-base leading-tight mt-0.5 truncate">
              Customer Helpline
            </span>
          </div>
        </Link>
      </div>

      {/* Topup Categories */}
      <div className="mt-1 sm:mt-2">
        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
          <h2 className="text-sm sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <Trophy size={16} className="text-purple-600 dark:text-purple-400 sm:w-5 sm:h-5" /> Diamond Packages & Services
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3.5">
          {[
            {
              name: "UID TOPUP (BD)",
              src: "/FF/2.jpg",
              href: "/uid-topup",
              tag: "Instant",
            },
            {
              name: "Weekly & Monthly",
              src: "/FF/3.jpg",
              href: "/weekly-monthly",
              tag: "Best Value",
            },
            { name: "Weekly Lite", src: "/FF/4.jpg", href: "/weekly-lite" },
            {
              name: "Level Up Pass",
              src: "/FF/5.jpg",
              href: "/level-up-pass",
              tag: "Reward",
            },
            {
              name: "Indo Server",
              src: "/FF/6.jpg",
              href: "/indonesia-server",
            },
            { name: "FF Likes", src: "/FF/1.jpg", href: "/ff-likes" },
          ].map((item, idx) => (
            <Link href={item.href} key={idx} className="group">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-1.5 sm:p-2.5 shadow-xs hover:shadow-md border border-slate-100 dark:border-slate-700 transition-all duration-200 hover:-translate-y-1 flex flex-col h-full relative overflow-hidden">
                {item.tag && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black uppercase px-1.5 py-0.2 rounded-bl-md z-20">
                    {item.tag}
                  </div>
                )}
                <div className="w-full aspect-square rounded-lg overflow-hidden relative mb-1.5 bg-slate-100 dark:bg-slate-700/50">
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="font-bold text-[10px] sm:text-xs text-center text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1 mt-auto">
                  {item.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Real Live Purchases Feed */}
      <div className="mt-3 sm:mt-6 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-sm sm:shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <div className="p-3 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <CheckCircle2 size={16} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xs sm:text-xl font-black text-slate-800 dark:text-white leading-tight">
                Live Purchases Stream
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-green-600 dark:text-green-400 font-bold text-[9px] sm:text-xs uppercase">
                  Live Feed
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefreshFeed}
            disabled={isRefreshingFeed}
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-all cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshingFeed ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentOrders.length === 0 ? (
            <div className="p-4 sm:p-6 text-center text-slate-400 text-xs font-medium">
              No recent orders recorded yet. Be the first to top-up today!
            </div>
          ) : (
            recentOrders.map((order) => {
              const isCompleted = order.order_status === "COMPLETED";
              return (
                <div
                  key={order.id}
                  className="p-2.5 sm:p-4 flex flex-row items-center justify-between gap-2 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shrink-0 ${
                        isCompleted
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                      }`}
                    >
                      {order.customer_display_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                          {order.customer_display_name}
                        </h4>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 shrink-0">
                          •{" "}
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {order.product_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 sm:gap-4 shrink-0">
                    <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      ৳ {order.total_amount}
                    </span>
                    <span
                      className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase ${
                        isCompleted
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      }`}
                    >
                      {order.order_status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
