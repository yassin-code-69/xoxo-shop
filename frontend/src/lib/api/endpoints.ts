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
} from "./types";

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
