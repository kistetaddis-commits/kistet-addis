export type Language = 'en' | 'am' | 'om';

// Roles
export type UserRole = 'admin' | 'organizer' | 'customer';

// Ticket status
export type TicketStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'used'
  | 'scanned'
  | 'rejected'
  | 'cancelled';

// Payment
export type PaymentMethod = 'Telebirr' | 'CBE' | 'M-Pesa';
export type PaymentStatus = 'pending' | 'approved' | 'verified' | 'rejected';

// ================= USER =================
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  role: UserRole;
  created_at?: string;
}

// ================= EVENT =================
export interface Event {
  id: string;
  title: string;
  description?: string;

  // keep BOTH for compatibility (fixes your build errors)
  date?: string;          // FIX for old UI
  event_date: string;     // NEW standard

  location: string;
  latitude?: number;
  longitude?: number;

  // FIX: support both naming styles
  price?: number;         // FIX old UI errors
  price: number;   // NEW standard

  total_tickets?: number;
  sold_tickets?: number;

  image_url?: string;

  event_type?: string;
  selling_deadline?: string;

  organizer_id?: string;
  created_by?: string;    // FIX missing in some files
  created_at?: string;
}

// ================= TICKET =================
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

  event_title?: string;
}

// ================= PAYMENT =================
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

  user_name?: string;
  user_email?: string;
  user_phone?: string;
  event_title?: string;
}

// ================= PURCHASE FORM =================
export interface PurchaseFormData {
  fullName: string;
  phone: string;
  email: string;
  quantity: number;
}