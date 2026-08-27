export type OrderType = "dine_in" | "pickup" | "pre_order" | "counter";
export type OrderStatus =
  | "payment_review"
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid";

export type PaymentCollection = "upi" | "counter";

export type CancelledBy = "user" | "staff";

export type CancelRequestStatus = "pending" | "approved" | "rejected";

export interface PublicOutletInfo {
  slug: string;
  name: string;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  address_line1?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone: string | null;
  description: string | null;
  cuisine_tags: string[];
  opening_hours: Record<string, unknown> | null;
  cost_for_two?: number | null;
  is_pure_veg?: boolean;
  outlet_type?: string | null;
}

export interface PublicOrderingContext {
  entry_point: "counter" | "table";
  default_order_type: OrderType;
  scanned_table_id: string | null;
  scanned_table_number: string | null;
  require_customer_login: boolean;
  require_prepaid: boolean;
  upi_vpa: string | null;
  upi_payee_name: string | null;
  upi_qr_image_url: string | null;
  available_order_types: OrderType[];
  tables: { table_number: string; qr_token: string }[];
}

export interface PublicMenuItemVariant {
  id: string;
  name: string;
  price_delta: string;
  sort_order: number;
}

export interface PublicMenuItemAddon {
  id: string;
  name: string;
  price: string;
}

export type DietaryType = "veg" | "vegan" | "non_veg";

export interface PublicMenuItem {
  id: string;
  name: string;
  description: string | null;
  base_price: string;
  dietary_type: DietaryType | null;
  sort_order: number;
  images: { id: string; image_url: string; sort_order: number }[];
  variants: PublicMenuItemVariant[];
  addons: PublicMenuItemAddon[];
}

export interface PublicMenuCategory {
  id: string;
  name: string;
  sort_order: number;
  items: PublicMenuItem[];
}

export interface PublicMenuResponse {
  outlet: PublicOutletInfo;
  table_id: string | null;
  ordering: PublicOrderingContext;
  menu: PublicMenuCategory[];
}

export interface OrderItemInput {
  menu_item_id: string;
  variant_id?: string | null;
  quantity: number;
  addon_ids?: string[];
  notes?: string | null;
}

export interface OrderPlacementRequest {
  table_qr_token?: string | null;
  order_type: OrderType;
  items: OrderItemInput[];
  guest_name?: string | null;
  guest_phone?: string | null;
  offer_code?: string | null;
  collection?: PaymentCollection | null;
}

export interface OrderItemAddonResponse {
  id: string;
  addon_id: string;
  addon_name: string;
  price_at_order: string;
}

export interface OrderItemResponse {
  id: string;
  menu_item_id: string;
  variant_id: string | null;
  quantity: number;
  item_price_at_order: string;
  notes: string | null;
  addons: OrderItemAddonResponse[];
}

export interface OrderDetailResponse {
  id: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  payment_status: PaymentStatus;
  guest_name: string | null;
  guest_phone: string | null;
  table_number: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemResponse[];
}

export interface OrderPlacementResponse {
  order: OrderDetailResponse;
  upi_payment_link: string | null;
  tracking_token: string;
}

export interface PublicOrderItemAddonStatus {
  addon_id: string;
}

export interface PublicOrderItemStatus {
  menu_item_id: string;
  variant_id: string | null;
  quantity: number;
  item_price_at_order: string;
  notes: string | null;
  addons: PublicOrderItemAddonStatus[];
}

export interface PublicOrderStatusResponse {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  order_type: OrderType;
  created_at: string;
  updated_at: string;
  table_number: string | null;
  items: PublicOrderItemStatus[];
  orders_ahead: number;
  queue_position: number | null;
  estimated_wait_minutes: number | null;
  estimated_ready_at: string | null;
  cancelled_by: CancelledBy | null;
  cancel_requested_at: string | null;
  cancel_request_status: CancelRequestStatus | null;
  payment_collection: PaymentCollection | null;
  upi_vpa: string | null;
  upi_payee_name: string | null;
  upi_qr_image_url: string | null;
}
