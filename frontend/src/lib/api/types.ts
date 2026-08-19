export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "PAYMENT_VERIFIED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "SUBMITTED"
  | "VERIFYING"
  | "VERIFIED"
  | "REJECTED"
  | "FAILED"
  | "REFUNDED";

export type FulfillmentStatus =
  | "NOT_STARTED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING";

export type RoleCode = "CUSTOMER" | "SUPPORT" | "ADMIN" | "SUPER_ADMIN";

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Product {
  id: string;
  game_id: string;
  name: string;
  slug: string;
  category: string;
  diamond_amount: number;
  bonus_amount: number;
  selling_price: string | number;
  currency: string;
  active: boolean;
  featured: boolean;
  sort_order: number;
  tag?: string | null;
}

export interface ProductAdmin extends Product {
  provider_sku: string;
  provider_cost: string | number;
  metadata_json?: string | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: string;
  account_number: string;
  account_type: string;
  instructions: string;
  logo_url?: string | null;
  active: boolean;
  sort_order: number;
}

export interface PaymentMethodAdmin extends PaymentMethod {
  metadata_json?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  status_type: string;
  previous_status?: string | null;
  new_status: string;
  reason?: string | null;
  changed_by: string;
  created_at: string;
}

export interface ProviderOrder {
  id: string;
  order_id: string;
  provider: string;
  provider_sku: string;
  provider_order_id?: string | null;
  client_reference: string;
  status: FulfillmentStatus;
  attempt_count: number;
  last_error_code?: string | null;
  last_error_message?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  public_order_id: string;
  product_name: string;
  diamond_amount: number;
  bonus_amount: number;
  player_uid: string;
  player_server?: string | null;
  quantity: number;
  total_amount: string | number;
  currency: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  payment_method_code: string;
  payment_transaction_id?: string | null;
  payment_sender_number?: string | null;
  created_at: string;
  completed_at?: string | null;
  status_history: OrderStatusHistory[];
}

export interface OrderAdmin extends Order {
  user_id: string;
  customer_email?: string | null;
  customer_name?: string | null;
  product_sku: string;
  selling_price: string | number;
  provider_order?: ProviderOrder | null;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_type: string;
  payment_method: string;
  amount: string | number;
  currency: string;
  transaction_id?: string | null;
  sender_number?: string | null;
  status: PaymentStatus;
  submitted_at?: string | null;
}

export interface PaymentAdmin extends Payment {
  public_order_id?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  proof_path?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  status: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface CustomerAdmin {
  id: string;
  auth_user_id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  status: string;
  is_active: boolean;
  roles: string[];
  total_orders: number;
  total_spent: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  link_url?: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface DashboardMetrics {
  orders_today: number;
  revenue_today: string;
  pending_payments: number;
  processing_fulfillment: number;
  failed_fulfillment: number;
  completed_today: number;
  recent_orders: OrderAdmin[];
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  metadata_json?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

// Request Types
export interface OrderCreatePayload {
  product_id: string;
  player_uid: string;
  player_server?: string | null;
  quantity?: number;
  payment_method: string;
}

export interface ManualPaymentPayload {
  transaction_id: string;
  sender_number?: string | null;
  payment_method?: string | null;
  proof_path?: string | null;
}

export interface OrderPublicFeedItem {
  id: string;
  customer_display_name: string;
  product_name: string;
  total_amount: string | number;
  order_status: string;
  created_at: string;
}

export interface AnalyticsDataPoint {
  label: string;
  date: string;
  revenue: number;
  orders: number;
  diamonds: number;
}

export interface DistributionItem {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface AnalyticsSummary {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  success_rate: number;
  growth_rate: number;
  completed_orders: number;
  pending_orders: number;
  failed_orders: number;
  total_diamonds: number;
  days_pnl: number;
}

export interface DashboardAnalyticsResponse {
  timeframe: string;
  summary: AnalyticsSummary;
  timeseries: AnalyticsDataPoint[];
  category_distribution: DistributionItem[];
  payment_distribution: DistributionItem[];
}

export interface ProviderStatusResponse {
  provider_name: string;
  active: boolean;
  mock_mode: boolean;
  mock_outcome: string;
  base_url: string;
  timeout_seconds: number;
  diamond_api_url?: string;
  diamond_api_mode: string;
}

export interface TestExternalApiResponse {
  success: boolean;
  status_code: number;
  packages_found: number;
  sample_data: any[];
  message: string;
}

export interface SyncExternalProductsResponse {
  success: boolean;
  synced_count: number;
  message: string;
}
