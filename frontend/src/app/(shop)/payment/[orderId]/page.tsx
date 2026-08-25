"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowLeft,
  Loader2,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { Order, PaymentMethod } from "../../../../lib/api/types";
import {
  getOrder,
  submitManualPayment,
  getPaymentMethods,
  initiateGatewayPayment,
  payOrderWithWallet,
} from "../../../../lib/api/endpoints";
import { supabase, isSupabaseConfigured } from "../../../../lib/auth/supabase";
import { useAuth } from "../../../../lib/auth/AuthContext";
import { AddMoneyModal } from "../../../../components/AddMoneyModal";

function PaymentContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId as string;

  const urlStatus = searchParams.get("status");
  const urlTrxId = searchParams.get("trx_id");
  const urlGateway = searchParams.get("gateway");
  const urlError = searchParams.get("error");

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [isUserInputDirty, setIsUserInputDirty] = useState(false);
  const isUserInputDirtyRef = useRef(false);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitiatingGateway, setIsInitiatingGateway] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(urlError || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(true);
  const [selectedManualCode, setSelectedManualCode] = useState<string>("BKASH");
  const [isPayingWithWallet, setIsPayingWithWallet] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);

  const { profile, refreshProfile, isAuthenticated } = useAuth();

  const handlePayWithWallet = async () => {
    if (!order) return;
    setIsPayingWithWallet(true);
    setError(null);
    try {
      await payOrderWithWallet(order.public_order_id);
      setSuccessMessage(
        "Paid successfully using wallet balance! Diamonds are being sent to your account.",
      );
      await Promise.all([fetchOrderData(false), refreshProfile()]);
    } catch (err: any) {
      setError(
        err.message || "Failed to pay with wallet. Please ensure you have sufficient balance.",
      );
    } finally {
      setIsPayingWithWallet(false);
    }
  };

  const fetchOrderData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [orderData, methods] = await Promise.all([getOrder(orderId), getPaymentMethods()]);
      setOrder(orderData);
      setPaymentMethods(methods);
      if (orderData.payment_method_code && ["BKASH", "NAGAD", "ROCKET"].includes(orderData.payment_method_code)) {
        setSelectedManualCode(orderData.payment_method_code);
      }
      if (!isUserInputDirtyRef.current) {
        if (orderData.payment_transaction_id) {
          setTransactionId(orderData.payment_transaction_id);
        }
        if (orderData.payment_sender_number) {
          setSenderNumber(orderData.payment_sender_number);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order information.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrderData(true);
  }, [orderId]);

  // Supabase Realtime Channel Subscription for zero-polling instant checkout updates
  useEffect(() => {
    if (!order?.id || !orderId || !isSupabaseConfigured) return;

    const channelName = "order-status-" + orderId;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `public_order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const updated = payload.new as Partial<Order>;
            setOrder((prev) => (prev ? { ...prev, ...updated } : null));
            if (!isUserInputDirtyRef.current) {
              if (updated.payment_transaction_id) {
                setTransactionId(updated.payment_transaction_id);
              }
              if (updated.payment_sender_number) {
                setSenderNumber(updated.payment_sender_number);
              }
            }
          }
          fetchOrderData(false);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `order_id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const newPayment = payload.new as any;
            setOrder((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                payment_status: newPayment.status || prev.payment_status,
                payment_transaction_id: newPayment.transaction_id || prev.payment_transaction_id,
                payment_sender_number: newPayment.sender_number || prev.payment_sender_number,
              };
            });
            if (!isUserInputDirtyRef.current) {
              if (newPayment.transaction_id) {
                setTransactionId(newPayment.transaction_id);
              }
              if (newPayment.sender_number) {
                setSenderNumber(newPayment.sender_number);
              }
            }
          }
          fetchOrderData(false);
        },
      )
      .subscribe();

    // Free-tier safety: Unsubscribe and clean up channel on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id, orderId]);

  // Set initial status messages from URL redirect
  useEffect(() => {
    if (urlStatus === "success") {
      setSuccessMessage(
        `Payment successful via ${urlGateway || "Gateway"}! Your transaction ID is ${urlTrxId || "confirmed"}. Top-up is being processed.`,
      );
    } else if (urlStatus === "cancelled") {
      setError("Payment checkout was cancelled. You can retry anytime below.");
    } else if (urlStatus === "failed") {
      setError(urlError || "Payment transaction could not be completed. Please try again.");
    }
  }, [urlStatus, urlTrxId, urlGateway, urlError]);

  // Gentle low-frequency fallback check (every 8-10s) if Realtime is unavailable or not connected
  useEffect(() => {
    const isPending =
      order?.payment_status === "PENDING" ||
      order?.payment_status === "SUBMITTED" ||
      order?.order_status === "PENDING_PAYMENT" ||
      order?.order_status === "PAYMENT_SUBMITTED" ||
      order?.order_status === "PAYMENT_VERIFIED" ||
      order?.order_status === "PROCESSING" ||
      order?.fulfillment_status === "QUEUED" ||
      order?.fulfillment_status === "PROCESSING";

    if (!isPending) return;

    // Gentle 9s interval fallback
    const intervalId = setInterval(() => {
      fetchOrderData(false);
    }, 9000);

    return () => clearInterval(intervalId);
  }, [order?.payment_status, order?.order_status, order?.fulfillment_status]);

  const activeMethod =
    paymentMethods.find((m) => m.code === order?.payment_method_code) || paymentMethods[0];

  const handleCopyNumber = () => {
    if (!activeMethod?.account_number) return;
    navigator.clipboard.writeText(activeMethod.account_number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyAmount = () => {
    if (!order?.total_amount) return;
    navigator.clipboard.writeText(order.total_amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // 1-Click Automated Gateway Checkout
  const handleInitiateGateway = async (gateway: "BKASH" | "NAGAD") => {
    if (!order) return;
    setIsInitiatingGateway(gateway);
    setError(null);

    try {
      const res = await initiateGatewayPayment(order.public_order_id, gateway);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        throw new Error("No redirect URL returned from gateway.");
      }
    } catch (err: any) {
      setError(
        err.message ||
          `Failed to initiate ${gateway} checkout. Please try again or use manual transfer.`,
      );
      setIsInitiatingGateway(null);
    }
  };

  // Manual Transfer Submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError("Please enter the Transaction ID (TrxID).");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await submitManualPayment(orderId, {
        transaction_id: transactionId.trim(),
        sender_number: senderNumber.trim() || undefined,
        payment_method: order?.payment_method_code,
      });
      setSuccessMessage("Payment submitted successfully! Admin will verify and top-up shortly.");
      isUserInputDirtyRef.current = false;
      setIsUserInputDirty(false);
      await fetchOrderData(false);
    } catch (err: any) {
      setError(err.message || "Could not submit payment. Please check your Transaction ID.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Loading checkout details...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
        <AlertCircle className="mx-auto text-red-500 mb-3" size={40} />
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Order Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          {error || "The requested order does not exist."}
        </p>
        <Link
          href="/"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Return to Home
        </Link>
      </div>
    );
  }

  const isCompleted = order.order_status === "COMPLETED";
  const isVerified = order.payment_status === "VERIFIED";
  const isPaymentSubmitted = order.payment_status === "SUBMITTED" || isVerified;

  return (
    <div className="flex flex-col gap-6 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/uid-topup"
          className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-purple-600 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Topup
        </Link>

        <button
          onClick={() => {
            setIsRefreshing(true);
            fetchOrderData(false);
          }}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} /> Refresh Status
        </button>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <CheckCircle2 size={36} />
          </div>
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-200">
              Order Completed
            </span>
            <h2 className="text-2xl font-black mt-1">Diamonds Delivered Successfully!</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              Your {order.product_name} have been sent to Free Fire Player ID #{order.player_uid}.
            </p>
          </div>
        </div>
      )}

      {/* Verified Banner while waiting for fulfillment */}
      {!isCompleted && isVerified && (
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles size={32} className="animate-pulse" />
          </div>
          <div className="flex flex-col text-center sm:text-left">
            <span className="text-xs font-black uppercase tracking-widest text-purple-200">
              Payment Verified
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5">Top-Up In Progress</h2>
            <p className="text-xs sm:text-sm text-purple-100 mt-1">
              Payment confirmed! Our automated system is delivering your {order.product_name} to
              Player #{order.player_uid}.
            </p>
          </div>
        </div>
      )}

      {/* Status Notifications */}
      {successMessage && !isVerified && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && !isCompleted && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Order Status Timeline Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Public Order ID
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tracking-wider">
              {order.public_order_id}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                order.order_status === "COMPLETED"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : order.order_status === "PAYMENT_SUBMITTED"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : order.order_status === "PAYMENT_VERIFIED"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}
            >
              {order.order_status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Timeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs mb-2">
              <Check size={16} />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              1. Order Created
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Authoritative</span>
          </div>

          <div
            className={`flex flex-col items-center text-center p-3 rounded-2xl ${
              isPaymentSubmitted
                ? "bg-slate-50 dark:bg-slate-800/60"
                : "bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 ${
                isPaymentSubmitted
                  ? "bg-green-500 text-white"
                  : "bg-purple-600 text-white animate-pulse"
              }`}
            >
              {isPaymentSubmitted ? <Check size={16} /> : "2"}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-white">2. Payment</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Gateway / TrxID</span>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 ${
                order.payment_status === "VERIFIED"
                  ? "bg-green-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {order.payment_status === "VERIFIED" ? <Check size={16} /> : "3"}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              3. Verification
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">Instant Check</span>
          </div>

          <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 ${
                order.fulfillment_status === "COMPLETED"
                  ? "bg-green-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {order.fulfillment_status === "COMPLETED" ? <Check size={16} /> : "4"}
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-white">4. Top-Up Sent</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Automated</span>
          </div>
        </div>
      </div>

      {/* Main Payment Section: 1-Click Gateway Checkout & Manual Fallback */}
      {!isCompleted && !isVerified && (
        <div className="space-y-6">
          {/* Automated 1-Click Gateway Section (Light Mode by default, adaptive in Dark) */}
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-8 shadow-sm sm:shadow-md border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2">
                  <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400" />
                  <span>Instant 1-Click Payment Gateways</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Pay with bKash or Nagad
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Instant automated verification. Your Free Fire diamonds will be delivered
                  immediately upon payment.
                </p>
              </div>
              <div className="text-left sm:text-right bg-purple-50/60 dark:bg-purple-950/30 sm:bg-transparent p-3 sm:p-0 rounded-2xl w-full sm:w-auto">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-purple-300 block">
                  Amount to Pay
                </span>
                <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-white font-mono">
                  ৳ {order.total_amount}
                </span>
              </div>
            </div>

            {/* Wallet Balance Payment Option */}
            {isAuthenticated && (
              <div className="bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 sm:p-5 mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-600/10 dark:bg-purple-600/30 border border-purple-300 dark:border-purple-400/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                        Your Wallet Balance
                      </span>
                      <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                        Available: ৳ {profile?.balance || 0}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-purple-200/70 mt-0.5">
                      {Number(profile?.balance || 0) >= Number(order.total_amount)
                        ? "You have enough balance to complete this order instantly!"
                        : `Need ৳ ${Number(order.total_amount) - Number(profile?.balance || 0)} more to pay with wallet.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {Number(profile?.balance || 0) >= Number(order.total_amount) ? (
                    <button
                      type="button"
                      onClick={handlePayWithWallet}
                      disabled={isPayingWithWallet}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isPayingWithWallet ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Processing...
                        </>
                      ) : (
                        <>Pay ৳ {order.total_amount} with Wallet</>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddMoneyModal(true)}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      + Add Money to Wallet
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 1-Click Gateway Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
              {/* bKash 1-Click Gateway Button */}
              <button
                type="button"
                onClick={() => handleInitiateGateway("BKASH")}
                disabled={isInitiatingGateway !== null}
                className="group relative overflow-hidden bg-gradient-to-r from-[#E2136E] to-[#C70959] hover:from-[#C70959] hover:to-[#A50648] text-white p-4 sm:p-5 rounded-2xl font-bold shadow-md hover:shadow-pink-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 text-left cursor-pointer flex flex-col justify-between min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-xs shrink-0">
                      <img src="/images/bkash.svg" alt="bKash" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-base font-black tracking-tight block">
                        Pay with bKash
                      </span>
                      <span className="text-[11px] text-pink-100 opacity-90 font-medium">
                        bKash Tokenized Checkout
                      </span>
                    </div>
                  </div>
                  {isInitiatingGateway === "BKASH" ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full text-white font-bold">
                      Instant
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-pink-100 border-t border-white/15 pt-2">
                  <span>Zero Fee • Instant Top-up</span>
                  <span className="font-bold group-hover:translate-x-1 transition-transform">
                    Pay ৳{order.total_amount} →
                  </span>
                </div>
              </button>

              {/* Nagad 1-Click Gateway Button */}
              <button
                type="button"
                onClick={() => handleInitiateGateway("NAGAD")}
                disabled={isInitiatingGateway !== null}
                className="group relative overflow-hidden bg-gradient-to-r from-[#F7941D] to-[#EE1C25] hover:from-[#E05A10] hover:to-[#D81B24] text-white p-4 sm:p-5 rounded-2xl font-bold shadow-md hover:shadow-orange-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 text-left cursor-pointer flex flex-col justify-between min-h-[110px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-xs shrink-0">
                      <img src="/images/nagad.svg" alt="Nagad" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-base font-black tracking-tight block">
                        Pay with Nagad
                      </span>
                      <span className="text-[11px] text-orange-100 opacity-90 font-medium">
                        Nagad Remote PGW Checkout
                      </span>
                    </div>
                  </div>
                  {isInitiatingGateway === "NAGAD" ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full text-white font-bold">
                      Instant
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-orange-100 border-t border-white/15 pt-2">
                  <span>Secure DFS • Instant Top-up</span>
                  <span className="font-bold group-hover:translate-x-1 transition-transform">
                    Pay ৳{order.total_amount} →
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Manual Send Money / TrxID Section (Direct & Interactive) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden transition-all">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    Manual Send Money (bKash / Nagad / Rocket)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select your payment method, send money, and submit your Transaction ID below.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Select Method & Transfer Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    1. Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { code: "BKASH", name: "bKash", logo: "/images/bkash.svg", border: "border-pink-500" },
                      { code: "NAGAD", name: "Nagad", logo: "/images/nagad.svg", border: "border-orange-500" },
                      { code: "ROCKET", name: "Rocket", logo: "/images/rocket.svg", border: "border-purple-500" },
                    ].map((m) => {
                      const isSelected = selectedManualCode === m.code;
                      return (
                        <button
                          key={m.code}
                          type="button"
                          onClick={() => setSelectedManualCode(m.code)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group ${
                            isSelected
                              ? `${m.border} bg-purple-50/80 dark:bg-purple-950/40 shadow-xs ring-2 ring-purple-500/20`
                              : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <div className="h-6 flex items-center justify-center">
                            <img src={m.logo} alt={m.name} className="h-full object-contain" />
                          </div>
                          <span className="text-[11px] font-black text-slate-900 dark:text-white">
                            {m.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Number with Copy */}
                {(() => {
                  const dbMethod = paymentMethods.find((m) => m.code === selectedManualCode);
                  const displayNum =
                    dbMethod?.account_number ||
                    (selectedManualCode === "BKASH"
                      ? "01723848471"
                      : selectedManualCode === "NAGAD"
                        ? "01800000000"
                        : "01900000000-0");
                  const displayType = dbMethod?.account_type || "Personal (Send Money)";

                  return (
                    <div className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase block">
                          {selectedManualCode} {displayType} Number
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-wider">
                          {displayNum}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(displayNum);
                          setCopiedNumber(true);
                          setTimeout(() => setCopiedNumber(false), 2000);
                        }}
                        className="bg-white dark:bg-slate-800 hover:bg-purple-100 text-purple-600 p-2 rounded-xl border border-purple-200 dark:border-purple-700 shadow-xs transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                      >
                        {copiedNumber ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedNumber ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  );
                })()}

                {/* Exact Amount with Copy */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Amount to Send
                    </span>
                    <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                      ৳ {order.total_amount}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-200 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    {copiedAmount ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedAmount ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Step By Step Guide */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-purple-600" /> কিভাবে পেমেন্ট করবেন:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                    <li>
                      আপনার {selectedManualCode} অ্যাপ থেকে উপরে দেওয়া নম্বরে <strong>৳ {order.total_amount}</strong> Send Money করুন।
                    </li>
                    <li>
                      পেমেন্ট সফল হলে এসএমএস থেকে <strong>Transaction ID (TrxID)</strong> কপি করুন।
                    </li>
                    <li>ডানপাশের ফর্মে TrxID বসিয়ে সাবমিট বাটনে ক্লিক করুন।</li>
                  </ol>
                </div>
              </div>

              {/* Right: Manual Submission Form */}
              <div className="flex flex-col justify-between pt-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    2. Submit Transaction Details
                  </h4>
                  <form onSubmit={handleSubmitPayment} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Transaction ID / TrxID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => {
                          isUserInputDirtyRef.current = true;
                          setIsUserInputDirty(true);
                          setTransactionId(e.target.value.toUpperCase());
                        }}
                        placeholder="e.g. BL92XK91M2"
                        className="w-full uppercase font-mono bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Sender Phone Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={senderNumber}
                        onChange={(e) => {
                          isUserInputDirtyRef.current = true;
                          setIsUserInputDirty(true);
                          setSenderNumber(e.target.value);
                        }}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !transactionId.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3.5 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Verifying...
                        </>
                      ) : isPaymentSubmitted ? (
                        <>
                          <RefreshCw size={14} /> Update Transaction Info
                        </>
                      ) : (
                        <>
                          <Zap size={16} /> Submit Manual TrxID
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Item Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
          Order Summary & Details
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Product</span>
            <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">
              {order.product_name}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Free Fire Player UID</span>
            <span className="font-bold text-slate-800 dark:text-white mt-0.5 block font-mono">
              {order.player_uid}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Total Amount</span>
            <span className="font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
              ৳ {order.total_amount} {order.currency}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-500 block">Payment Method</span>
            <span className="font-bold text-slate-800 dark:text-white mt-0.5 block">
              {order.payment_method_code}
            </span>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Order Reference: {order.id}</span>
          <Link
            href="/orders"
            className="font-bold text-purple-600 hover:text-purple-700 transition-colors"
          >
            View all orders →
          </Link>
        </div>
      </div>

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

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="animate-spin text-purple-600" size={36} />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading checkout...</p>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
