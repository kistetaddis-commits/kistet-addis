import { createClient } from '@supabase/supabase-js';
import { PaymentStatus, User, TicketStatus, PaymentMethod, Event, UserRole, Ticket, Notification } from '../types';

export interface GlobalSetting {
  payment_method: string;
  account_details: string;
  updated_at: string;
}

const supabaseUrl = 'https://howsrwztkzodegymjboj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvd3Nyd3p0a3pvZGVneW1qYm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDk0NzIsImV4cCI6MjA5MDUyNTQ3Mn0.02awr4TdmS30svwVzbPbpS0XZS2goKo2X_nqvzW9-aY';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Check your .env file or deployment settings.');
}

const customFetch = async (url: string, options?: any) => {
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch(url, options);
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) return response;
      throw new Error(`Status ${response.status}`);
    } catch (err) {
      retries--;
      if (retries > 0) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error('Fetch failed');
};

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: { persistSession: true, autoRefreshToken: true },
  global: { fetch: customFetch }
});

export async function withRetry<T>(fn: () => Promise<T> | any, retries = 3, delay = 1000): Promise<T> {
  try {
    const res = fn();
    const awaited = await (res && typeof res.then === 'function' ? res : Promise.resolve(res));
    return awaited as T;
  } catch (error: any) {
    if (retries <= 0) throw error;
    if (error.status && [401, 403, 409, 422].includes(error.status)) throw error;
    await new Promise(r => setTimeout(r, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// --- Auth ---

export async function getUserProfile(userId: string): Promise<User | null> {
  console.log('lib/supabase: Fetching user profile for:', userId);
  return withRetry(async () => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
       console.error('lib/supabase: Error fetching user profile:', error);
       throw error;
    }
    console.log('lib/supabase: Profile found for:', userId, 'Role:', data?.role);
    return data as User;
  });
}

export async function fetchUserRoleByEmail(email: string): Promise<UserRole | null> {
  return withRetry(async () => {
    const { data, error } = await supabase.from('users').select('role').eq('email', email).single();
    if (error) throw error;
    return data?.role as UserRole;
  });
}

export async function fetchUserRoleById(userId: string): Promise<UserRole | null> {
  return withRetry(async () => {
    const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();
    if (error) throw error;
    return data?.role as UserRole;
  });
}

export async function loginWithEmail(email: string, password: string) {
  try {
    console.log('lib/supabase: Logging in with email:', email);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (authError) {
      console.error('lib/supabase: Auth error:', authError);
      return { user: null, error: authError.message };
    }
    
    if (!authData.user) {
      return { user: null, error: 'Auth failed: User not found' };
    }

    console.log('lib/supabase: Auth success, fetching profile for:', authData.user.id);
    const profile = await getUserProfile(authData.user.id);
    
    if (!profile) {
       return { user: null, error: 'User profile not found in database' };
    }

    if (!profile.role) {
       return { user: null, error: 'Permission denied: User profile has no role' };
    }
    
    return { user: profile, error: null };
  } catch (err: any) {
    console.error('lib/supabase: Unexpected login error:', err);
    return { user: null, error: err.message || 'Login failed' };
  }
}

export async function loginWithUsernameOrEmail(identifier: string, password: string) {
  try {
    console.log('lib/supabase: Attempting login for:', identifier);
    
    let email = identifier;
    
    // If it's not an email, try to find the email by name (username)
    if (!identifier.includes('@')) {
      console.log('lib/supabase: Identifier is not email, searching by name...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('name', identifier)
        .maybeSingle();
        
      if (userError || !userData) {
        console.error('lib/supabase: Could not find user by name:', userError || 'Not found');
        return { user: null, error: 'Invalid username or email' };
      }
      
      email = (userData as any).email;
      console.log('lib/supabase: Found email for username:', email);
    }

    // Now use standard Supabase Auth
    return await loginWithEmail(email, password);
    
  } catch (err: any) {
    console.error('lib/supabase: Unexpected login error:', err);
    return { user: null, error: err.message || 'Error occurred during login' };
  }
}

export async function logout() {
  console.log('lib/supabase: Logging out...');
  await supabase.auth.signOut();
}

export async function updateAdminEmail(email: string) {
  const { data, error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
  return data;
}

export async function updateAdminPassword(password: string) {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, data: Partial<User>): Promise<User> {
  return withRetry(async () => {
    const { data: profile, error } = await supabase.from('users').update(data).eq('id', userId).select('*').single();
    if (error) throw error;
    return profile as User;
  });
}

// --- Management ---

export async function createOrganizer(name: string, email: string, password: string, eventId: string) {
  const response = await withRetry(() => supabase.functions.invoke('create-organizer', { body: { name, email, password, eventId } }));
  const { data, error } = response as any;
  if (error) throw error;
  return data;
}

export async function getOrganizers(): Promise<any[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.from('users').select('*, events:event_id(*)').eq('role', 'organizer').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  });
}

export async function getAssignedEvents(): Promise<Event[]> {
  return withRetry(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data: prof } = await supabase.from('users').select('event_id').eq('id', user.id).single();
    const { data: maps } = await supabase.from('organizers').select('event_id').eq('user_id', user.id);
    const ids = new Set<string>();
    if ((prof as any)?.event_id) ids.add((prof as any).event_id);
    if (maps) (maps as any[]).forEach((m: any) => ids.add(m.event_id));
    if (ids.size === 0) return [];
    
    const { data: evs } = await supabase.from('events').select('*').in('id', Array.from(ids));
    return (evs || []) as Event[];
  });
}

export async function getEventTickets(eventId: string): Promise<Ticket[]> {
  return withRetry(async () => {
    const { data, error } = await supabase.from('tickets').select('*, users!inner(name, phone, email)').eq('event_id', eventId).order('created_at', { ascending: false });
    if (error) throw error;
    return data as any[];
  });
}

export async function getOrCreatePurchaseUser(data: { name: string; phone: string; email?: string }): Promise<User> {
  return withRetry(async () => {
    const { data: ex } = await supabase.from('users').select('*').eq('phone', data.phone).maybeSingle();
    if (ex) return ex as User;
    const { data: ne, error } = await supabase.from('users').insert([{ name: data.name, phone: data.phone, email: data.email || null, role: 'customer' }]).select('*').single();
    if (error) throw error;
    return ne as User;
  });
}

export async function getAllEvents(): Promise<Event[]> {
  return withRetry(async () => {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false });
    return (data || []) as Event[];
  });
}

export async function getEventById(id: string): Promise<Event> {
  return withRetry(async () => {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Event;
  });
}

export async function createEvent(event: Partial<Event>): Promise<Event> {
  return withRetry(async () => {
    if (!event.title || !event.date || !event.organizer_id) {
      throw new Error('Missing required fields (title, date, or organizer_id) for event creation.');
    }
    
    const insertData = {
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      ticket_price: event.ticket_price || event.price || 0,
      total_tickets: event.total_tickets || 0,
      selling_deadline: event.selling_deadline,
      event_type: event.event_type || event.category,
      image_url: event.image_url,
      organizer_id: event.organizer_id
    };

    const { data, error } = await supabase.from('events').insert([insertData]).select('*').single();
    
    if (error) {
      console.error('Supabase createEvent: FULL ERROR:', error);
      if (error.code === '42501') {
        throw new Error('Permission denied: You do not have permission to create events.');
      }
      if (error.code === '23502') {
        throw new Error(`Required column missing: ${(error as any).column}.`);
      }
      throw new Error(error.message || 'An unexpected database error occurred during event creation.');
    }
    
    if (!data) {
      throw new Error('Event creation failed: Empty response from database.');
    }
    
    return data as Event;
  });
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalBuyers: number;
  activeEvents: number;
  pendingPayments: number;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  return withRetry(async () => {
    const now = new Date().toISOString();
    const [rev, buy, eve, pen] = await Promise.all([
      supabase.from('payments').select('amount').eq('status', 'verified'),
      supabase.from('tickets').select('user_id').eq('status', 'approved'),
      supabase.from('events').select('id', { count: 'exact', head: true }).gte('date', now),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ]);
    const totalRevenue = (rev.data || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const totalBuyers = new Set((buy.data || []).map((t: any) => t.user_id)).size;
    return { totalRevenue, totalBuyers, activeEvents: eve.count || 0, pendingPayments: pen.count || 0 };
  });
}

export async function getGlobalSettings(): Promise<GlobalSetting[]> {
  return withRetry(async () => {
    const { data } = await supabase.from('settings').select('*').order('payment_method', { ascending: true });
    return (data || []) as GlobalSetting[];
  });
}

export async function savePaymentSettings(settings: { method: string; details: string }[]) {
  const promises = settings.map(s => supabase.from('settings').upsert({ payment_method: s.method, account_details: s.details }, { onConflict: 'payment_method' }));
  const results = await Promise.all(promises);
  if (results.some((r: any) => r.error)) throw new Error('Save failed');
  return true;
}

export async function fetchPendingPayments(): Promise<any[]> {
  return withRetry(async () => {
    const { data } = await supabase.from('payments').select('*, users(name, email, phone), events(title)').eq('status', 'pending').order('created_at', { ascending: false });
    return (data || []) as any[];
  });
}

export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
  return withRetry(async () => {
    const { data } = await supabase.from('payments').select('status').eq('id', paymentId).single();
    return (data as any)?.status as PaymentStatus;
  });
}

export async function verifyPayment(paymentId: string, status: 'verified' | 'rejected', adminNotes?: string) {
  return withRetry(async () => {
    const { data: pay, error: payError } = await supabase.from('payments').update({ status, admin_notes: adminNotes }).eq('id', paymentId).select('*, users(name, email, phone), events(id, title)').single();
    if (payError) throw payError;
    const tStat: TicketStatus = status === 'verified' ? 'approved' : 'rejected';
    const qr = status === 'verified' ? `TICKET-${(pay as any).event_id}-${(pay as any).user_id}-${(pay as any).id}` : null;
    await supabase.from('tickets').update({ status: tStat, qr_code_data: qr, is_download_enabled: status === 'verified' }).eq('payment_id', paymentId).select('*');
    const title = status === 'verified' ? 'Payment Approved!' : 'Payment Rejected';
    const msg = status === 'verified' ? `Your payment for ${(pay as any).events?.title || 'the event'} has been verified.` : `Your payment was rejected. ${adminNotes || ''}`;
    await supabase.from('notifications').insert([{ user_id: (pay as any).user_id, title, message: msg, is_read: false }]);
    return { payment: pay };
  });
}

export async function submitManualPayment(userId: string, eventId: string, quantity: number, method: PaymentMethod, transactionId: string, amount: number) {
  return withRetry(async () => {
    const { data: ex } = await supabase.from('payments').select('id').eq('transaction_id', transactionId).maybeSingle();
    if (ex) throw new Error('Transaction ID already exists');
    const { data: pay, error: payError } = await supabase.from('payments').insert([{ user_id: userId, event_id: eventId, amount, method, transaction_id: transactionId, status: 'pending' }]).select('*').single();
    if (payError) throw payError;
    const { data: tick } = await supabase.from('tickets').insert([{ user_id: userId, event_id: eventId, payment_id: (pay as any).id, quantity, status: 'pending' }]).select('*').single();
    return { ticket: tick, payment: pay };
  });
}

export async function scanTicketByQR(qr: string): Promise<{ success: boolean; message: string; ticket?: Ticket }> {
  try {
    const response = await withRetry(() => supabase.from('tickets').select('*, users(name, phone, email), events(title)').eq('qr_code_data', qr).single());
    const { data, error } = response as any;
    if (error || !data) return { success: false, message: 'Invalid ticket' };
    if ((data as any).status === 'used') return { success: false, message: 'Used' };
    if ((data as any).status !== 'approved') return { success: false, message: 'Not approved' };
    await supabase.from('tickets').update({ status: 'used' }).eq('id', (data as any).id);
    return { success: true, message: 'Success', ticket: data as any };
  } catch (err) {
    return { success: false, message: 'Error' };
  }
}

export async function logTicketScan(ticketId: string, status: 'success' | 'failed', details: any = {}) {
  try {
    const { data: t } = await supabase.from('tickets').select('id, user_id, event_id').eq('id', ticketId).single();
    if (t) {
      await supabase.from('audit_logs').insert([{ action: 'ticket_scanning', actor_id: null, target_id: ticketId, details: { status, ...details } }]);
      if (status === 'success') await supabase.from('tickets').update({ status: 'used' }).eq('id', ticketId);
    }
  } catch (err) {}
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const response = await withRetry(() => supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }));
  const { data } = response as any;
  return (data || []) as Notification[];
}

export async function markNotificationAsRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  return true;
}