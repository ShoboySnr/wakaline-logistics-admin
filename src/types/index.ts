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

export type RiderStatus = "active" | "inactive" | "suspended";

export interface RiderSummary {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  status: RiderStatus;
  rating: number | null;
  total_deliveries: number;
  orders_count: number;
  is_online: boolean;
  photo: string | null;
  created_at: string;
}

export interface RiderGuarantor {
  index: number;
  full_name: string | null;
  dob: string | null;
  nationality: string | null;
  occupation: string | null;
  nin: string | null;
  residential_address: string | null;
  phone: string | null;
  alt_phone1: string | null;
  alt_phone2: string | null;
  work_address: string | null;
  relationship: string | null;
  years_known: number | null;
}

export interface RiderDetail extends RiderSummary {
  age: number | null;
  license_number: string | null;
  address: string | null;
  daily_code: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  last_location_update: string | null;
  share_url: string | null;
  witness: { full_name: string | null; phone: string | null; address: string | null; date: string | null };
  guarantors: RiderGuarantor[];
  pending_orders: Order[];
  files: Record<string, string | null>;
  stats: { total_orders: number; delivered_orders: number; active_orders: number };
}

export interface RiderListResponse {
  success: boolean;
  data: RiderSummary[];
  meta: PaginationMeta;
  stats: { total: number; active: number; inactive: number; suspended: number };
}

export interface RiderFormOptions {
  vehicle_types: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
}

export type BikeStatus = "active" | "maintenance" | "inactive";
export type DocumentStatus = "valid" | "expiring" | "expired" | "none";

export interface BikeDocument {
  key: string;
  label: string;
  url: string | null;
  expiry_date: string | null;
  status: DocumentStatus;
}

export interface BikeSticker {
  name: string | null;
  serial_number: string | null;
  expiry_date: string | null;
  url: string | null;
  status: string;
}

export interface BikeSummary {
  id: number;
  bike_number: string;
  plate_number: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  year: number | null;
  status: BikeStatus;
  assigned_rider: { id: number; name: string; phone: string | null } | null;
  has_expiring_documents: boolean;
  has_expired_documents: boolean;
  next_maintenance_date: string | null;
  created_at: string;
}

export interface BikeDetail extends BikeSummary {
  engine_number: string | null;
  chassis_number: string | null;
  last_maintenance_date: string | null;
  assignment_date: string | null;
  notes: string | null;
  documents: BikeDocument[];
  stickers: BikeSticker[];
}

export interface BikeListResponse {
  success: boolean;
  data: BikeSummary[];
  meta: PaginationMeta;
  stats: { total: number; active: number; maintenance: number; inactive: number; assigned: number; expiring_docs: number; expired_docs: number };
}

export interface BikeFormOptions {
  statuses: { value: string; label: string }[];
  documents: { key: string; label: string }[];
  riders: { id: number; name: string; phone: string | null }[];
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string | null;
  payment_method: string | null;
  receipt_number: string | null;
  vendor_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ExpenseStats {
  total_expenses: number;
  today_expenses: number;
  week_expenses: number;
  month_expenses: number;
  total_revenue: number;
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  total_profit: number;
  today_profit: number;
  week_profit: number;
  month_profit: number;
}

export interface ExpenseListResponse {
  success: boolean;
  data: Expense[];
  meta: PaginationMeta;
  stats: ExpenseStats;
}

export interface ExpenseFormOptions {
  categories: string[];
  payment_methods: string[];
}

export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";

export interface TransactionSummary {
  id: number;
  transaction_reference: string | null;
  payment_reference: string | null;
  type: string;
  status: TransactionStatus;
  credits: number;
  amount_paid: number | null;
  description: string | null;
  client: { id: number; name: string; company_name: string | null } | null;
  created_at: string;
}

export interface TransactionDetail extends TransactionSummary {
  payment_method: string | null;
  balance_before: number | null;
  balance_after: number | null;
  subscription_plan: string | null;
  credit_package: string | null;
  order_number: string | null;
  metadata: Record<string, unknown> | null;
  processed_by: number | null;
  updated_at: string;
}

export interface TransactionListResponse {
  success: boolean;
  data: TransactionSummary[];
  meta: PaginationMeta;
  stats: { total: number; pending: number; completed: number; failed: number; total_amount: number };
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  is_admin: boolean;
  is_self: boolean;
  created_at: string;
}

export interface UserListResponse {
  success: boolean;
  data: AdminUserRow[];
  meta: PaginationMeta;
  stats: { total: number; admins: number; staff: number };
}

export type JobApplicationStatus = "pending" | "reviewing" | "shortlisted" | "rejected" | "hired";

export interface JobApplicationGuarantor {
  index: number;
  full_name: string | null;
  phone: string | null;
  relationship: string | null;
  occupation: string | null;
  residential_address: string | null;
}

export interface JobApplicationSummary {
  id: number;
  job_type: string;
  formatted_job_type: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  age: number | null;
  experience_years: string | null;
  status: JobApplicationStatus;
  is_partner: boolean;
  created_at: string;
}

export interface JobApplicationDetail extends JobApplicationSummary {
  license_number: string | null;
  previous_work: string | null;
  availability: string | null;
  why_join: string | null;
  owns_vehicle: boolean | null;
  vehicle_type: string | null;
  vehicle_registration: string | null;
  coverage_areas: string | null;
  has_smartphone: boolean | null;
  guarantors: JobApplicationGuarantor[];
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  updated_at: string;
}

export interface JobApplicationListResponse {
  success: boolean;
  data: JobApplicationSummary[];
  meta: PaginationMeta;
  stats: { pending: number; reviewing: number; shortlisted: number; rejected: number; hired: number };
}

export interface SettingItem {
  key: string;
  value: string | number | boolean | null;
  type: string;
  description: string | null;
}

export interface SettingGroup {
  group: string;
  settings: SettingItem[];
}

export interface BatchDiscountTier {
  min: number;
  max: number | null;
  percent: number;
}

export interface SettingsData {
  groups: SettingGroup[];
  batch_discount: { enabled: boolean; tiers: BatchDiscountTier[] };
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number | null;
  is_active: boolean;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface TicketSummary {
  id: number;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
  priority: string | null;
  client: { id: number; name: string } | null;
  messages_count: number;
  unread_count: number;
  created_at: string;
}

export interface TicketMessage {
  id: number;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface TicketDetail {
  id: number;
  ticket_number: string;
  subject: string;
  status: TicketStatus;
  priority: string | null;
  client: { id: number; name: string; email: string | null } | null;
  assigned_to: number | null;
  assigned_admin: string | null;
  resolved_at: string | null;
  created_at: string;
  messages: TicketMessage[];
  admins: { id: number; name: string }[];
}

export interface TicketListResponse {
  success: boolean;
  data: TicketSummary[];
  meta: PaginationMeta;
  stats: { total: number; open: number; in_progress: number; resolved: number };
}
