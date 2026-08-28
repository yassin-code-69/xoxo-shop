"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Info,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Check,
  FileText,
  CreditCard,
  Wallet,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { Product } from "../lib/api/types";
import { getProducts, createOrder, payOrderWithWallet, getSiteSettings } from "../lib/api/endpoints";
import { useAuth } from "../lib/auth/AuthContext";
import { AddMoneyModal } from "./AddMoneyModal";

interface TopupOrderFormProps {
  category: string;
  title: string;
  description: string;
  imageSrc: string;
  badgeText?: string;
}

interface UidCheckResult {
  valid: boolean;
  uid: string;
  player_name?: string;
  level?: number | null;
  likes?: number | null;
  guild_name?: string | null;
  region?: string;
  status?: string;
  message?: string;
  error?: string;
}

export function TopupOrderForm({
  category,
  title = "UID TOPUP (BD)",
  imageSrc = "/FF/2.jpg",
  badgeText = "২ সেকেন্ডে টপআপ",
}: TopupOrderFormProps) {
  const router = useRouter();
  const { profile, isAuthenticated, refreshProfile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPaymentType, setSelectedPaymentType] = useState<"WALLET" | "INSTANT">("WALLET");
  const [playerUid, setPlayerUid] = useState("");

  // UUID Checker state
  const [isCheckingUid, setIsCheckingUid] = useState(false);
  const [checkResult, setCheckResult] = useState<UidCheckResult | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoadingProducts(true);
      try {
        const [prods, settingsData] = await Promise.all([
          getProducts(category),
          getSiteSettings().catch(() => ({} as Record<string, string>)),
        ]);
        setProducts(prods);
        if (settingsData) setSiteSettings(settingsData);
        if (prods.length > 0) {
          setSelectedProduct(prods[0]);
        }
      } catch (err: unknown) {
        console.error("Failed to load products:", err);
        setError("Could not load products. Please check if backend is running.");
      } finally {
        setIsLoadingProducts(false);
      }
    }
    void loadData();
  }, [category]);

  const handleRunUidCheck = async () => {
    const uidToTest = playerUid.trim();
    if (!uidToTest || uidToTest.length < 6) {
      setError("Please enter a valid Player UUID / UID (minimum 6 digits).");
      return;
    }

    setError(null);
    setIsCheckingUid(true);
    setCheckResult(null);

    try {
      const res = await fetch("/api/uid-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: uidToTest }),
      });
      const data = (await res.json()) as UidCheckResult;
      if (res.ok && data.valid) {
        setCheckResult(data);
      } else {
        setCheckResult({
          valid: false,
          uid: uidToTest,
          error: data.error || "Player UUID not found or invalid format.",
        });
      }
    } catch {
      setCheckResult({
        valid: false,
        uid: uidToTest,
        error: "Failed to connect to UUID verification service.",
      });
    } finally {
      setIsCheckingUid(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProduct) {
      setError("Please select a package.");
      return;
    }
    if (!playerUid.trim()) {
      setError("এখানে গেমের আইডি কোড দিন (Please enter Free Fire Player UUID).");
      return;
    }
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const price = Number(selectedProduct.selling_price);
    const userBalance = Number(profile?.balance || 0);

    // If paying via wallet and insufficient balance, prompt to add money
    if (selectedPaymentType === "WALLET" && userBalance < price) {
      setShowAddMoney(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create authoritative order
      const order = await createOrder({
        product_id: selectedProduct.id,
        player_uid: playerUid.trim(),
        quantity: 1,
        payment_method: selectedPaymentType === "WALLET" ? "WALLET" : "BKASH",
      });

      // 2. If paying via wallet, process payment instantly!
      if (selectedPaymentType === "WALLET") {
        await payOrderWithWallet(order.public_order_id);
        await refreshProfile();
        router.push(`/payment/${order.public_order_id}?status=success`);
      } else {
        // Redirect to instant checkout page (bKash/Nagad gateway)
        router.push(`/payment/${order.public_order_id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process order. Please try again.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const currentPrice = Number(selectedProduct?.selling_price || 0);
  const currentBalance = Number(profile?.balance || 0);
  const hasSufficientWalletBalance = isAuthenticated && currentBalance >= currentPrice;

  return (
    <div className="flex flex-col gap-3.5 sm:gap-6 py-3 sm:py-6 px-2.5 sm:px-4 max-w-6xl mx-auto">
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-r from-purple-50 to-white dark:from-[#170e2c] dark:to-[#120b22] rounded-xl sm:rounded-2xl shadow-xs border border-slate-100 dark:border-purple-950/60 p-3.5 sm:p-6 flex items-center gap-3.5 sm:gap-6">
        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm shrink-0 border border-slate-100 dark:border-purple-900/40 bg-purple-900/10">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/FF/2.jpg";
            }}
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base sm:text-2xl font-black text-[#0b132b] dark:text-white mb-1 sm:mb-2 tracking-tight">
            {title}
          </h1>
          <div className="bg-purple-50 dark:bg-purple-950/50 text-[#663cbc] dark:text-purple-300 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 w-max border border-purple-100 dark:border-purple-900/40 shadow-xs">
            <Zap size={12} className="text-amber-500 fill-amber-500" /> {badgeText}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-[10px] uppercase font-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column: Step 1 (Select Recharge) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-[#120b22] rounded-2xl shadow-xs border border-slate-100 dark:border-purple-950/60 overflow-hidden">
            <div className="bg-slate-50 dark:bg-[#18112e] border-b border-slate-100 dark:border-purple-950/60 p-4 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#663cbc] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                1
              </div>
              <h2 className="font-bold text-[#0b132b] dark:text-white text-sm sm:text-base">
                Select Recharge
              </h2>
            </div>

            <div className="p-4 sm:p-5">
              {isLoadingProducts ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-purple-600" size={32} />
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                    Loading packages...
                  </p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  No active packages found.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {products.map((pkg) => {
                    const isSelected = selectedProduct?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedProduct(pkg)}
                        className={`rounded-xl py-3 px-2.5 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-2 text-center transition-all group outline-none cursor-pointer relative ${
                          isSelected
                            ? "border-2 border-[#663cbc] dark:border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-xs ring-2 ring-[#663cbc]/20"
                            : "border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#111111] hover:border-[#663cbc] hover:shadow-xs"
                        }`}
                      >
                        <span
                          className={`font-bold text-xs sm:text-sm truncate transition-colors ${
                            isSelected
                              ? "text-[#663cbc] dark:text-purple-300 font-black"
                              : "text-slate-900 dark:text-zinc-100 group-hover:text-[#663cbc]"
                          }`}
                        >
                          {pkg.name}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-purple-600 dark:text-purple-400 shrink-0">
                          ৳ {pkg.selling_price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tutorial Guide Link */}
            <div className="p-4 border-t border-slate-100 dark:border-purple-950/60 flex items-center justify-between">
              <Link
                href="/tutorial"
                className="text-[#00d084] text-xs sm:text-sm font-bold flex items-center gap-1.5 hover:underline w-max transition-colors"
              >
                <ExternalLink size={15} />
                <span>কীভাবে অর্ডার করবেন?</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Account Info / UUID Checker & Payment Options */}
        <div className="flex flex-col gap-6">
          {/* Step 2: Account Info & UUID Checker */}
          <div className="bg-white dark:bg-[#120b22] rounded-2xl shadow-xs border border-slate-100 dark:border-purple-950/60 overflow-hidden">
            <div className="bg-slate-50 dark:bg-[#18112e] border-b border-slate-100 dark:border-purple-950/60 p-4 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#663cbc] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                2
              </div>
              <h2 className="font-bold text-[#0b132b] dark:text-white text-sm sm:text-base">
                Account Info
              </h2>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-3">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                এখানে গেমের আইডি কোড দিন (Player UUID)
              </label>
              <input
                type="text"
                value={playerUid}
                onChange={(e) => {
                  setPlayerUid(e.target.value);
                  if (checkResult?.uid !== e.target.value) {
                    setCheckResult(null);
                  }
                }}
                placeholder="এখানে গেমের আইডি কোড দিন"
                className="w-full border border-blue-200 dark:border-purple-950/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#663cbc] focus:ring-1 focus:ring-[#663cbc] bg-white dark:bg-[#150a2b] transition-all font-mono"
              />

              <button
                type="button"
                onClick={handleRunUidCheck}
                disabled={isCheckingUid || !playerUid.trim()}
                className={`w-full font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  checkResult?.valid
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-[#663cbc] hover:bg-purple-700 text-white"
                }`}
              >
                {isCheckingUid ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> চেকিং হচ্ছে...
                  </>
                ) : checkResult?.valid ? (
                  <>
                    <CheckCircle2 size={14} /> প্লেয়ার আইডি ভেরিফাইড ({checkResult.player_name})
                  </>
                ) : (
                  "আপনার গেম আইডির নাম চেক করুন"
                )}
              </button>

              {/* Resolved Player UUID Info Card */}
              {checkResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs border animate-in fade-in duration-200 mt-1 ${
                    checkResult.valid
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200"
                      : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/80 text-red-900 dark:text-red-200"
                  }`}
                >
                  {checkResult.valid ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold">
                          <UserCheck size={15} className="text-emerald-600 dark:text-emerald-400" />
                          <span>Player In-Game Name:</span>
                        </div>
                        <span className="font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-xs font-mono">
                          {checkResult.player_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>Server / Region:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {checkResult.region}
                        </span>
                      </div>
                      {checkResult.level && (
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                          <span>Player Level:</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            Level {checkResult.level}
                          </span>
                        </div>
                      )}
                      {checkResult.guild_name && (
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                          <span>Guild:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {checkResult.guild_name}
                          </span>
                        </div>
                      )}
                      {checkResult.likes && (
                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                          <span>Likes:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            ❤️ {checkResult.likes.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>UUID:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {checkResult.uid}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={15} className="text-red-500 shrink-0" />
                      <span>{checkResult.error || "Player UUID invalid."}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Select one option (Payment Options) */}
          <div className="bg-white dark:bg-[#120b22] rounded-2xl shadow-xs border border-slate-100 dark:border-purple-950/60 overflow-hidden">
            <div className="bg-slate-50 dark:bg-[#18112e] border-b border-slate-100 dark:border-purple-950/60 p-4 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#663cbc] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                3
              </div>
              <h2 className="font-bold text-[#0b132b] dark:text-white text-sm sm:text-base">
                Select one option
              </h2>
            </div>
            <div className="p-4 sm:p-5">
              {/* Payment Option Cards */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* 1. Wallet Pay */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentType("WALLET")}
                  className={`rounded-xl overflow-hidden relative group cursor-pointer transition-all ${
                    selectedPaymentType === "WALLET"
                      ? "border border-red-500 bg-white dark:bg-[#150a2b] shadow-[0_0_0_1px_rgba(239,68,68,1)]"
                      : "border border-slate-200 dark:border-purple-950/60 bg-white dark:bg-[#150a2b] opacity-70 hover:opacity-100"
                  }`}
                >
                  {selectedPaymentType === "WALLET" && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-br-lg z-10">
                      <Check size={13} strokeWidth={4} />
                    </div>
                  )}
                  <div className="h-14 flex items-center justify-center bg-white dark:bg-[#150a2b] p-2">
                    <img
                      src={siteSettings["wallet_pay_image"] || "/FF/p1.png"} referrerPolicy="no-referrer"
                      alt="Wallet Pay"
                      className="h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="bg-slate-100 dark:bg-[#1c1236] border-t border-slate-200 dark:border-purple-950/60 text-[10px] font-bold text-left px-2 py-1.5 text-slate-600 dark:text-slate-300 flex justify-between items-center">
                    <span>Wallet Pay</span>
                    {isAuthenticated && (
                      <span className="text-purple-600 dark:text-purple-400 font-extrabold">
                        ৳{profile?.balance || 0}
                      </span>
                    )}
                  </div>
                </button>

                {/* 2. Instant Pay */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentType("INSTANT")}
                  className={`rounded-xl overflow-hidden relative group cursor-pointer transition-all ${
                    selectedPaymentType === "INSTANT"
                      ? "border border-red-500 bg-white dark:bg-[#150a2b] shadow-[0_0_0_1px_rgba(239,68,68,1)]"
                      : "border border-slate-200 dark:border-purple-950/60 bg-white dark:bg-[#150a2b] opacity-70 hover:opacity-100"
                  }`}
                >
                  {selectedPaymentType === "INSTANT" && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-br-lg z-10">
                      <Check size={13} strokeWidth={4} />
                    </div>
                  )}
                  <div className="h-14 flex items-center justify-center bg-white dark:bg-[#150a2b] p-2">
                    <img
                      src={siteSettings["instant_pay_image"] || "/FF/p2.png"} referrerPolicy="no-referrer"
                      alt="Instant Pay"
                      className="h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="bg-slate-100 dark:bg-[#1c1236] border-t border-slate-200 dark:border-purple-950/60 text-[10px] font-bold text-left px-2 py-1.5 text-slate-600 dark:text-slate-300">
                    Instant Pay (bKash/Nagad)
                  </div>
                </button>
              </div>

              {/* Requirement & Status Info */}
              <div className="flex flex-col gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-5 font-medium">
                <p className="flex items-center gap-1.5">
                  <Info size={14} className="text-purple-600 shrink-0" />
                  <span>
                    প্রোডাক্ট কিনতে আপনার প্রয়োজন{" "}
                    <strong className="text-slate-900 dark:text-white font-black">
                      {currentPrice}
                    </strong>{" "}
                    টাকা।
                  </span>
                </p>

                {!isAuthenticated ? (
                  <p className="flex items-center gap-1.5 text-orange-500 font-bold">
                    <Info size={14} className="shrink-0" />
                    <span>Please Login To Purchase</span>
                  </p>
                ) : selectedPaymentType === "WALLET" ? (
                  <p className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
                    <Wallet size={14} className="shrink-0" />
                    <span>
                      বর্তমান ওয়ালেট ব্যালেন্স: ৳{currentBalance}
                      {!hasSufficientWalletBalance && (
                        <span className="text-red-500 ml-1">
                          (আরও ৳{currentPrice - currentBalance} প্রয়োজন)
                        </span>
                      )}
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CreditCard size={14} className="shrink-0" />
                    <span>bKash / Nagad গেটওয়ে দিয়ে সরাসরি পেমেন্ট করুন</span>
                  </p>
                )}
              </div>

              {/* Action Button */}
              {!isAuthenticated ? (
                <Link
                  href="/login"
                  className="w-full bg-[#663cbc] hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center"
                >
                  Login to Purchase
                </Link>
              ) : selectedPaymentType === "WALLET" && !hasSufficientWalletBalance ? (
                <button
                  type="button"
                  onClick={() => setShowAddMoney(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  + Add Money to Wallet (৳{currentPrice - currentBalance} Short)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={isSubmitting || !selectedProduct}
                  className="w-full bg-[#663cbc] hover:bg-purple-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> প্রসেসিং হচ্ছে...
                    </>
                  ) : (
                    <>
                      {selectedPaymentType === "WALLET" ? "Buy with Wallet" : "Buy Now"} (৳
                      {currentPrice})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Rules & Conditions */}
      <div className="mt-2 bg-white dark:bg-[#120b22] rounded-2xl shadow-xs border border-slate-100 dark:border-purple-950/60 overflow-hidden">
        <div className="bg-slate-50 dark:bg-[#18112e] border-b border-slate-100 dark:border-purple-950/60 p-4 flex items-center gap-2.5">
          <div className="text-[#663cbc]">
            <FileText size={18} />
          </div>
          <h2 className="font-bold text-[#0b132b] dark:text-white text-xs sm:text-sm">
            Rules &amp; Conditions
          </h2>
        </div>
        <div className="p-5 sm:p-6">
          <ul className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            <li className="flex items-start gap-2.5">
              <span className="text-purple-600 font-bold mt-0.5 text-xs">◉</span>
              <span>শুধুমাত্র Bangladesh সার্ভারে ID Code দিয়ে টপ আপ হবে</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-purple-600 font-bold mt-0.5 text-xs">◉</span>
              <span>Player ID ভুল দিয়ে Diamond না পেলে Offer TopUp / XoXo Shop কর্তৃপক্ষ দায়ী নয়</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-purple-600 font-bold mt-0.5 text-xs">◉</span>
              <span>Order কমপ্লিট হওয়ার পরেও আইডিতে ডায়মন্ড না গেলে চেক করার জন্য ID Pass দিতে হবে</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-purple-600 font-bold mt-0.5 text-xs">◉</span>
              <span>
                অর্ডার Cancel হলে কি কারণে তা Cancel হয়েছে তা অর্ডার হিস্টোরিতে দেওয়া থাকে অনুগ্রহ পূর্বক দেখে পুনরায়
                সঠিক তথ্য দিয়ে অর্ডার করবেন।
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={showAddMoney}
        onClose={() => setShowAddMoney(false)}
        onSuccess={() => {
          setShowAddMoney(false);
          void refreshProfile();
        }}
      />
    </div>
  );
}
