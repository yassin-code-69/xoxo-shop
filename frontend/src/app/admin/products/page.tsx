"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  Percent,
  TrendingUp,
  Sparkles,
  Tag,
  Star,
} from "lucide-react";
import { ProductAdmin } from "../../../lib/api/types";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../../lib/api/endpoints";
import { useDebounce } from "../../../lib/hooks/useDebounce";

const TAG_OPTIONS = [
  "",
  "Popular",
  "Fast Delivery",
  "Best Value",
  "Hot Deal",
  "Instant Delivery",
  "10% Bonus",
  "VIP Deal",
];

const CATEGORY_OPTIONS = [
  "UID Topup",
  "Weekly & Monthly",
  "Weekly Lite",
  "Level Up Pass",
  "Indo Server",
  "FF Likes",
  "Special Airdrop",
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductAdmin> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminProducts();
      setProducts(res);
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to load products." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.selling_price || !editingProduct?.provider_sku) {
      setNotification({ type: "error", text: "Please fill in all required package fields." });
      return;
    }

    setIsSaving(true);
    setNotification(null);
    try {
      if (isCreating) {
        await createAdminProduct(editingProduct);
        setNotification({ type: "success", text: "New diamond package created successfully!" });
      } else if (editingProduct.id) {
        await updateAdminProduct(editingProduct.id, editingProduct);
        setNotification({ type: "success", text: "Diamond package updated successfully!" });
      }
      setEditingProduct(null);
      setIsCreating(false);
      await loadProducts();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to save product package." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (product: ProductAdmin) => {
    try {
      await updateAdminProduct(product.id, { active: !product.active });
      await loadProducts();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to toggle status." });
    }
  };

  const handleToggleFeatured = async (product: ProductAdmin) => {
    try {
      await updateAdminProduct(product.id, { featured: !product.featured });
      await loadProducts();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to toggle featured state." });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteAdminProduct(id);
      setNotification({ type: "success", text: `Package "${name}" deleted.` });
      await loadProducts();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete package." });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesSearch =
      debouncedSearch === "" ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.provider_sku.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate live margin for modal
  const modalSellingPrice = Number(editingProduct?.selling_price || 0);
  const modalProviderCost = Number(editingProduct?.provider_cost || 0);
  const modalProfit = modalSellingPrice - modalProviderCost;
  const modalMarginPct =
    modalSellingPrice > 0 ? ((modalProfit / modalSellingPrice) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Diamond Packages Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Configure diamond amounts, customer pricing, provider SKU mappings, and live gross
            margins
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setEditingProduct({
              name: "",
              category: "UID Topup",
              tag: "",
              diamond_amount: 115,
              bonus_amount: 0,
              selling_price: 80,
              provider_cost: 68,
              provider_sku: "FF_115",
              active: true,
              featured: false,
              sort_order: products.length + 1,
            });
          }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} /> Add Diamond Package
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
            notification.type === "success"
              ? "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="uppercase text-[10px] ml-4 font-black cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              categoryFilter === "ALL"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-[#171717] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-[#222222]"
            }`}
          >
            All Packages ({products.length})
          </button>
          {CATEGORY_OPTIONS.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-[#171717] text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-[#222222]"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 md:w-64 w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search package name, SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-[#222222] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#171717] text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200/80 dark:border-[#1f1f1f]">
                <th className="p-4">Package Name</th>
                <th className="p-4">Category / Tag</th>
                <th className="p-4">Diamonds</th>
                <th className="p-4">Selling Price</th>
                <th className="p-4">Provider Cost</th>
                <th className="p-4">Gross Margin</th>
                <th className="p-4">Provider SKU</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-[#1f1f1f]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 dark:text-zinc-500">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading diamond
                    packages...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-slate-400 dark:text-zinc-500 font-medium"
                  >
                    No diamond packages match your filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profit = Number(p.selling_price) - Number(p.provider_cost);
                  const marginPct =
                    Number(p.selling_price) > 0
                      ? ((profit / Number(p.selling_price)) * 100).toFixed(1)
                      : "0.0";
                  const isDeleting = deletingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#171717]/60 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                          {p.featured && (
                            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Star size={10} className="fill-amber-500 text-amber-500" /> Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-700 dark:text-zinc-300 font-medium block">
                            {p.category}
                          </span>
                          {p.tag && (
                            <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/60 text-[10px] font-bold px-1.5 py-0.2 rounded inline-block">
                              {p.tag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
                          {p.diamond_amount} 💎
                        </span>
                        {p.bonus_amount > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1 text-[11px]">
                            (+{p.bonus_amount})
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-black text-slate-900 dark:text-white">
                        ৳ {p.selling_price}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-zinc-400 font-mono">
                        ৳ {p.provider_cost}
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span
                            className={`font-black text-[11px] ${
                              profit >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600"
                            }`}
                          >
                            ৳ {profit.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                            ({marginPct}%)
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-[#171717] px-2 py-0.5 rounded border border-slate-200 dark:border-[#262626]">
                          {p.provider_sku}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase transition-all cursor-pointer ${
                            p.active
                              ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 hover:bg-green-200"
                              : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-slate-200"
                          }`}
                        >
                          {p.active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreating(false);
                              setEditingProduct(p);
                            }}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 p-1 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            disabled={isDeleting}
                            className="text-red-500 hover:text-red-700 p-1 font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#222222] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              {isCreating ? "Create Diamond Package" : "Edit Diamond Package"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
              Enter official package details, provider SKU mapping, and target profit margins
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. 115 Diamonds UID Topup"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.category || "UID Topup"}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Marketing Tag Badge
                  </label>
                  <select
                    value={editingProduct.tag || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, tag: e.target.value || undefined })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">None</option>
                    {TAG_OPTIONS.filter(Boolean).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Selling Price (BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.selling_price || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        selling_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Provider Cost (BDT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.provider_cost || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        provider_cost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                {/* Live Margin Calculation Preview */}
                <div className="col-span-2 p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span className="font-bold text-emerald-950 dark:text-emerald-200">
                      Calculated Margin:
                    </span>
                  </div>
                  <div className="text-right">
                    <strong className="text-emerald-700 dark:text-emerald-300 text-sm">
                      ৳ {modalProfit.toFixed(2)} ({modalMarginPct}%)
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Diamond Amount *
                  </label>
                  <input
                    type="number"
                    value={editingProduct.diamond_amount || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        diamond_amount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Bonus Diamonds
                  </label>
                  <input
                    type="number"
                    value={editingProduct.bonus_amount || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        bonus_amount: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-zinc-300 mb-1">
                    Provider SKU Mapping *
                  </label>
                  <input
                    type="text"
                    value={editingProduct.provider_sku || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, provider_sku: e.target.value })
                    }
                    placeholder="e.g. FF_115"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-[#171717] border border-slate-200 dark:border-[#262626] text-slate-800 dark:text-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-slate-100 dark:border-[#1f1f1f]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.active ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, active: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    Active in Store
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured ?? false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, featured: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-500 rounded cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 dark:text-zinc-200">
                    Featured Badge
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
