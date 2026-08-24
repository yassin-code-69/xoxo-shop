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
    <div className="flex flex-col gap-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Dynamic Announcement Notice Bar (offertopup.com style) */}
      {showNotice && (
        <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200/90 dark:border-[#1f1f1f] rounded-xl shadow-xs flex items-center h-11 sm:h-12 overflow-hidden relative transition-all">
          {/* Left Attached NOTICE Badge */}
          <div className="h-full px-4 sm:px-5 bg-[#7e22ce] text-white flex items-center gap-2 shrink-0 font-black text-xs uppercase tracking-wider shadow-[4px_0_12px_rgba(126,34,206,0.2)] z-10 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-white/40 inline-block animate-pulse shrink-0" />
            <span>NOTICE</span>
          </div>

          {/* Scrolling Marquee Message */}
          <div className="flex-1 overflow-hidden relative flex items-center px-4">
            <div className="animate-marquee whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200">
              {noticeText}
            </div>
          </div>

          {/* Right Close Button */}
          <button
            onClick={() => setShowNotice(false)}
            aria-label="Close Notice"
            className="w-6 h-6 rounded-full bg-[#7e22ce] hover:bg-[#6b21a8] text-white flex items-center justify-center shrink-0 mr-3 transition-transform hover:scale-105 shadow-xs z-10"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Hero Banner Slider */}
      <div className="w-full flex flex-col items-center group">
        <div className="w-full rounded-3xl bg-white dark:bg-slate-900 shadow-xl relative overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[420px] relative flex items-center justify-center overflow-hidden">
            <div
              className="flex w-full h-full transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {activeSlides.map((slide, idx) => (
                <div key={slide.id || idx} className="w-full h-full flex-shrink-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
                  <Image
                    src={slide.image_url}
                    alt={slide.title || `Promotion ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
                    className="object-cover"
                  />
                  <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20 text-white max-w-lg">
                    <span className="px-3 py-1 bg-purple-600 text-xs font-black uppercase rounded-full mb-3 inline-block shadow-md">
                      Featured Top-Up
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black mb-2 drop-shadow-md">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-white/85 text-xs sm:text-base font-medium drop-shadow-sm">
                        {slide.subtitle}
                      </p>
                    )}
                    {slide.link_url && (
                      <Link
                        href={slide.link_url}
                        className="mt-4 inline-flex items-center gap-1.5 bg-white text-purple-900 hover:bg-purple-50 font-black text-xs uppercase px-5 py-2.5 rounded-xl shadow-lg transition-transform hover:scale-105"
                      >
                        Order Now <ChevronRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activeSlides.length > 1 && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex gap-2">
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <a
          href={settings["support_telegram"] || "https://t.me/xoxoshop"}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-4 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-white group-hover:scale-110 transition-transform shrink-0">
            <Send size={24} className="ml-0.5" />
          </div>
          <div className="text-left flex flex-col">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-white/70 tracking-wider">
              24/7 Live Support
            </span>
            <span className="font-black text-sm sm:text-lg leading-none mt-1">
              Telegram Helpdesk
            </span>
          </div>
        </a>

        <Link
          href="/contact"
          className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-4 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
        >
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-white group-hover:scale-110 transition-transform shrink-0">
            <Users size={24} />
          </div>
          <div className="text-left flex flex-col">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-white/70 tracking-wider">
              Assistance & FAQ
            </span>
            <span className="font-black text-sm sm:text-lg leading-none mt-1">
              Customer Helpline
            </span>
          </div>
        </Link>
      </div>

      {/* Topup Categories */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy className="text-purple-600 dark:text-purple-400" /> Diamond Packages & Services
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
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
              tag: "High Reward",
            },
            {
              name: "Indo Server",
              src: "/FF/6.jpg",
              href: "/indonesia-server",
            },
            { name: "Free Fire Likes", src: "/FF/1.jpg", href: "/ff-likes" },
          ].map((item, idx) => (
            <Link href={item.href} key={idx} className="group">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full relative overflow-hidden">
                {item.tag && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg z-20">
                    {item.tag}
                  </div>
                )}
                <div className="w-full aspect-square rounded-xl bg-slate-100 dark:bg-slate-700 mb-3 overflow-hidden relative">
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-center text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 mt-auto">
                  {item.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Real Live Purchases Feed */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shadow-inner">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                Live Purchases Stream
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-green-600 dark:text-green-400 font-bold text-xs uppercase">
                  Connected to Live Backend Feed
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefreshFeed}
            disabled={isRefreshingFeed}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-purple-600 transition-all"
          >
            <RefreshCw size={16} className={isRefreshingFeed ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No recent orders recorded yet. Be the first to top-up today!
            </div>
          ) : (
            recentOrders.map((order) => {
              const isCompleted = order.order_status === "COMPLETED";
              return (
                <div
                  key={order.id}
                  className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                        isCompleted
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                      }`}
                    >
                      {order.customer_display_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {order.customer_display_name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          •{" "}
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {order.product_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-15 sm:pl-0">
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      ৳ {order.total_amount}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
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
