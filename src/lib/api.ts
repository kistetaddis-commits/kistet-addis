const API_URL =
  import.meta.env.VITE_API_URL || "https://kistet-addis.onrender.com/api";

console.log("🌍 API URL:", API_URL);

// =========================
// SAFE RESPONSE HANDLER
// =========================
async function handleResponse(res: Response) {
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Invalid server response: " + text);
  }

  if (!res.ok) {
    throw new Error(data.message || "API Error");
  }

  return data;
}

// =========================
// TOKEN (SAFE VERSION)
// =========================
const getToken = () => {
  return localStorage.getItem("token") || "";
};

// =========================
// API
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

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  },

  loginWithUsernameOrEmail: async (identifier: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier, password }),
    });

    const data = await handleResponse(res);

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
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

  getEvent: async (id: string) => {
    const res = await fetch(`${API_URL}/events/${id}`);
    return handleResponse(res);
  },

  createEvent: async (data: any) => {
    const res = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  // ================= UPLOAD =================
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    return handleResponse(res);
  },

  // ================= TICKETS =================
  scanTicket: async (qrCode: string) => {
    const res = await fetch(`${API_URL}/tickets/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ qrCode }),
    });

    return handleResponse(res);
  },

  // ================= PURCHASE TICKET (FIXED) =================
  purchaseTicket: async (data: {
    event_id: string;
    user_name: string;
    phone: string;
    email?: string;
    quantity: number;
    method: string;
    transaction_id: string;
    amount: number;
  }) => {
    const res = await fetch(`${API_URL}/tickets/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  // ================= ADMIN =================
  getMetrics: async () => {
    const res = await fetch(`${API_URL}/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return handleResponse(res);
  },

  getOrganizers: async () => {
    const res = await fetch(`${API_URL}/organizers`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return handleResponse(res);
  },

  // ================= PAYMENTS =================
  getPendingPayments: async () => {
    const res = await fetch(`${API_URL}/payments/pending`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    return handleResponse(res);
  },

  verifyPayment: async (
    paymentId: string,
    status: "verified" | "rejected",
    reason?: string
  ) => {
    const res = await fetch(`${API_URL}/payments/verify/${paymentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ status, reason }),
    });

    return handleResponse(res);
  },

  // ================= PROFILE =================
  updateProfile: async (data: any) => {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  // ================= ORGANIZERS =================
  createOrganizer: async (data: any) => {
    const res = await fetch(`${API_URL}/organizers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },
};

// ================= EXPORTS =================
export const login = api.login;
export const loginWithUsernameOrEmail = api.loginWithUsernameOrEmail;

export const getMe = api.getMe;
export const logout = api.logout;

export const getEvents = api.getEvents;
export const getEvent = api.getEvent;

export const createEvent = api.createEvent;
export const uploadImage = api.uploadImage;

export const scanTicket = api.scanTicket;
export const purchaseTicket = api.purchaseTicket;

export const getMetrics = api.getMetrics;
export const getOrganizers = api.getOrganizers;

export const getPendingPayments = api.getPendingPayments;
export const verifyPayment = api.verifyPayment;

export const updateProfile = api.updateProfile;
export const createOrganizer = api.createOrganizer;

export const getAllEvents = api.getEvents;