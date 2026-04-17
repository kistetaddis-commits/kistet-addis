export type Language = "en" | "am" | "om";

// ================= EVENT =================
export type Event = {
  id: string;

  // keep multilingual support but SAFE
  title: string | { en: string; am?: string; om?: string };

  description?: string;

  event_type?: string;

  // ✅ ONLY ONE DATE FIELD
  date: string;

  location?: string;

  image_url?: string;

  ticket_price: number;

  price?: number;

  total_tickets?: number;

  sold_tickets?: number;

  selling_deadline?: string;

  latitude?: number;
  longitude?: number;

  organizer_id?: string;

  created_at?: string;
};

// ================= TICKET =================
export type Ticket = {
  id: string;
  user_name: string;
  email?: string;
  phone?: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  payment_method?: string;
  transaction_id?: string;
};

// ================= USER =================
export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "organizer" | "user";
  assignedEventIds?: string[];
};

// ================= PAYMENT =================
export type PaymentMethod = "Telebirr" | "CBE" | "M-Pesa" | string;

// ================= PURCHASE =================
export type PurchaseFormData = {
  eventId: string;
  fullName: string;
  email: string;
  phone: string;
  quantity: number;
  paymentMethod: PaymentMethod;
};

// ================= PAYMENT ACCOUNT =================
export type PaymentAccount = {
  id: string;
  method_name: string;
  account_number: string;
  account_name: string;
  description?: string;
  is_active: boolean;
};