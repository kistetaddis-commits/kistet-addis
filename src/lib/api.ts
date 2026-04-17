// =========================
// BASE URL
// =========================
const RAW_API_URL =
  import.meta.env.VITE_API_URL || "https://kistet-addis.onrender.com";

const API_URL = RAW_API_URL.endsWith("/api")
  ? RAW_API_URL
  : `${RAW_API_URL}/api`;

console.log("🌍 API URL:", API_URL);

// =========================
// RESPONSE HANDLER
// =========================
async function handleResponse(res: Response) {
  const text = await res.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned non-JSON:\n" + text.slice(0, 200));
  }

  if (!res.ok) {
    throw new Error(data?.message || "API Error");
  }

  return data;
}

// =========================
// TOKEN HELPERS
// =========================
const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token || token === "null" || token === "undefined") return null;
  return token;
};

const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// =========================
// API OBJECT
// =========================
export const api = {
  // ================= AUTH =================
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse(res);
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  },

  loginWithUsernameOrEmail: async (identifier: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier, password }),
    });

    const data = await handleResponse(res);
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: authHeader(),
    });

    return handleResponse(res);
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  // ================= EVENTS =================
  getEvents: async () => {
    const res = await fetch(`${API_URL}/events`);
    return handleResponse(res);
  },

  getAllEvents: async () => {
    const res = await fetch(`${API_URL}/events`);
    return handleResponse(res);
  },

  getEvent: async (id: string) => {
    const res = await fetch(`${API_URL}/events/${id}`);
    return handleResponse(res);
  },

  createEvent: async (data: any) => {
    const res = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  // ================= UPLOAD =================
  uploadImage: async (file: File) => {
    const form = new FormData();
    form.append("image", file);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: authHeader(),
      body: form,
    });

    return handleResponse(res);
  },

  // ================= TICKETS =================
  purchaseTicket: async (data: any) => {
    const res = await fetch(`${API_URL}/tickets/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  getTicketById: async (id: string) => {
    const res = await fetch(`${API_URL}/tickets/${id}`, {
      headers: authHeader(),
    });

    return handleResponse(res);
  },

  scanTicket: async (qrCode: string) => {
    const res = await fetch(`${API_URL}/tickets/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({ qrCode }),
    });

    return handleResponse(res);
  },

  // ================= PAYMENTS =================
  getPendingPayments: async () => {
    const res = await fetch(`${API_URL}/payments/pending`, {
      headers: authHeader(),
    });

    return handleResponse(res);
  },

  verifyPayment: async (
    id: string,
    status: "verified" | "rejected",
    reason?: string
  ) => {
    const res = await fetch(`${API_URL}/payments/verify/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({ status, reason }),
    });

    return handleResponse(res);
  },

  // ================= USERS =================
  updateProfile: async (data: any) => {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  // ================= ORGANIZERS =================
  getOrganizers: async () => {
    const res = await fetch(`${API_URL}/organizers`, {
      headers: authHeader(),
    });

    return handleResponse(res);
  },

  createOrganizer: async (data: any) => {
    const res = await fetch(`${API_URL}/organizers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  // ================= ADMIN =================
  getMetrics: async () => {
    const res = await fetch(`${API_URL}/admin/metrics`, {
      headers: authHeader(),
    });

    return handleResponse(res);
  },
};

// =========================
// FIX: named exports for old imports
// =========================
export const login = api.login;
export const loginWithUsernameOrEmail = api.loginWithUsernameOrEmail;
export const getMe = api.getMe;
export const logout = api.logout;

export const getEvents = api.getEvents;
export const getAllEvents = api.getAllEvents;
export const getEvent = api.getEvent;
export const createEvent = api.createEvent;
export const uploadImage = api.uploadImage;

export const purchaseTicket = api.purchaseTicket;
export const getTicketById = api.getTicketById;
export const scanTicket = api.scanTicket;

export const getPendingPayments = api.getPendingPayments;
export const verifyPayment = api.verifyPayment;

export const updateProfile = api.updateProfile;

export const getOrganizers = api.getOrganizers;
export const createOrganizer = api.createOrganizer;

export const getMetrics = api.getMetrics;