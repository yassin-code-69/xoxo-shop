"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Order } from "../../../lib/api/types";
import { getMyOrders } from "../../../lib/api/endpoints";
import { useAuth } from "../../../lib/auth/AuthContext";

export default function MyOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async (pageNum: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMyOrders(pageNum, 20);
      setOrders(res.items);
      setTotalPages(res.total_pages || 1);
      setPage(res.page);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        loadOrders(1);
      }
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 sm:gap-6 py-3 sm:py-6 px-2.5 sm:px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white">
            My Orders
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
            Track and view your Free Fire diamond top-up history
          </p>
        </div>
        <Link
          href="/uid-topup"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
        >
          <ShoppingBag size={13} /> Top Up Now
        </Link>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
            <ShoppingBag size={24} />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">No Orders Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            You haven&apos;t placed any top-up orders yet. Choose a package and get diamonds
            delivered instantly!
          </p>
          <Link
            href="/uid-topup"
            className="mt-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all"
          >
            Browse Diamond Packs
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map((o) => {
              const isCompleted = o.order_status === "COMPLETED";
              const isSubmitted =
                o.payment_status === "SUBMITTED" || o.payment_status === "VERIFIED";

              return (
                <Link
                  key={o.id}
                  href={`/payment/${o.public_order_id}`}
                  className="p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group block"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isCompleted
                          ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                          : isSubmitted
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400 truncate">
                          {o.public_order_id}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 shrink-0">
                          • {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm mt-0.5 truncate">
                        {o.product_name}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                        Player UID: <span className="font-mono font-semibold">{o.player_uid}</span>{" "}
                        • Method: {o.payment_method_code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto pl-11 sm:pl-0 shrink-0">
                    <span className="font-black text-xs sm:text-base text-slate-900 dark:text-white">
                      ৳ {o.total_amount}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${
                        isCompleted
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : o.order_status === "PAYMENT_SUBMITTED"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : o.order_status === "PAYMENT_VERIFIED"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {o.order_status.replace(/_/g, " ")}
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-slate-400 group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={page <= 1}
                onClick={() => loadOrders(page - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => loadOrders(page + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
