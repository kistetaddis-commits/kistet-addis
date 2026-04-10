import { Event, User, Ticket, Payment, DashboardMetrics, PaymentMethod, UserRole, PaymentSetting } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('kistet_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (identifier: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    return res.json();
  },

  getMe: async (): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  updateProfile: async (profileData: Partial<User> & { password?: string }) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update profile');
    }
    return res.json();
  },

  // Events
  getEvents: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE_URL}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    const data = await res.json();
    return data.map((e: any) => ({
      ...e,
      event_date: e.date,
      ticket_price: parseFloat(e.price)
    }));
  },

  getEventById: async (id: string): Promise<Event> => {
    const res = await fetch(`${API_BASE_URL}/events/${id}`);
    if (!res.ok) throw new Error('Event not found');
    const e = await res.json();
    return {
      ...e,
      event_date: e.date,
      ticket_price: parseFloat(e.price)
    };
  },

  createEvent: async (eventData: any) => {
    // Normalize fields for backend expectation
    const payload = {
      ...eventData,
      date: eventData.date || eventData.event_date,
      price: eventData.price !== undefined ? eventData.price : eventData.ticket_price
    };
    
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create event');
    }
    return res.json();
  },

  deleteEvent: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete event');
    return res.json();
  },

  getAssignedEvents: async (): Promise<Event[]> => {
    const res = await fetch(`${API_BASE_URL}/events/assigned`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch assigned events');
    return res.json();
  },

  // Tickets & Payments
  createTicket: async (ticketData: any) => {
    const res = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    if (!res.ok) throw new Error('Failed to create ticket');
    return res.json();
  },

  submitPayment: async (paymentData: any) => {
    const res = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    if (!res.ok) throw new Error('Failed to submit payment');
    return res.json();
  },

  getPaymentStatus: async (ticketId: string) => {
    const res = await fetch(`${API_BASE_URL}/payments/${ticketId}/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  getEventTickets: async (eventId: string): Promise<Ticket[]> => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/tickets`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch event tickets');
    return res.json();
  },

  // Admin
  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await fetch(`${API_BASE_URL}/admin/metrics`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  getPendingPayments: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/payments/pending`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch pending payments');
    return res.json();
  },

  verifyPayment: async (paymentId: string, status: 'approved' | 'rejected', notes?: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, admin_notes: notes })
    });
    if (!res.ok) throw new Error('Verification failed');
    return res.json();
  },

  verifyTicket: async (qrData: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/verify-ticket`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ qr_data: qrData })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Verification failed');
    }
    return res.json();
  },

  scanTicket: async (qrData: string) => {
    return api.verifyTicket(qrData);
  },

  getOrganizers: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/organizers`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch organizers');
    return res.json();
  },

  createOrganizer: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/admin/organizers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create organizer');
    return res.json();
  },

  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  saveSettings: async (settings: any[]) => {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  // Storage
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('kistet_token');
    const res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to upload image');
    }
    return res.json();
  }
};