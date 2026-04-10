export type Language = 'en' | 'am' | 'om';

export type UserRole = 'admin' | 'organizer' | 'customer';
export type TicketStatus = 'pending' | 'approved' | 'active' | 'used' | 'scanned' | 'rejected' | 'cancelled';
export type PaymentMethod = 'Telebirr' | 'CBE' | 'M-Pesa';
export type PaymentStatus = 'pending' | 'approved' | 'verified' | 'rejected';

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  created_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  price: number;
  total_tickets: number;
  sold_tickets?: number;
  image_url?: string;
  event_type: string;
  selling_deadline: string;
  created_by?: string;
  created_at?: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  phone: string;
  email?: string;
  quantity: number;
  status: TicketStatus;
  qr_code?: string;
  created_at?: string;
  // Join data
  event_title?: string;
}

export interface Payment {
  id: string;
  ticket_id: string;
  user_id: string;
  event_id: string;
  amount: number;
  method: PaymentMethod;
  transaction_id: string;
  status: PaymentStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  // Join data
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  event_title?: string;
}

export interface PurchaseFormData {
  fullName: string;
  phone: string;
  email: string;
  quantity: number;
}