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
} from "lucide-react";
import { ProductAdmin } from "../../../lib/api/types";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../../lib/api/endpoints";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductAdmin> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      setNotification({ type: "error", text: "Please fill in all required fields." });
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
      setNotification({ type: "error", text: err.message || "Failed to save product." });
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

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Diamond Packages Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure diamond amounts, official selling prices, provider SKUs, and category tags
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setEditingProduct({
              name: "",
              category: "UID Topup",
              diamond_amount: 100,
              bonus_amount: 0,
              selling_price: 70,
              provider_cost: 60,
              provider_sku: "FF_100",
              active: true,
              sort_order: products.length + 1,
            });
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} /> Add Package
        </button>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            className="uppercase text-[10px] ml-4 font-black"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-4">Package Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Diamonds</th>
                <th className="p-4">Bonus</th>
                <th className="p-4">Selling Price (BDT)</th>
                <th className="p-4">Provider SKU</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} /> Loading diamond
                    packages...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium">
                    No diamond packages configured yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 text-slate-600 font-medium">{p.category}</td>
                    <td className="p-4 font-black text-purple-600">{p.diamond_amount} 💎</td>
                    <td className="p-4 text-slate-600">
                      {p.bonus_amount > 0 ? `+${p.bonus_amount}` : "—"}
                    </td>
                    <td className="p-4 font-black text-slate-900">৳ {p.selling_price}</td>
                    <td className="p-4 font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded inline-block my-2 border border-slate-200">
                      {p.provider_sku}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase transition-all ${
                          p.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {p.active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setEditingProduct(p);
                        }}
                        className="text-purple-600 hover:text-purple-800 p-1 font-bold inline-flex items-center gap-1"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {isCreating ? "Add Diamond Package" : "Edit Diamond Package"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter official package details and provider mapping
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="e.g. 115 Diamonds"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={editingProduct.category || "UID Topup"}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="UID Topup">UID Topup</option>
                    <option value="Weekly & Monthly">Weekly & Monthly</option>
                    <option value="Weekly Lite">Weekly Lite</option>
                    <option value="Level Up Pass">Level Up Pass</option>
                    <option value="Indo Server">Indo Server</option>
                    <option value="FF Likes">FF Likes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Diamond Amount
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Provider SKU *
                  </label>
                  <input
                    type="text"
                    value={editingProduct.provider_sku || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, provider_sku: e.target.value })
                    }
                    placeholder="e.g. FF_115"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
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
