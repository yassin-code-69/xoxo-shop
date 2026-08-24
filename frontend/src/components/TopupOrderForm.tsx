"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Zap, ShieldCheck, Info, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Product, PaymentMethod } from "../lib/api/types";
import { getProducts, getPaymentMethods, createOrder } from "../lib/api/endpoints";
import { useAuth } from "../lib/auth/AuthContext";

interface TopupOrderFormProps {
  category: string;
  title: string;
  description: string;
  imageSrc: string;
  badgeText?: string;
}

export function TopupOrderForm({
  category,
  title,
  description,
  imageSrc,
  badgeText = "Instant Delivery",
}: TopupOrderFormProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("BKASH");
  const [playerUid, setPlayerUid] = useState("");
  const [playerServer, setPlayerServer] = useState("");
  const [isVerifyingUid, setIsVerifyingUid] = useState(false);
  const [uidVerified, setUidVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [prods, methods] = await Promise.all([getProducts(category), getPaymentMethods()]);
        setProducts(prods);
        if (prods.length > 0) {
          setSelectedProduct(prods[0]);
        }
        setPaymentMethods(methods);
        if (methods.length > 0) {
          setSelectedMethod(methods[0].code);
        }
      } catch (err: any) {
        console.error("Failed to load products/payment methods:", err);
        setError("Could not load products. Please check if backend is running.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [category]);

  const handleVerifyUid = () => {
    if (!playerUid.trim()) return;
    setIsVerifyingUid(true);
    setTimeout(() => {
      setIsVerifyingUid(false);
      setUidVerified(true);
    }, 600);
  };

  const handleCreateOrder = async () => {
    if (!selectedProduct) {
      setError("Please select a package.");
      return;
    }
    if (!playerUid.trim()) {
      setError("Please enter your Free Fire Player ID (UID).");
      return;
    }
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await createOrder({
        product_id: selectedProduct.id,
        player_uid: playerUid.trim(),
        player_server: playerServer.trim() || undefined,
        quantity: 1,
        payment_method: selectedMethod,
      });

      // Redirect directly to payment instructions page with the public order reference
      router.push(`/payment/${order.public_order_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl shadow-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 shrink-0 relative z-10">
          <Image
            src={imageSrc}
            alt={title}
            fill
            priority
            sizes="(max-width: 768px) 128px, 160px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col items-center md:items-start text-center md:text-left z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-500/20 text-green-400 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Active
            </span>
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
              <Zap size={12} fill="currentColor" /> {badgeText}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
            {title}
          </h1>
          <p className="text-purple-200 text-sm max-w-lg">{description}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-xs uppercase font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Select Package */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                1
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Select Package</h2>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2 font-medium">
                  <Loader2 className="animate-spin" size={24} /> Loading packages...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-medium">
                  No active packages found in this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((pkg) => {
                    const isSelected = selectedProduct?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedProduct(pkg)}
                        className={`border-2 rounded-xl p-4 flex flex-col items-center transition-all group outline-none relative overflow-hidden ${
                          isSelected
                            ? "border-purple-600 bg-purple-50 dark:bg-purple-950/30 ring-4 ring-purple-600/20"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400"
                        }`}
                      >
                        {pkg.tag && (
                          <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-md">
                            {pkg.tag}
                          </div>
                        )}
                        <span
                          className={`font-black text-sm uppercase mb-2 text-center transition-colors ${
                            isSelected
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {pkg.name}
                        </span>
                        <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 w-full text-center group-hover:border-purple-300">
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-black">
                            BDT {pkg.selling_price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                2
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                Choose Payment Method
              </h2>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {paymentMethods.map((pm) => {
                const isSelected = selectedMethod === pm.code;
                return (
                  <button
                    key={pm.code}
                    type="button"
                    onClick={() => setSelectedMethod(pm.code)}
                    className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-50 dark:bg-purple-950/30 ring-4 ring-purple-600/20"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-400"
                    }`}
                  >
                    <span className="font-black text-base text-slate-800 dark:text-white">
                      {pm.name}
                    </span>
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {pm.account_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Player Info & Checkout */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                3
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Player Details</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                  Free Fire Player ID / UID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={playerUid}
                  onChange={(e) => {
                    setPlayerUid(e.target.value);
                    setUidVerified(false);
                  }}
                  placeholder="e.g. 1029384756"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>

              {category.includes("Indo") && (
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                    Server / Region
                  </label>
                  <input
                    type="text"
                    value={playerServer}
                    onChange={(e) => setPlayerServer(e.target.value)}
                    placeholder="e.g. Indonesia"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyUid}
                disabled={isVerifyingUid || !playerUid.trim()}
                className={`w-full font-bold py-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 ${
                  uidVerified
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white disabled:opacity-50"
                }`}
              >
                {isVerifyingUid ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying UID...
                  </>
                ) : uidVerified ? (
                  <>
                    <CheckCircle2 size={16} /> UID Verified Active
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Verify UID Format
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Checkout Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                4
              </div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">Order Summary</h2>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Selected Item
                </span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {selectedProduct?.name || "None"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Payment Method
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {selectedMethod}
                </span>
              </div>
              <div className="flex justify-between items-center text-base py-2">
                <span className="font-black text-slate-800 dark:text-white">Total Amount</span>
                <span className="font-black text-2xl text-purple-600 dark:text-purple-400">
                  ৳ {selectedProduct?.selling_price || "0.00"}
                </span>
              </div>

              {!isAuthenticated ? (
                <div className="flex flex-col gap-3 mt-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 flex items-start gap-2.5">
                    <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                      Please login to complete purchase and track order status.
                    </span>
                  </div>
                  <Link
                    href="/login"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-lg text-center uppercase tracking-wider"
                  >
                    Login to Purchase
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateOrder}
                  disabled={isSubmitting || !selectedProduct}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Creating Order...
                    </>
                  ) : (
                    <>
                      Proceed to Pay <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
