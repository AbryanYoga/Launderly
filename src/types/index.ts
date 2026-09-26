export type ServiceUnit = "kg" | "pcs";

export type PaymentStatus = "unpaid" | "paid";

export type OrderStatus = "pending" | "washing" | "ironing" | "completed";

export interface Category {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  unit: ServiceUnit;
  price: number;
  is_active: boolean;
  created_at: string;
  category_id?: string | null;
  category?: Category;
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
  payment_method_id?: string | null;
  customer?: Customer;
  items?: TransactionItem[];
  payment_method?: PaymentMethod;
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

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Category, "id">>;
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: Omit<PaymentMethod, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<PaymentMethod, "id">>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "created_at" | "category"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Service, "id" | "category">>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Customer, "id">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at" | "customer" | "items" | "payment_method"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Transaction, "id" | "customer" | "items" | "payment_method">>;
      };
      transaction_items: {
        Row: TransactionItem;
        Insert: Omit<TransactionItem, "id" | "service"> & { id?: string };
        Update: Partial<Omit<TransactionItem, "id" | "service">>;
      };
      settings: {
        Row: Setting;
        Insert: Omit<Setting, "id" | "updated_at"> & { id?: string; updated_at?: string };
        Update: Partial<Omit<Setting, "id">>;
      };
    };
  };
}

