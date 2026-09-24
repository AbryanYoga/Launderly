export type ServiceUnit = "kg" | "pcs";

export type PaymentStatus = "unpaid" | "paid";

export type OrderStatus = "pending" | "washing" | "ironing" | "completed";

export interface Service {
  id: string;
  name: string;
  unit: ServiceUnit;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  service_id: string;
  qty: number;
  subtotal: number;
  service?: Service;
}

export interface Transaction {
  id: string;
  invoice: string;
  customer_id: string;
  total_weight: number;
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes?: string | null;
  created_at: string;
  customer?: Customer;
  items?: TransactionItem[];
}

export interface Setting {
  id: string;
  outlet_name: string;
  outlet_phone: string;
  outlet_address: string;
  receipt_footer: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalVolume: number;
  activeOrders: number;
  newCustomers: number;
}
