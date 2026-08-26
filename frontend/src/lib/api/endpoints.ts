import { api } from "./client";
import {
  Product,
  ProductAdmin,
  PaymentMethod,
  PaymentMethodAdmin,
  Order,
  OrderAdmin,
  Payment,
  PaymentAdmin,
  Profile,
  CustomerAdmin,
  Banner,
  DashboardMetrics,
  AuditLog,
  PaginatedResponse,
  OrderCreatePayload,
  ManualPaymentPayload,
  ProviderOrder,
  OrderPublicFeedItem,
  GatewayInitiateResponse,
  WalletDeposit,
  WalletTransaction,
  UidCheckerConfig,
  CreateUidCheckerConfigInput,
} from "./types";
import { supabase, isSupabaseConfigured } from "../auth/supabase";

// Public & Catalog APIs
export const getProducts = (category?: string) => {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  return api.get<Product[]>(`/products${query}`);
};

export const getProduct = (idOrSlug: string) => api.get<Product>(`/products/${idOrSlug}`);

export const getPaymentMethods = () => api.get<PaymentMethod[]>("/payment-methods");

export const getBanners = () => api.get<Banner[]>("/banners");

export const getSiteSettings = () => api.get<Record<string, string>>("/settings");

export const getPublicOrderFeed = (limit: number = 8) =>
  api.get<OrderPublicFeedItem[]>(`/orders/feed/recent?limit=${limit}`);

// Order & Payment APIs
export const createOrder = (data: OrderCreatePayload) => api.post<Order>("/orders", data);

export const getOrder = (publicOrderId: string) => api.get<Order>(`/orders/${publicOrderId}`);

export const submitManualPayment = (publicOrderId: string, data: ManualPaymentPayload) =>
  api.post<Payment>(`/orders/${publicOrderId}/manual-payment`, data);

export const initiateGatewayPayment = (
  publicOrderId: string,
  gateway: "BKASH" | "NAGAD" | string,
) => api.post<GatewayInitiateResponse>(`/payments/${publicOrderId}/initiate-gateway`, { gateway });

export const getMyOrders = (page: number = 1, pageSize: number = 20) =>
  api.get<PaginatedResponse<Order>>(`/me/orders?page=${page}&page_size=${pageSize}`);

// Profile & Auth
export const getMyProfile = () => api.get<Profile>("/me/profile");

export const updateMyProfile = (data: {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}) => api.patch<Profile>("/me/profile", data);

export const syncProfile = (data: { email?: string; full_name?: string; avatar_url?: string }) =>
  api.post<Profile>("/auth/sync", data);

export const loginWithBackend = (data: { email: string; password: string }) =>
  api.post<{ access_token: string; token_type: string; user: Profile }>("/auth/login", data);

export const registerWithBackend = (data: {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}) => api.post<{ access_token: string; token_type: string; user: Profile }>("/auth/register", data);

export const getMockToken = (email: string, fullName: string, role: string = "CUSTOMER") =>
  api.post<{ access_token: string; user: unknown }>("/auth/mock-token", {
    email,
    full_name: fullName,
    role,
  });

// Admin APIs
export const getAdminDashboard = () => api.get<DashboardMetrics>("/admin/dashboard");

export const getAdminOrders = (params?: {
  page?: number;
  pageSize?: number;
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  search?: string;
}) => {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", params.page.toString());
  if (params?.pageSize) sp.set("page_size", params.pageSize.toString());
  if (params?.orderStatus && params.orderStatus !== "ALL")
    sp.set("order_status", params.orderStatus);
  if (params?.paymentStatus && params.paymentStatus !== "ALL")
    sp.set("payment_status", params.paymentStatus);
  if (params?.fulfillmentStatus && params.fulfillmentStatus !== "ALL")
    sp.set("fulfillment_status", params.fulfillmentStatus);
  if (params?.search) sp.set("search", params.search);
  return api.get<PaginatedResponse<OrderAdmin>>(`/admin/orders?${sp.toString()}`);
};

export const getAdminOrder = (publicOrderId: string) =>
  api.get<OrderAdmin>(`/admin/orders/${publicOrderId}`);

export const retryAdminOrderFulfillment = (publicOrderId: string, reason?: string) =>
  api.post<ProviderOrder>(`/admin/orders/${publicOrderId}/retry-fulfillment`, { reason });

export const cancelAdminOrder = (publicOrderId: string) =>
  api.post<OrderAdmin>(`/admin/orders/${publicOrderId}/cancel`, {});

export const getAdminPayments = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  method?: string;
  search?: string;
}) => {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", params.page.toString());
  if (params?.pageSize) sp.set("page_size", params.pageSize.toString());
  if (params?.status && params.status !== "ALL") sp.set("status", params.status);
  if (params?.method && params.method !== "ALL") sp.set("method", params.method);
  if (params?.search) sp.set("search", params.search);
  return api.get<PaginatedResponse<PaymentAdmin>>(`/admin/payments?${sp.toString()}`);
};

export const approveAdminPayment = (paymentId: string, notes?: string) =>
  api.post<PaymentAdmin>(`/admin/payments/${paymentId}/approve`, { notes });

export const rejectAdminPayment = (paymentId: string, reason: string) =>
  api.post<PaymentAdmin>(`/admin/payments/${paymentId}/reject`, { reason });

export const getAdminProducts = () => api.get<ProductAdmin[]>("/admin/products");

export const createAdminProduct = (data: Partial<ProductAdmin>) =>
  api.post<ProductAdmin>("/admin/products", data);

export const updateAdminProduct = (id: string, data: Partial<ProductAdmin>) =>
  api.patch<ProductAdmin>(`/admin/products/${id}`, data);

export const deleteAdminProduct = (id: string) =>
  api.delete<{ status: string }>(`/admin/products/${id}`);

export const getAdminPaymentMethods = () => api.get<PaymentMethodAdmin[]>("/admin/payment-methods");

export const updateAdminPaymentMethod = (id: string, data: Partial<PaymentMethodAdmin>) =>
  api.patch<PaymentMethodAdmin>(`/admin/payment-methods/${id}`, data);

export const getAdminCustomers = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}) => {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", params.page.toString());
  if (params?.pageSize) sp.set("page_size", params.pageSize.toString());
  if (params?.search) sp.set("search", params.search);
  return api.get<PaginatedResponse<CustomerAdmin>>(`/admin/customers?${sp.toString()}`);
};

export const updateAdminCustomer = (
  userId: string,
  data: {
    full_name?: string;
    phone?: string;
    status?: string;
    is_active?: boolean;
    roles?: string[];
  },
) => api.patch<CustomerAdmin>(`/admin/customers/${userId}`, data);

export const createAdminCustomer = (data: {
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  status?: string;
}) => api.post<CustomerAdmin>("/admin/customers", data);

export const deleteAdminCustomer = (userId: string) =>
  api.delete<{ success: boolean; message: string }>(`/admin/customers/${userId}`);

export const getAdminBanners = () => api.get<Banner[]>("/admin/banners");

export const createAdminBanner = (data: Partial<Banner>) =>
  api.post<Banner>("/admin/banners", data);

export const updateAdminBanner = (id: string, data: Partial<Banner>) =>
  api.patch<Banner>(`/admin/banners/${id}`, data);

export const deleteAdminBanner = (id: string) =>
  api.delete<{ status: string }>(`/admin/banners/${id}`);

export const getAdminSettings = () =>
  api.get<{ key: string; value: string; is_public: boolean; description?: string }[]>(
    "/admin/settings",
  );

export const updateAdminSettings = (settings: Record<string, string>) =>
  api.patch<Record<string, string>>("/admin/settings", { settings });

export const getAdminAuditLogs = (params?: {
  page?: number;
  pageSize?: number;
  action?: string;
}) => {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", params.page.toString());
  if (params?.pageSize) sp.set("page_size", params.pageSize.toString());
  if (params?.action && params.action !== "ALL") sp.set("action", params.action);
  return api.get<PaginatedResponse<AuditLog>>(`/admin/audit-logs?${sp.toString()}`);
};

export const getAdminAnalytics = (timeframe: string = "1W") =>
  api.get<import("./types").DashboardAnalyticsResponse>(
    `/admin/dashboard/analytics?timeframe=${encodeURIComponent(timeframe)}`,
  );

export const getAdminProviderStatus = () =>
  api.get<import("./types").ProviderStatusResponse>("/admin/providers");

export const testExternalDiamondApi = (apiUrl: string, apiKey?: string) =>
  api.post<import("./types").TestExternalApiResponse>("/admin/providers/test-external-api", {
    api_url: apiUrl,
    api_key: apiKey,
  });

export const syncExternalDiamondProducts = (apiUrl?: string, apiKey?: string) =>
  api.post<import("./types").SyncExternalProductsResponse>(
    "/admin/providers/sync-external-products",
    {
      api_url: apiUrl,
      api_key: apiKey,
    },
  );

export const submitContactMessage = (data: {
  name: string;
  email: string;
  order_id?: string;
  message: string;
}) => api.post<import("./types").ContactMessage>("/contact", data);

export const getAdminContactMessages = (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}) => {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", params.page.toString());
  if (params?.pageSize) sp.set("page_size", params.pageSize.toString());
  if (params?.status && params.status !== "ALL") sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);
  return api.get<PaginatedResponse<import("./types").ContactMessage>>(
    `/admin/contact-messages?${sp.toString()}`,
  );
};

export const updateAdminContactMessage = (
  id: string,
  data: { status?: string; reply_notes?: string },
) => api.patch<import("./types").ContactMessage>(`/admin/contact-messages/${id}`, data);

export const deleteAdminContactMessage = (id: string) =>
  api.delete<{ success: boolean; message: string }>(`/admin/contact-messages/${id}`);

// Wallet & Deposit APIs
export const submitWalletDeposit = async (data: {
  amount: number;
  payment_method: string;
  sender_number: string;
  transaction_id: string;
}) => {
  if (isSupabaseConfigured) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", userData.user.id)
          .single();

        if (prof) {
          const { data: deposit, error } = await supabase
            .from("wallet_deposits")
            .insert({
              user_id: prof.id,
              amount: data.amount,
              payment_method: data.payment_method,
              sender_number: data.sender_number,
              transaction_id: data.transaction_id,
              status: "PENDING",
            })
            .select()
            .single();

          if (error) throw error;
          return deposit as WalletDeposit;
        }
      }
    } catch (e) {
      console.warn("Direct Supabase deposit insert failed, falling back to REST:", e);
    }
  }
  return api.post<WalletDeposit>("/wallet/deposit", data);
};

export const getMyWalletDeposits = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", userData.user.id)
          .single();

        if (prof) {
          const { data: deposits, error } = await supabase
            .from("wallet_deposits")
            .select("*")
            .eq("user_id", prof.id)
            .order("created_at", { ascending: false });

          if (!error && deposits) {
            return deposits as WalletDeposit[];
          }
        }
      }
    } catch (e) {
      console.warn("Direct Supabase deposits fetch failed:", e);
    }
  }
  return api.get<WalletDeposit[]>("/wallet/deposits");
};

export const getMyWalletTransactions = async () => {
  if (isSupabaseConfigured) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", userData.user.id)
          .single();

        if (prof) {
          const { data: txs, error } = await supabase
            .from("wallet_transactions")
            .select("*")
            .eq("user_id", prof.id)
            .order("created_at", { ascending: false });

          if (!error && txs) {
            return txs as WalletTransaction[];
          }
        }
      }
    } catch (e) {
      console.warn("Direct Supabase transactions fetch failed:", e);
    }
  }
  return api.get<WalletTransaction[]>("/wallet/transactions");
};

export const getAdminWalletDeposits = async (params?: { status?: string; search?: string }) => {
  if (isSupabaseConfigured) {
    try {
      let q = supabase
        .from("wallet_deposits")
        .select("*, profile:profiles(email, full_name, phone)")
        .order("created_at", { ascending: false });

      if (params?.status && params.status !== "ALL") {
        q = q.eq("status", params.status);
      }
      const { data: deposits, error } = await q;
      if (!error && deposits) {
        return deposits;
      }
    } catch (e) {
      console.warn("Direct Supabase admin deposits query failed:", e);
    }
  }
  const sp = new URLSearchParams();
  if (params?.status && params.status !== "ALL") sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);
  return api.get<WalletDeposit[]>(`/admin/wallet/deposits?${sp.toString()}`);
};

export const approveWalletDeposit = async (depositId: string, adminNotes?: string) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc("approve_wallet_deposit", {
        p_deposit_id: depositId,
        p_admin_notes: adminNotes || null,
      });
      if (!error && data?.success) {
        return data;
      }
      if (error) throw error;
    } catch (e) {
      console.warn("Direct Supabase approve_wallet_deposit RPC failed, trying REST:", e);
    }
  }
  return api.post<{ success: boolean }>(`/admin/wallet/deposits/${depositId}/approve`, {
    admin_notes: adminNotes,
  });
};

export const rejectWalletDeposit = async (depositId: string, reason: string) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc("reject_wallet_deposit", {
        p_deposit_id: depositId,
        p_reason: reason,
      });
      if (!error && data?.success) {
        return data;
      }
      if (error) throw error;
    } catch (e) {
      console.warn("Direct Supabase reject_wallet_deposit RPC failed, trying REST:", e);
    }
  }
  return api.post<{ success: boolean }>(`/admin/wallet/deposits/${depositId}/reject`, {
    reason,
  });
};

export const payOrderWithWallet = async (publicOrderId: string) => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc("pay_order_with_wallet", {
        p_public_order_id: publicOrderId,
      });
      if (!error && data?.success) {
        return data;
      }
      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || "Wallet payment failed.");
      }
    } catch (e: any) {
      console.warn("Direct Supabase pay_order_with_wallet failed, trying REST:", e);
      if (e.message && !e.message.includes("Could not find stored procedure")) {
        throw e;
      }
    }
  }
  return api.post<{ success: boolean; order_id: string }>(
    `/orders/${publicOrderId}/pay-with-wallet`,
    {},
  );
};

// ==========================================
// Admin UID / UUID Checker API Configuration
// ==========================================

export const getUidCheckerConfigs = async (): Promise<UidCheckerConfig[]> => {
  try {
    const res = await fetch("/api/uid-checker/configs", {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to fetch UID checker configs");
    }
    return (await res.json()) as UidCheckerConfig[];
  } catch (err: unknown) {
    console.error("Failed to fetch uid_checker_configs:", err);
    throw err;
  }
};

export const createUidCheckerConfig = async (
  input: CreateUidCheckerConfigInput,
): Promise<UidCheckerConfig> => {
  const res = await fetch("/api/uid-checker/configs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to save API configuration.");
  }
  return data as UidCheckerConfig;
};

export const updateUidCheckerConfig = async (
  id: string,
  input: Partial<CreateUidCheckerConfigInput>,
): Promise<UidCheckerConfig> => {
  const res = await fetch("/api/uid-checker/configs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...input }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to update API configuration.");
  }
  return data as UidCheckerConfig;
};

export const deleteUidCheckerConfig = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/uid-checker/configs?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to delete API configuration.");
  }
  return { success: true };
};

export const setPrimaryUidCheckerConfig = async (id: string): Promise<{ success: boolean }> => {
  const res = await fetch("/api/uid-checker/configs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, is_primary: true, is_active: true }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error || "Failed to set primary API configuration.");
  }
  return { success: true };
};
