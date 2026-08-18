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
    <div className="flex flex-col gap-6 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and view your Free Fire diamond top-up history
          </p>
        </div>
        <Link
          href="/uid-topup"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <ShoppingBag size={16} /> Top Up Now
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Orders Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            You haven&apos;t placed any top-up orders yet. Choose a package and get diamonds
            delivered instantly!
          </p>
          <Link
            href="/uid-topup"
            className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-105 transition-all"
          >
            Browse Diamond Packs
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map((o) => {
              const isCompleted = o.order_status === "COMPLETED";
              const isSubmitted =
                o.payment_status === "SUBMITTED" || o.payment_status === "VERIFIED";

              return (
                <Link
                  key={o.id}
                  href={`/payment/${o.public_order_id}`}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group block"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        isCompleted
                          ? "bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400"
                          : isSubmitted
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                          {o.public_order_id}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          • {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base mt-0.5">
                        {o.product_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Player UID: <span className="font-mono font-semibold">{o.player_uid}</span>{" "}
                        • Method: {o.payment_method_code}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pl-16 sm:pl-0">
                    <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                      ৳ {o.total_amount}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
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
                      size={18}
                      className="text-slate-400 group-hover:translate-x-1 transition-transform"
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
