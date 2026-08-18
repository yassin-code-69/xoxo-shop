"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  XCircle,
  Send,
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronRight,
  Star,
  Flame,
  Trophy,
} from "lucide-react";

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotice, setShowNotice] = useState(true);

  const slides = [
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="flex flex-col gap-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Notice Bar */}
      {showNotice && (
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg relative overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-64 h-full bg-white opacity-10 transform skew-x-12 translate-x-20"></div>
          <div className="p-4 flex flex-col z-10 w-full pr-12 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} className="text-yellow-300 animate-pulse" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">Important Notice</h3>
            </div>
            <p className="text-xs sm:text-sm font-medium text-white/90">
              ১৮ বছরের নিচে কেউ অর্ডার করবেন না! বাবা/মা বা ফ্যামিলির টাকা চুরি করে অর্ডার করলে তার বিরুদ্ধে আইনগত
              ব্যবস্থা নেওয়া হবে!
            </p>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full absolute right-3 top-1/2 -translate-y-1/2 z-10 transition-colors"
          >
            <XCircle size={20} />
          </button>
        </div>
      )}

      {/* Hero Banner Slider */}
      <div className="w-full flex flex-col items-center group">
        <div className="w-full rounded-2xl bg-white dark:bg-slate-900 shadow-xl relative overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
          <div className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[450px] relative flex items-center justify-center overflow-hidden">
            <div
              className="flex w-full h-full transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1)"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                  <img
                    src={slide}
                    alt={`Featured Promotion ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 z-20 text-white max-w-lg hidden sm:block">
                    <span className="px-3 py-1 bg-purple-600 text-xs font-bold uppercase rounded-full mb-3 inline-block">
                      Featured
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black mb-2 drop-shadow-md">
                      Exclusive Weekly Offer
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base font-medium">
                      Get up to 30% bonus diamonds on your first top-up this week.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slider Controls */}
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex gap-2">
            {slides.map((_, idx) => (
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <button className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-md hover:shadow-xl hover:-translate-y-1 group">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-white group-hover:scale-110 transition-transform">
            <Send size={24} className="ml-0.5" />
          </div>
          <div className="text-left flex flex-col">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-white/70 tracking-wider">
              Live Support
            </span>
            <span className="font-black text-sm sm:text-lg leading-none mt-1">Telegram Chat</span>
          </div>
        </button>
        <button className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-md hover:shadow-xl hover:-translate-y-1 group">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-white group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <div className="text-left flex flex-col">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-white/70 tracking-wider">
              Community
            </span>
            <span className="font-black text-sm sm:text-lg leading-none mt-1">Join FB Group</span>
          </div>
        </button>
      </div>

      {/* Topup Categories */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy className="text-purple-600 dark:text-purple-400" /> Popular Services
          </h2>
          <Link
            href="#"
            className="text-sm font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1 group"
          >
            View All{" "}
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
          {[
            { name: "Free Fire LIKES", src: "/FF/1.jpg", href: "/ff-likes", tag: "Hot" },
            { name: "UID TOPUP (BD)", src: "/FF/2.jpg", href: "/uid-topup", tag: "Fast" },
            { name: "Weekly & Monthly", src: "/FF/3.jpg", href: "/weekly-monthly" },
            { name: "Weekly Lite", src: "/FF/4.jpg", href: "/weekly-lite" },
            { name: "Level Up Pass", src: "/FF/5.jpg", href: "/level-up-pass", tag: "Value" },
            { name: "Indo Server", src: "/FF/6.jpg", href: "/indonesia-server" },
          ].map((item, idx) => (
            <Link href={item.href} key={idx} className="group">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm hover:shadow-xl ring-1 ring-slate-100 dark:ring-slate-700 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full relative overflow-hidden">
                {item.tag && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-1 rounded-bl-lg z-20">
                    {item.tag}
                  </div>
                )}
                <div className="w-full aspect-square rounded-xl bg-slate-100 dark:bg-slate-700 mb-3 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img
                    src={item.src}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&q=80";
                    }}
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

      {/* Special Offer Highlight */}
      <div className="mt-8 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl overflow-hidden shadow-2xl relative border border-blue-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>

        <div className="grid md:grid-cols-2 items-center gap-8 p-8 md:p-12 relative z-10">
          <div className="flex flex-col items-start text-white">
            <span className="bg-yellow-500 text-black text-xs font-black uppercase px-3 py-1 rounded-full mb-4 flex items-center gap-1">
              <Star size={14} fill="currentColor" /> Limited Time
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">
              Mega Diamond <br />
              Bundle Pack
            </h2>
            <p className="text-blue-200 mb-8 max-w-md">
              Get up to 5000+ diamonds with exclusive gun skins and a legendary emote. Only
              available for the next 48 hours!
            </p>
            <button className="bg-white text-blue-900 hover:bg-blue-50 font-black px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95">
              Claim Offer Now
            </button>
          </div>
          <div className="relative flex justify-center mt-8 md:mt-0">
            <div className="w-64 h-64 md:w-80 md:h-80 relative group cursor-pointer">
              <div className="absolute inset-0 bg-blue-500 rounded-3xl rotate-6 group-hover:rotate-12 transition-transform duration-500 opacity-50 blur-sm"></div>
              <img
                src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80"
                alt="Special Bundle"
                className="relative z-10 w-full h-full object-cover rounded-3xl shadow-2xl border-4 border-white/10 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Recent Orders */}
      <div className="mt-12 bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-5 dark:opacity-10 group-hover:opacity-10 transition-opacity"></div>

        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center shadow-inner">
              <ActivityIcon />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                Live Purchases
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-600 dark:text-green-400 font-bold text-xs tracking-wider uppercase">
                  Updating in real-time
                </span>
              </div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:rotate-180 transition-all duration-500">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            {
              name: "Mehedi Hasan",
              product: "200 FF LIKES - Daily limit",
              status: "Pending",
              avatarColor: "bg-indigo-100 text-indigo-600",
              time: "Just now",
              amount: "৳30",
            },
            {
              name: "Tahmid SK",
              product: "115 Diamond Pack",
              status: "Completed",
              avatarColor: "bg-emerald-100 text-emerald-600",
              time: "2 mins ago",
              amount: "৳79",
            },
            {
              name: "Ridoy Rahman",
              product: "5060 Diamond Mega Pack",
              status: "Completed",
              avatarColor: "bg-rose-100 text-rose-600",
              time: "5 mins ago",
              amount: "৳3220",
            },
            {
              name: "Altaf Hossain",
              product: "3X Weekly Lite",
              status: "Completed",
              avatarColor: "bg-slate-100 text-slate-600",
              time: "12 mins ago",
              amount: "৳135",
            },
            {
              name: "Ariyan Khan",
              product: "Weekly Membership",
              status: "Completed",
              avatarColor: "bg-blue-100 text-blue-600",
              time: "15 mins ago",
              amount: "৳158",
            },
          ].map((order, idx) => (
            <div
              key={idx}
              className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0 shadow-sm ${order.avatarColor}`}
                >
                  {order.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[15px] text-slate-800 dark:text-slate-200">
                      {order.name}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                      • {order.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {order.product}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pl-16 sm:pl-0">
                <span className="font-black text-slate-800 dark:text-slate-200">
                  {order.amount}
                </span>
                {order.status === "Pending" ? (
                  <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-blue-100 dark:border-blue-800">
                    <Clock size={12} strokeWidth={2.5} /> {order.status}
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-green-100 dark:border-green-800">
                    <CheckCircle2 size={12} strokeWidth={2.5} /> {order.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}
