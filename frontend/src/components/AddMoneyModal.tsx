"use client";

import { useState } from "react";
import {
  X,
  Check,
  Copy,
  Loader2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { submitWalletDeposit } from "../lib/api/endpoints";
import { useAuth } from "../lib/auth/AuthContext";

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  {
    code: "BKASH",
    name: "bKash",
    number: "01723848471",
    type: "Personal (Send Money)",
    color: "from-pink-600 to-rose-600",
    border: "border-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300",
    trxLength: "10 alphanumeric characters (e.g. BL92XK91M2)",
  },
  {
    code: "NAGAD",
    name: "Nagad",
    number: "01800000000",
    type: "Personal (Send Money)",
    color: "from-orange-600 to-amber-600",
    border: "border-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
    trxLength: "8 alphanumeric characters (e.g. 71A89KC2)",
  },
  {
    code: "ROCKET",
    name: "Rocket",
    number: "01900000000-0",
    type: "Personal (Send Money)",
    color: "from-purple-600 to-indigo-600",
    border: "border-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
    trxLength: "Transaction ID from SMS receipt",
  },
];

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000, 2000, 5000];

export function AddMoneyModal({ isOpen, onClose, onSuccess }: AddMoneyModalProps) {
  const { refreshProfile } = useAuth();

  const [selectedMethodCode, setSelectedMethodCode] = useState("BKASH");
  const [amount, setAmount] = useState<number | string>(100);
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    amount: number;
    method: string;
    trxId: string;
  } | null>(null);

  if (!isOpen) return null;

  const selectedMethod =
    PAYMENT_METHODS.find((m) => m.code === selectedMethodCode) || PAYMENT_METHODS[0];

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(selectedMethod.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 10) {
      setError("Please enter a valid amount (minimum ৳ 10).");
      return;
    }
    if (!senderNumber.trim() || senderNumber.trim().length < 10) {
      setError("Please enter your valid sender mobile number (01XXXXXXXXX).");
      return;
    }
    if (!trxId.trim() || trxId.trim().length < 6) {
      setError("Please enter the exact Transaction ID received after sending money.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitWalletDeposit({
        amount: numAmount,
        payment_method: selectedMethod.code,
        sender_number: senderNumber.trim(),
        transaction_id: trxId.trim().toUpperCase(),
      });

      setSuccessData({
        amount: numAmount,
        method: selectedMethod.name,
        trxId: trxId.trim().toUpperCase(),
      });

      if (onSuccess) onSuccess();
      await refreshProfile();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit deposit request. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setError(null);
    setSenderNumber("");
    setTrxId("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-neutral-800 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {successData ? (
          /* Success Screen */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-300 dark:border-emerald-700 shadow-md">
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Deposit Submitted!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Your deposit request of{" "}
              <strong className="text-emerald-600 font-black">৳ {successData.amount}</strong> via{" "}
              <strong>{successData.method}</strong> has been received and is being verified.
            </p>

            <div className="bg-slate-50 dark:bg-neutral-800/60 rounded-2xl p-4 my-5 text-left border border-slate-100 dark:border-neutral-700/60 text-xs flex flex-col gap-2">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Transaction ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {successData.trxId}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Status:</span>
                <span className="font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  PENDING VERIFICATION
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span>Estimated Time:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  1 - 5 Minutes
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Done & View Balance
            </button>
          </div>
        ) : (
          /* Deposit Form */
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Add Money to Wallet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant deposit via bKash, Nagad, or Rocket
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Payment Method Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedMethodCode === method.code;
                    return (
                      <button
                        type="button"
                        key={method.code}
                        onClick={() => setSelectedMethodCode(method.code)}
                        className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          isSelected
                            ? `${method.border} bg-purple-50/80 dark:bg-purple-950/40 shadow-sm ring-2 ring-purple-500/20`
                            : "border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {method.name}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Send Money
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Amount Input & Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deposit Amount (BDT ৳)
                </label>
                <div className="relative mb-2">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="100"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-neutral-900"
                    required
                  />
                </div>
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => setAmount(amt)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        Number(amount) === amt
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700"
                      }`}
                    >
                      +{amt}৳
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Send Money Box with 1-Click Copy */}
              <div className="bg-slate-50 dark:bg-neutral-800/70 rounded-2xl p-3.5 border border-slate-200 dark:border-neutral-700/80">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                      {selectedMethod.name} {selectedMethod.type} Number
                    </span>
                    <span className="text-base font-black text-slate-900 dark:text-white tracking-wider font-mono mt-0.5">
                      {selectedMethod.number}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={13} strokeWidth={3} /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Go to your <strong>{selectedMethod.name} app</strong> &gt; Select{" "}
                  <strong>Send Money</strong> &gt; Send exact <strong>৳ {amount || 0}</strong> to
                  the number above.
                </p>
              </div>

              {/* 4. Sender Number & TrxID Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sender Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-neutral-900 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                    placeholder="e.g. BL92XK91M2"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs font-black text-purple-700 dark:text-purple-300 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-neutral-900 font-mono uppercase"
                    required
                  />
                </div>
              </div>

              {/* 5. Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-98 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying & Submitting...
                  </>
                ) : (
                  <>
                    Confirm Deposit Request <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium text-center">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>100% Safe & Instant Automated Verification</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
