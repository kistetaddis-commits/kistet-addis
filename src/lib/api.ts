const API_URL = "http://localhost:5000";

/**
 * Handle API response safely
 */
async function handleResponse(res: Response) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API Error");
  }
  return res.json();
}

/**
 * =========================
 * MAIN API OBJECT
 * =========================
 */
export const api = {
  /**
   * AUTH
   */
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  loginWithUsernameOrEmail: async (identifier: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    return handleResponse(res);
  },

  /**
   * 🔥 ADD THESE (FIX YOUR ERROR)
   */
  getMe: async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return handleResponse(res);
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  /**
   * EVENTS
   */
  getAllEvents: async () => {
    const res = await fetch(`${API_URL}/events`);
    return handleResponse(res);
  },

  getEvents: async () => {
    const res = await fetch(`${API_URL}/events`);
    return handleResponse(res);
  },

  getEvent: async (id: string) => {
    const res = await fetch(`${API_URL}/events/${id}`);
    return handleResponse(res);
  },

  createEvent: async (data: any) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  /**
   * UPLOAD
   */
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    return handleResponse(res);
  },

  /**
   * TICKETS
   */
  purchaseTicket: async (data: any) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/tickets/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  scanTicket: async (qrCode: string) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/tickets/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qrCode }),
    });

    return handleResponse(res);
  },

  /**
   * ADMIN
   */
  getMetrics: async () => {
    const res = await fetch(`${API_URL}/admin/metrics`);
    return handleResponse(res);
  },

  getOrganizers: async () => {
    const res = await fetch(`${API_URL}/organizers`);
    return handleResponse(res);
  },

  /**
   * PAYMENTS
   */
  getPendingPayments: async () => {
    const res = await fetch(`${API_URL}/payments/pending`);
    return handleResponse(res);
  },

  verifyPayment: async (
    paymentId: string,
    status: string,
    reason?: string
  ) => {
    const res = await fetch(`${API_URL}/payments/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, status, reason }),
    });

    return handleResponse(res);
  },

  /**
   * PROFILE
   */
  updateProfile: async (data: any) => {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  /**
   * ORGANIZERS
   */
  createOrganizer: async (data: any) => {
    const res = await fetch(`${API_URL}/organizers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },
};

/**
 * =========================
 * NAMED EXPORTS (IMPORTANT)
 * =========================
 */
export const login = api.login;
export const loginWithUsernameOrEmail = api.loginWithUsernameOrEmail;

export const getMe = api.getMe;
export const logout = api.logout;

export const getAllEvents = api.getAllEvents;
export const getEvents = api.getEvents;
export const getEvent = api.getEvent;

export const createEvent = api.createEvent;
export const uploadImage = api.uploadImage;

export const purchaseTicket = api.purchaseTicket;
export const scanTicket = api.scanTicket;

export const getMetrics = api.getMetrics;
export const getOrganizers = api.getOrganizers;

export const getPendingPayments = api.getPendingPayments;
export const verifyPayment = api.verifyPayment;

export const updateProfile = api.updateProfile;
export const createOrganizer = api.createOrganizer;