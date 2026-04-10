const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('kistet_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('kistet_auth_token', data.token);
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  updateProfile: async (data) => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  },

  logout: () => {
    localStorage.removeItem('kistet_auth_token');
  },

  // Events
  getEvents: async () => {
    const res = await fetch(`${API_URL}/events`);
    return res.json();
  },

  getEvent: async (id) => {
    const res = await fetch(`${API_URL}/events/${id}`);
    if (!res.ok) throw new Error('Event not found');
    return res.json();
  },

  createEvent: async (data) => {
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Event creation failed');
    return res.json();
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('kistet_auth_token');
    
    const res = await fetch(`${API_URL}/images/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  // Tickets & Payments
  purchaseTicket: async (data) => {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Purchase failed');
    return res.json();
  },

  getPendingPayments: async () => {
    const res = await fetch(`${API_URL}/payments/pending`, { headers: getHeaders() });
    return res.json();
  },

  verifyPayment: async (id, status, notes = '') => {
    const res = await fetch(`${API_URL}/payments/${id}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, admin_notes: notes }),
    });
    if (!res.ok) throw new Error('Verification failed');
    return res.json();
  },

  // Admin
  getMetrics: async () => {
    const res = await fetch(`${API_URL}/admin/metrics`, { headers: getHeaders() });
    return res.json();
  },

  getOrganizers: async () => {
    const res = await fetch(`${API_URL}/admin/organizers`, { headers: getHeaders() });
    return res.json();
  },

  createOrganizer: async (data) => {
    const res = await fetch(`${API_URL}/admin/organizers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Organizer creation failed');
    return res.json();
  },

  scanTicket: async (qr_code) => {
    const res = await fetch(`${API_URL}/tickets/scan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ qr_code }),
    });
    return res.json();
  },
};