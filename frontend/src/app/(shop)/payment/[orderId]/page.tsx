"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowLeft,
  Loader2,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Order, PaymentMethod } from "../../../../lib/api/types";
import { getOrder, submitManualPayment, getPaymentMethods } from "../../../../lib/api/endpoints";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrderData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [orderData, methods] = await Promise.all([getOrder(orderId), getPaymentMethods()]);
      setOrder(orderData);
      setPaymentMethods(methods);
      if (orderData.payment_transaction_id) {
        setTransactionId(orderData.payment_transaction_id);
      }
      if (orderData.payment_sender_number) {
        setSenderNumber(orderData.payment_sender_number);
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

  // Smart adaptive polling while awaiting verification or fulfillment
  useEffect(() => {
    const isPending =
      order?.payment_status === "SUBMITTED" ||
      order?.fulfillment_status === "PROCESSING" ||
      order?.fulfillment_status === "QUEUED";

    if (!isPending) return;

    let delay = 4000;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      await fetchOrderData(false);
      delay = Math.min(delay + 2000, 12000);
      timeoutId = setTimeout(poll, delay);
    };

    timeoutId = setTimeout(poll, delay);
    return () => clearTimeout(timeoutId);
  }, [order?.payment_status, order?.fulfillment_status]);

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
  const isPaymentSubmitted =
    order.payment_status === "SUBMITTED" || order.payment_status === "VERIFIED";

  return (
    <div className="flex flex-col gap-6 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Top Header */}
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
          className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-all"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} /> Refresh Status
        </button>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center gap-6">
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
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              2. Submit Payment
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">TrxID / SMS</span>
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
              3. Admin Verify
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

      {/* Main Payment Details & Submission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Payment Instructions */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">
                Payment Instructions
              </h2>
              <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                {activeMethod?.name || order.payment_method_code}
              </span>
            </div>

            <div className="space-y-4">
              {/* Account Number with Copy */}
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase block">
                    {activeMethod?.name} {activeMethod?.account_type} Number
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-wider">
                    {activeMethod?.account_number || "01700000000"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="bg-white dark:bg-slate-800 hover:bg-purple-100 text-purple-600 p-2.5 rounded-xl border border-purple-200 dark:border-purple-700 shadow-sm transition-all flex items-center gap-1 text-xs font-bold"
                >
                  {copiedNumber ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedNumber ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Exact Amount with Copy */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Exact Amount to Send
                  </span>
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    ৳ {order.total_amount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAmount}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex items-center gap-1 text-xs font-bold"
                >
                  {copiedAmount ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedAmount ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Step By Step Guide */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <HelpCircle size={14} className="text-purple-600" /> How to Pay:
                </p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open your {activeMethod?.name} mobile app or dial USSD.</li>
                  <li>
                    Select <strong>Send Money</strong> option.
                  </li>
                  <li>Enter the {activeMethod?.account_type} number above.</li>
                  <li>
                    Enter amount <strong>৳ {order.total_amount}</strong> and confirm with your PIN.
                  </li>
                  <li>
                    Copy the <strong>Transaction ID (TrxID)</strong> from confirmation SMS/App.
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Player UID:{" "}
            <strong className="text-slate-700 dark:text-slate-300">{order.player_uid}</strong> •
            Item:{" "}
            <strong className="text-slate-700 dark:text-slate-300">{order.product_name}</strong>
          </div>
        </div>

        {/* Right Card: Transaction Submission Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white mb-2">
              Submit Transaction Info
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter your payment details below so our admin team can verify the transaction
              immediately.
            </p>

            {successMessage && (
              <div className="mb-5 p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-5 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Transaction ID / TrxID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                  placeholder="e.g. 9K72B8X10P"
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
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !transactionId.trim()}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Verifying...
                  </>
                ) : isPaymentSubmitted ? (
                  <>
                    <RefreshCw size={16} /> Update Transaction Info
                  </>
                ) : (
                  <>
                    <Zap size={18} /> Confirm & Submit Payment
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/orders"
              className="text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors"
            >
              View all your orders →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
