export type Language = "en" | "am" | "om";

// ================= EVENT =================
export type Event = {
  id: string;

  title: string | { en: string; am?: string; om?: string };
  description?: string;
  event_type?: string;

  date: string;
  location?: string;

  image_url?: string;

  price: number;
  total_tickets?: number;
  sold_tickets?: number;

  selling_deadline?: string;

  latitude?: number;
  longitude?: number;

  organizer_id?: string;

  created_at?: string;
};

// ================= EVENT CATEGORY =================
export type EventCategory = {
  id: string;
  name: string;
  image?: string;
  icon?: string;
  slug?: string;
  image_url?: string;
};

// ================= PROMOTIONAL VIDEO =================
export type PromotionalVideo = {
  id: string;
  title?: string;
  url: string;
  platform: "youtube" | "tiktok" | "instagram" | "facebook" | "twitter";
  created_at?: string;
  is_featured?: boolean;
};

// ================= TICKET (FIXED - IMPORTANT) =================
export type Ticket = {
  id: string;

  // ✅ camelCase (frontend standard)
  userName: string;
  email?: string;
  phone?: string;

  quantity: number;

  status: "pending" | "approved" | "rejected";

  paymentMethod?: string;
  transactionId?: string;

  // event mapping (camelCase)
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;

  qrCode?: string;
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
  methodName: string;
  accountNumber: string;
  accountName: string;
  description?: string;
  isActive: boolean;
};