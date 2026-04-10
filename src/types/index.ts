export type Language = 'en' | 'am' | 'om';
export type UserRole = 'admin' | 'organizer' | 'customer';
export type TicketStatus = 'pending' | 'approved' | 'active' | 'used' | 'scanned' | 'rejected' | 'cancelled';
export type PaymentMethod = 'telebirr' | 'cbe' | 'mpesa' | 'cbe_birr';
export type PaymentStatus = 'pending' | 'approved' | 'verified' | 'rejected';

export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  password_hash?: string;
  created_at?: string;
  event_id?: string;
  assignedEventIds?: string[];
}

export interface Event {
  id: string;
  title: string | { [key in Language]: string };
  description?: string | { [key in Language]: string };
  date: string;
  location: string;
  price: number;
  image_url?: string;
  organizer_id: string;
  created_at?: string;
  latitude: number;
  longitude: number;
  total_tickets: number;
  selling_deadline: string;
  event_type: string;
  // Compatibility
  event_date?: string;
  ticket_price?: number;
  category?: string;
  created_by?: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  event_id: string;
  user_name?: string;
  phone?: string;
  email?: string;
  quantity: number;
  status: TicketStatus;
  qr_code?: string;
  created_at?: string;
  // Compatibility
  userName?: string;
  userPhone?: string;
  userEmail?: string;
}

export interface Payment {
  id: string;
  ticket_id: string;
  amount: number;
  method: PaymentMethod;
  transaction_id: string;
  status: PaymentStatus;
  created_at: string;
  user_id?: string;
  event_id?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaymentSetting {
  id: string;
  method: PaymentMethod;
  account_name: string;
  account_number: string;
  instructions?: string;
  is_active: boolean;
  updated_at: string;
}

export interface PurchaseFormData {
  fullName: string;
  phone: string;
  email: string;
  quantity: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalBuyers: number;
  activeEvents: number;
  pendingPayments: number;
}