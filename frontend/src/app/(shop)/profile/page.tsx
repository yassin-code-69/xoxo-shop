"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  RefreshCw,
  Check,
  Lock,
  ChevronRight,
  Plus,
  Coins,
  Award,
  Download,
  X,
  Edit3,
  LogOut,
  FileText,
  CreditCard,
  Zap,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";
import { getMyOrders, updateMyProfile } from "../../../lib/api/endpoints";
import { Order } from "../../../lib/api/types";
import { AddMoneyModal } from "../../../components/AddMoneyModal";

// Rank definitions matching the screenshot tier progression
export interface RankTier {
  id: string;
  name: string;
  level: number;
  minSpend: number;
  maxSpend: number;
  rangeLabel: string;
  color: string;
  bgColor: string;
  badgeGradient: string;
  description: string;
}

const RANK_TIERS: RankTier[] = [
  {
    id: "bronze",
    name: "Bronze",
    level: 1,
    minSpend: 0,
    maxSpend: 100,
    rangeLabel: "0 - 100 Tk",
    color: "#cd7f32",
    bgColor: "from-[#4a2810] via-[#6d3e18] to-[#8a5020]",
    badgeGradient: "from-amber-700 to-amber-900",
    description: "Start your journey from Bronze.",
  },
  {
    id: "silver",
    name: "Silver",
    level: 2,
    minSpend: 101,
    maxSpend: 1000,
    rangeLabel: "101 - 1,000 Tk",
    color: "#a8b2c1",
    bgColor: "from-[#2c3e50] via-[#3f5368] to-[#546e7a]",
    badgeGradient: "from-slate-400 to-slate-600",
    description: "Keep topping up to reach Silver tier.",
  },
  {
    id: "gold",
    name: "Gold",
    level: 3,
    minSpend: 1001,
    maxSpend: 5000,
    rangeLabel: "1,001 - 5,000 Tk",
    color: "#e5a910",
    bgColor: "from-[#6b4700] via-[#8c5d00] to-[#b37700]",
    badgeGradient: "from-amber-400 to-yellow-600",
    description: "Unlock Gold tier perks and lower rates.",
  },
  {
    id: "platinum",
    name: "Platinum",
    level: 4,
    minSpend: 5001,
    maxSpend: 10000,
    rangeLabel: "5,001 - 10,000 Tk",
    color: "#00b4d8",
    bgColor: "from-[#023e8a] via-[#0077b6] to-[#0096c7]",
    badgeGradient: "from-cyan-400 to-blue-600",
    description: "Elite Platinum status with exclusive rewards.",
  },
  {
    id: "diamond",
    name: "Diamond",
    level: 5,
    minSpend: 10001,
    maxSpend: 25000,
    rangeLabel: "10,001 - 25,000 Tk",
    color: "#9d4edd",
    bgColor: "from-[#3c096c] via-[#5a189a] to-[#7b2cbf]",
    badgeGradient: "from-purple-400 to-indigo-600",
    description: "Prestigious Diamond VIP tier.",
  },
  {
    id: "heroic",
    name: "Heroic",
    level: 6,
    minSpend: 25001,
    maxSpend: 50000,
    rangeLabel: "25,001 - 50,000 Tk",
    color: "#e63946",
    bgColor: "from-[#6a040f] via-[#9d0208] to-[#d00000]",
    badgeGradient: "from-red-500 to-rose-700",
    description: "Heroic gamer tier with instant priority delivery.",
  },
  {
    id: "master",
    name: "Master",
    level: 7,
    minSpend: 50001,
    maxSpend: 100000,
    rangeLabel: "50,001 - 100,000 Tk",
    color: "#f77f00",
    bgColor: "from-[#7f2e00] via-[#b34700] to-[#e65c00]",
    badgeGradient: "from-amber-500 to-red-600",
    description: "Master level top-up champion.",
  },
  {
    id: "grand-master",
    name: "Grand Master",
    level: 8,
    minSpend: 100001,
    maxSpend: Infinity,
    rangeLabel: "100,000+ Tk",
    color: "#ffd700",
    bgColor: "from-[#480ca8] via-[#7209b7] to-[#b5179e]",
    badgeGradient: "from-yellow-400 via-pink-500 to-purple-600",
    description: "Highest rank possible! Ultimate VIP benefits.",
  },
];

// SVG Rank Shield Component
function RankShieldIcon({ rankId, size = 44 }: { rankId: string; size?: number }) {
  switch (rankId) {
    case "bronze":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="bronze-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d98236" />
              <stop offset="50%" stopColor="#964b14" />
              <stop offset="100%" stopColor="#572806" />
            </linearGradient>
            <linearGradient id="bronze-plate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3a766" />
              <stop offset="100%" stopColor="#823d0a" />
            </linearGradient>
          </defs>
          <path
            d="M50 8 L85 24 V54 C85 75 50 92 50 92 C50 92 15 75 15 54 V24 Z"
            fill="url(#bronze-grad)"
            stroke="#f5b27b"
            strokeWidth="3"
          />
          <path
            d="M50 18 L76 30 V52 C76 68 50 81 50 81 C50 81 24 68 24 52 V30 Z"
            fill="url(#bronze-plate)"
            opacity="0.85"
          />
          <path d="M40 38 H46 V62 H40 Z M54 38 H60 V62 H54 Z M46 47 H54 V53 H46 Z" fill="#ffe8d1" />
        </svg>
      );
    case "silver":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>
          </defs>
          <path
            d="M50 8 L85 24 V54 C85 75 50 92 50 92 C50 92 15 75 15 54 V24 Z"
            fill="url(#silver-grad)"
            stroke="#cbd5e1"
            strokeWidth="3"
          />
          <path
            d="M50 18 L76 30 V52 C76 68 50 81 50 81 C50 81 24 68 24 52 V30 Z"
            fill="#334155"
            opacity="0.9"
          />
          <path d="M50 32 L62 48 H54 V64 H46 V48 H38 Z" fill="#f8fafc" />
        </svg>
      );
    case "gold":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffea75" />
              <stop offset="50%" stopColor="#d99b00" />
              <stop offset="100%" stopColor="#7a5500" />
            </linearGradient>
          </defs>
          <path
            d="M50 8 L85 24 V54 C85 75 50 92 50 92 C50 92 15 75 15 54 V24 Z"
            fill="url(#gold-grad)"
            stroke="#fff299"
            strokeWidth="3"
          />
          <path
            d="M50 18 L76 30 V52 C76 68 50 81 50 81 C50 81 24 68 24 52 V30 Z"
            fill="#523900"
            opacity="0.9"
          />
          <path
            d="M50 30 L54 42 H66 L56 50 L60 62 L50 54 L40 62 L44 50 L34 42 H46 Z"
            fill="#ffd700"
          />
        </svg>
      );
    case "platinum":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="plat-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>
          </defs>
          <path
            d="M50 8 L85 24 V54 C85 75 50 92 50 92 C50 92 15 75 15 54 V24 Z"
            fill="url(#plat-grad)"
            stroke="#a5f3fc"
            strokeWidth="3"
          />
          <path
            d="M50 18 L76 30 V52 C76 68 50 81 50 81 C50 81 24 68 24 52 V30 Z"
            fill="#082f49"
            opacity="0.9"
          />
          <polygon
            points="50,28 64,48 50,68 36,48"
            fill="#38bdf8"
            stroke="#e0f2fe"
            strokeWidth="2"
          />
        </svg>
      );
    case "diamond":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="dia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
          </defs>
          <path
            d="M50 8 L85 24 V54 C85 75 50 92 50 92 C50 92 15 75 15 54 V24 Z"
            fill="url(#dia-grad)"
            stroke="#e9d5ff"
            strokeWidth="3"
          />
          <path
            d="M50 18 L76 30 V52 C76 68 50 81 50 81 C50 81 24 68 24 52 V30 Z"
            fill="#2e1065"
            opacity="0.9"
          />
          <polygon points="50,26 66,42 50,68 34,42" fill="#c084fc" />
          <polygon points="50,26 66,42 50,48 34,42" fill="#e9d5ff" opacity="0.8" />
        </svg>
      );
    case "heroic":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="hero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="50%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          <path
            d="M50 8 L85 24 V54 C85 75 50 92 50 92 C50 92 15 75 15 54 V24 Z"
            fill="url(#hero-grad)"
            stroke="#fecaca"
            strokeWidth="3"
          />
          <path
            d="M50 18 L76 30 V52 C76 68 50 81 50 81 C50 81 24 68 24 52 V30 Z"
            fill="#450a0a"
            opacity="0.9"
          />
          <path
            d="M50 26 L60 40 L55 64 L50 56 L45 64 L40 40 Z"
            fill="#ef4444"
            stroke="#fee2e2"
            strokeWidth="2"
          />
        </svg>
      );
    case "master":
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="mas-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </linearGradient>
          </defs>
          <path
            d="M50 6 L88 22 V54 C88 77 50 94 50 94 C50 94 12 77 12 54 V22 Z"
            fill="url(#mas-grad)"
            stroke="#ffedd5"
            strokeWidth="3"
          />
          <path
            d="M50 16 L78 28 V52 C78 70 50 83 50 83 C50 83 22 70 22 52 V28 Z"
            fill="#431407"
            opacity="0.92"
          />
          <path
            d="M32 36 L50 26 L68 36 L62 58 L50 68 L38 58 Z"
            fill="#f97316"
            stroke="#fde047"
            strokeWidth="2"
          />
        </svg>
      );
    case "grand-master":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
          <defs>
            <linearGradient id="gm-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="40%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path
            d="M50 4 L90 20 V54 C90 78 50 96 50 96 C50 96 10 78 10 54 V20 Z"
            fill="url(#gm-grad)"
            stroke="#fef08a"
            strokeWidth="3"
          />
          <path
            d="M50 14 L80 26 V52 C80 72 50 85 50 85 C50 85 20 72 20 52 V26 Z"
            fill="#1e1b4b"
            opacity="0.94"
          />
          <path
            d="M32 46 L38 32 L50 40 L62 32 L68 46 L50 64 Z"
            fill="#facc15"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <circle cx="50" cy="24" r="4" fill="#fb7185" />
        </svg>
      );
  }
}

export default function ProfilePage() {
  const { profile, refreshProfile, isAuthenticated, logout, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showOrdersHistory, setShowOrdersHistory] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Edit form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("addMoney") === "true" || sp.get("addMoney") === "1") {
        setShowAddMoneyModal(true);
      }
    }
  }, []);

  useEffect(() => {
    async function loadOrders() {
      if (!isAuthenticated) return;
      setIsLoadingOrders(true);
      try {
        const res = await getMyOrders(1, 100);
        setOrders(res.items || []);
      } catch (err) {
        console.error("Failed to load user orders", err);
      } finally {
        setIsLoadingOrders(false);
      }
    }
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  // Derived user statistics
  const totalOrders = orders.length;
  const totalSpent = useMemo(() => {
    if (typeof profile?.total_spend === "number" && profile.total_spend > 0) {
      return profile.total_spend;
    }
    return orders
      .filter((o) => o.payment_status === "VERIFIED" || o.order_status === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [orders, profile?.total_spend]);

  const weeklySpent = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return orders
      .filter((o) => {
        const orderDate = new Date(o.created_at);
        const isValid = o.payment_status === "VERIFIED" || o.order_status === "COMPLETED";
        return isValid && orderDate >= oneWeekAgo;
      })
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  }, [orders]);

  // Determine current Rank based on total spend
  const currentRank = useMemo<RankTier>(() => {
    for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
      if (totalSpent >= RANK_TIERS[i].minSpend) {
        return RANK_TIERS[i];
      }
    }
    return RANK_TIERS[0];
  }, [totalSpent]);

  const currentRankIndex = useMemo(() => {
    return RANK_TIERS.findIndex((r) => r.id === currentRank.id);
  }, [currentRank]);

  const nextRank = useMemo<RankTier | null>(() => {
    if (currentRankIndex < RANK_TIERS.length - 1) {
      return RANK_TIERS[currentRankIndex + 1];
    }
    return null;
  }, [currentRankIndex]);

  // Progress percentage in the current tier
  const progressPercent = useMemo(() => {
    if (!nextRank) return 100;
    const tierSpan = currentRank.maxSpend - currentRank.minSpend;
    if (tierSpan <= 0) return 100;
    const currentProgress = totalSpent - currentRank.minSpend;
    const percent = Math.min(Math.max((currentProgress / tierSpan) * 100, 1), 100);
    return Math.round(percent);
  }, [totalSpent, currentRank, nextRank]);

  const amountNeededForNext = useMemo(() => {
    if (!nextRank) return 0;
    const needed = nextRank.minSpend - totalSpent;
    return needed > 0 ? needed : 0;
  }, [totalSpent, nextRank]);

  // Compute Support PIN & User ID from profile
  const supportPin = useMemo(() => {
    if (!profile) return "2698821";
    // Deterministic 7-digit PIN based on ID or email
    const str = profile.auth_user_id || profile.id || profile.email;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 9000000) + 1000000;
  }, [profile]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      const res = await getMyOrders(1, 100);
      setOrders(res.items || []);
    } catch (e) {
      console.warn("Refresh failed", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    try {
      await updateMyProfile({ full_name: fullName.trim(), phone: phone.trim() });
      await refreshProfile();
      setNotification({ type: "success", text: "Profile updated successfully!" });
      setShowEditModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      setNotification({ type: "error", text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={40} />
        <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto min-h-[65vh] flex flex-col justify-center items-center">
        <div className="w-full bg-white dark:bg-slate-900 rounded-[28px] p-8 border border-slate-200 dark:border-slate-800 text-center shadow-xl relative overflow-hidden">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <User size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Access Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
            Log in to view your diamond top-up rank, wallet balance, and orders.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all shadow-lg text-center cursor-pointer"
            >
              Sign In to Your Account
            </Link>
            <Link
              href="/register"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-2xl text-xs sm:text-sm transition-all text-center cursor-pointer"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col gap-6 min-h-[85vh]">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm transition-all ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="uppercase text-[10px] ml-4 font-black cursor-pointer hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Top Card: User Profile Overview & Wallet Balance */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Avatar & Name Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
          {/* Avatar with Online/Verified Indicator */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-gradient-to-tr from-purple-700 via-indigo-800 to-pink-600 flex items-center justify-center text-white font-black text-3xl">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : profile?.full_name ? (
                profile.full_name.charAt(0).toUpperCase()
              ) : (
                profile?.email?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {/* Green Online Dot */}
            <span
              className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 absolute bottom-1 right-1 shadow-sm"
              title="Online / Active"
            />
          </div>

          {/* User Details */}
          <div className="flex flex-col gap-1.5">
            {/* Name + Verified Badge */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {profile?.full_name || "MD Jaber Hossain Chowdhury"}
              </h1>
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Verified
              </span>
            </div>

            {/* Support PIN & Verified Account Metadata */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-slate-400" /> Support PIN: {supportPin}
              </span>
              <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-semibold">
                ★ Verified Account
              </span>
            </div>

            {/* Current Rank Pill */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl px-3.5 py-1.5 inline-flex items-center gap-3 w-fit mt-1 self-center sm:self-start">
              <RankShieldIcon rankId={currentRank.id} size={28} />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentRank.name} Member
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Level {currentRank.level} / Current Rank
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Wallet Balance Card */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm w-full lg:w-64 shrink-0 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Wallet Balance
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              className={`text-slate-400 hover:text-purple-600 transition-all p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer ${
                isRefreshing ? "animate-spin text-purple-600" : ""
              }`}
              title="Refresh Balance"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="my-2">
            <span className="text-sm font-semibold text-slate-400 mr-1.5">Tk</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {profile?.balance || 0}
            </span>
          </div>

          <button
            type="button"
            data-action="open-add-money"
            onClick={() => setShowAddMoneyModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            Add Money
          </button>
        </div>
      </div>

      {/* 2. Current Rank Banner (Luxury Warm Bronze/Metallic Card with Shiny Animation) */}
      <div
        className={`rounded-[28px] p-6 sm:p-8 shadow-2xl relative overflow-hidden bg-gradient-to-r ${currentRank.bgColor} text-white border border-amber-500/20 group`}
      >
        {/* Continuous Shiny Shimmer Light Beam Sweep */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-card-shine transform -skew-x-12" />
        </div>

        {/* Pulsing Holographic Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-amber-300/15 rounded-full blur-3xl animate-rank-glow pointer-events-none"></div>
        <div className="absolute -bottom-16 left-1/4 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-8 -translate-y-1/2 w-32 h-32 bg-amber-400/20 rounded-full blur-xl animate-rank-glow pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Rank Badge Circular Glass Container with Glow */}
          <div className="flex flex-col items-center justify-center shrink-0 self-center md:self-start relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.35)] relative overflow-hidden">
              {/* Inner shine sweep on the badge */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-card-shine pointer-events-none"></div>
              <RankShieldIcon rankId={currentRank.id} size={56} />
            </div>
            <span className="text-xs font-bold text-amber-200 mt-2 tracking-wide drop-shadow-sm">
              Level {currentRank.level}
            </span>
          </div>

          {/* Rank Progress Details */}
          <div className="flex-1 w-full flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold tracking-widest text-amber-200/90 uppercase">
                CURRENT RANK
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping"></span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-sm">
              {currentRank.name}
            </h2>
            <p className="text-xs text-amber-100/90 font-medium">{currentRank.description}</p>

            {/* Spend labels & Percentage */}
            <div className="flex items-center justify-between text-xs font-bold text-amber-200 mt-2">
              <span>{currentRank.rangeLabel}</span>
              <span className="bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-sm">
                {progressPercent}%
              </span>
            </div>

            {/* Custom Progress Bar with Coin Marker & Glow */}
            <div className="w-full h-3 bg-black/40 rounded-full overflow-visible relative my-1 shadow-inner border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 rounded-full transition-all duration-700 relative shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Glowing Gold Coin / Progress Marker */}
                <div className="absolute right-0 top-1/2 animate-coin-glow w-5 h-5 bg-gradient-to-br from-yellow-200 to-amber-400 rounded-full border-2 border-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.9)] flex items-center justify-center text-[10px] font-black text-amber-950 cursor-pointer">
                  🪙
                </div>
              </div>
            </div>

            {/* Needed amount text */}
            <p className="text-[11px] text-amber-100/85 font-medium flex items-center gap-1.5">
              <span>⚡</span>
              {nextRank
                ? `Need only ${amountNeededForNext} Tk to unlock ${nextRank.name}`
                : "Maximum VIP Rank reached!"}
            </p>
          </div>
        </div>

        {/* Highlight Banner: Unlock More Premium Products with Shimmer */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-start sm:items-center gap-3.5 border border-white/20 mt-6 shadow-inner relative overflow-hidden group-hover:bg-white/15 transition-all">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400/30 to-yellow-300/40 text-yellow-200 flex items-center justify-center shrink-0 shadow-sm border border-amber-300/30">
            <Sparkles size={18} className="animate-pulse text-amber-200" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Unlock More Premium Products
            </h4>
            <p className="text-[11px] sm:text-xs text-amber-100/80 mt-0.5 leading-relaxed">
              Top up more to increase your Total Spend and Rank, then unlock premium products,
              low-rate topups, verified profile icons, and future VIP benefits.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Stats 4-Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              ORDERS
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalOrders}
            </span>
          </div>
        </div>

        {/* Card 2: Total Spend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Coins size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              TOTAL SPEND
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {totalSpent} Tk
            </span>
          </div>
        </div>

        {/* Card 3: Weekly Spend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              WEEKLY SPEND
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {weeklySpent} Tk
            </span>
          </div>
        </div>

        {/* Card 4: Rank */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              RANK
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {currentRank.name}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Rank Journey Section ("RANK JOURNEY / Your Path") */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-[11px] font-black tracking-widest text-purple-600 dark:text-purple-400 uppercase">
              RANK JOURNEY
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Your Path</h3>
          </div>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-3 py-1 rounded-full border border-purple-100 dark:border-purple-800/40">
            {currentRank.level}/8
          </span>
        </div>

        {/* Rank List Container */}
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3 relative">
          {RANK_TIERS.map((tier, index) => {
            const isCurrent = tier.id === currentRank.id;
            const isUnlocked = totalSpent >= tier.minSpend;

            return (
              <div
                key={tier.id}
                className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all ${
                  isCurrent
                    ? "bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 shadow-sm"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent"
                }`}
              >
                {/* Left Side: Shield + Name + Range */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <RankShieldIcon rankId={tier.id} size={40} />
                    {/* Timeline connector line between rows */}
                    {index < RANK_TIERS.length - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-slate-200 dark:bg-slate-700 -z-0"></div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {tier.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {tier.rangeLabel}
                    </span>
                  </div>
                </div>

                {/* Right Side: Status Badge */}
                <div>
                  {isCurrent ? (
                    <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Check size={13} strokeWidth={3} /> Current
                    </span>
                  ) : isUnlocked ? (
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Check size={13} /> Unlocked
                    </span>
                  ) : (
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Lock size={12} /> Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Account Section ("ACCOUNT / User Information") */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-[11px] font-black tracking-widest text-purple-600 dark:text-purple-400 uppercase">
              ACCOUNT
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">User Information</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 px-3.5 py-1.5 rounded-xl border border-purple-100 dark:border-purple-800/40 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 size={13} /> Edit Profile
          </button>
        </div>

        {/* 4-Card Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: NAME */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                NAME
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
                {profile?.full_name || "MD Jaber Hossain Chowdhury"}
              </span>
            </div>
          </div>

          {/* Card 2: PHONE */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Phone size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                PHONE
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
                {profile?.phone || "Not provided"}
              </span>
            </div>
          </div>

          {/* Card 3: EMAIL */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                EMAIL
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-white truncate mt-0.5">
                {profile?.email || "user@example.com"}
              </span>
            </div>
          </div>

          {/* Card 4: USER ID */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                USER ID
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-white truncate mt-0.5">
                {supportPin}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Recent Orders & Quick Access */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Recent Diamond Orders
            </h3>
            <p className="text-xs text-slate-500">Your top-up transaction history</p>
          </div>
          <button
            type="button"
            onClick={() => setShowOrdersHistory(!showOrdersHistory)}
            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            {showOrdersHistory ? "Hide Orders" : `View All (${orders.length}) →`}
          </button>
        </div>

        {isLoadingOrders ? (
          <div className="flex items-center justify-center py-8 text-slate-400 gap-2 font-medium text-xs">
            <Loader2 className="animate-spin" size={18} /> Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <ShoppingBag className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
            <p className="font-semibold text-xs text-slate-500">No orders placed yet.</p>
            <Link
              href="/uid-topup"
              className="mt-3 inline-block bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow cursor-pointer transition-all"
            >
              Top Up Diamonds Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.slice(0, showOrdersHistory ? 50 : 3).map((o) => {
              const isCompleted = o.order_status === "COMPLETED";
              return (
                <Link
                  key={o.id}
                  href={`/payment/${o.public_order_id}`}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-2xl transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                          : "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white text-xs block">
                        {o.product_name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        UID: {o.player_uid} • #{o.public_order_id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="font-black text-xs text-slate-900 dark:text-white block">
                        ৳ {o.total_amount}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        }`}
                      >
                        {o.order_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={18} className="text-purple-600" /> Edit Profile Information
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ""}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-400 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white font-medium"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        onSuccess={() => {
          void refreshProfile();
        }}
      />
    </div>
  );
}
