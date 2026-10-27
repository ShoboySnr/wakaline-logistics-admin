export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: "admin";
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export type OrderStatus = "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";

export interface OrderStockItem {
  id: number;
  client_stock_id: number | null;
  product_name: string;
  quantity: number;
  deducted_at: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  client_id: number | null;
  rider_id: number | null;
  source: string | null;
  source_contact: string | null;
  source_notes: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  sender_email: string | null;
  pickup_address: string;
  pickup_city: string | null;
  delivery_address: string;
  delivery_city: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  item_description: string | null;
  item_size: string | null;
  weight: string | number | null;
  quantity: number | null;
  distance: string | number | null;
  price: number;
  pickup_zone: string | null;
  delivery_zone: string | null;
  status: OrderStatus;
  priority_level: string | null;
  payment_method: string | null;
  amount_received: number | null;
  to_remit: number | null;
  remitted_at: string | null;
  is_failed_delivery: boolean;
  notes: string | null;
  package_description: string | null;
  package_quantity: number | null;
  pickup_date: string | null;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
  rider?: { id: number; name: string; phone: string | null } | null;
  client?: { id: number; name: string; company_name: string | null; pod_remittance_enabled: boolean } | null;
  creator?: string | null;
  stock_items?: OrderStockItem[];
  files: Record<string, string | null>;
}

export interface OrderListStats {
  total: number;
  pending: number;
  confirmed: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  today_delivered: number;
  incoming_revenue_today: number;
  incoming_revenue_week: number;
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  meta: PaginationMeta;
  stats: OrderListStats;
}

export interface ClientOption {
  id: number;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  pickup_address: string | null;
  pod_remittance_enabled: boolean;
}

export interface StockOption {
  id: number;
  product_name: string;
  quantity: number;
}

export interface OrderFormOptions {
  clients: ClientOption[];
  riders: { id: number; name: string; phone: string | null }[];
  stock_clients: Record<string, StockOption[]>;
  remittance_clients: { id: number; name: string; company_name: string | null }[];
  statuses: OrderStatus[];
}

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  in_transit_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  today_orders: number;
  today_revenue: number;
  today_pending: number;
  today_delivered: number;
  week_orders: number;
  week_revenue: number;
  month_orders: number;
  month_revenue: number;
  total_riders: number;
  active_riders: number;
  riders_with_orders: number;
}

export interface BikeAlert {
  id: number;
  bike_number: string;
  rider: string | null;
  documents?: string[];
  days_remaining?: number;
  next_maintenance_date?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_orders: Order[];
  low_stocks: { id: number; client_id: number; client_name: string; product_name: string; quantity: number }[];
  upcoming_maintenance: BikeAlert[];
  expired_bike_docs: BikeAlert[];
  expiring_bike_docs: BikeAlert[];
}

export interface RemittanceOrder {
  id: number;
  order_number: string;
  delivery_address: string;
  date: string;
  amount_received: number;
  delivery_fee: number;
  to_remit: number;
  is_failed: boolean;
  products: { product_name: string; quantity: number }[];
}

export interface RemittanceData {
  client_name: string;
  client_id: number;
  orders: RemittanceOrder[];
  total_remittance: number;
  stocks: { product_name: string; quantity: number }[];
  bank: { bank_name: string | null; account_name: string | null; account_number: string | null };
}

export interface ClientSummary {
  id: number;
  name: string;
  company_name: string | null;
  phone: string | null;
  email: string | null;
  pickup_address: string | null;
  is_active: boolean;
  dashboard_enabled: boolean;
  api_enabled: boolean;
  pod_remittance_enabled: boolean;
  email_verified_at: string | null;
  created_at: string;
  orders_count?: number;
}

export interface ClientListResponse {
  success: boolean;
  data: ClientSummary[];
  meta: PaginationMeta;
  stats: { total: number; active: number; inactive: number; remittance: number };
}

export interface ClientStock {
  id: number;
  product_name: string;
  quantity: number;
}

export interface InvoiceableOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  price: number;
  date: string | null;
  pickup_address: string;
  delivery_address: string;
  invoiced: boolean;
}

export interface ClientDetail extends ClientSummary {
  contact_person: string | null;
  alternate_phone: string | null;
  alternate_email: string | null;
  business_address: string | null;
  city: string | null;
  state: string | null;
  business_type: string | null;
  tax_id: string | null;
  website: string | null;
  payment_terms: string | null;
  credit_limit: number | null;
  notes: string | null;
  special_instructions: string | null;
  onboarded_date: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  zone_rates: Record<string, number>;
  last_login_at: string | null;
  api_key: string | null;
  api_key_generated_at: string | null;
  api_last_used_at: string | null;
  share_url: string | null;
  stats: { total_orders: number; completed_orders: number; pending_orders: number; total_revenue: number };
  credits: { available: number; total: number; used: number };
  active_subscription: {
    id: number;
    plan_name: string | null;
    credits_allocated: number;
    credits_used: number;
    starts_at: string | null;
    expires_at: string | null;
  } | null;
  stocks: ClientStock[];
  remittance: RemittanceData | null;
  invoices: { id: number; invoice_number: string; invoice_date: string | null; orders_count: number; total: number }[];
  invoiceable_orders: InvoiceableOrder[];
  webhook: {
    id: number;
    is_active: boolean;
    url: string | null;
    last_synced_at: string | null;
    last_error: string | null;
    sync_count: number | null;
    logs: { id: number; action: string; status: string; error_message: string | null; created_at: string }[];
  } | null;
}

export interface ClientFormOptions {
  zones: { key: string; label: string }[];
  payment_terms: { value: string; label: string }[];
  subscription_plans: { id: number; name: string; credits: number; price: number; validity_days: number | null }[];
}
