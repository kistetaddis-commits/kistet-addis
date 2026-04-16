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
// TOKEN
// =========================
const getToken = () => {
  const token = localStorage.getItem("token");
  return token && token !== "null" ? token : null;
};

const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// =========================
// API OBJECT
// =========================
export const api = {
  // ========= AUTH =========
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

  logout: () => localStorage.removeItem("token"),

  // ========= EVENTS =========
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
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });

    return handleResponse(res);
  },

  // ========= UPLOAD =========
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

  // ========= TICKETS =========
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

  // ========= PAYMENTS =========
  getPendingPayments: async () => {
    const res = await fetch(`${API_URL}/payments/pending`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  verifyPayment: async (paymentId: string, status: "verified" | "rejected") => {
    const res = await fetch(`${API_URL}/payments/verify/${paymentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({ status }),
    });

    return handleResponse(res);
  },
};