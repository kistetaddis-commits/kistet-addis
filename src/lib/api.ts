// =========================
// BASE URL
// =========================
const RAW_API_URL =
  import.meta.env.VITE_API_URL || "https://kistet-addis.onrender.com";

const API_URL = RAW_API_URL.endsWith("/api")
  ? RAW_API_URL
  : `${RAW_API_URL}/api`;

console.log("🌍 API URL:", API_URL);
const normalizeTicket = (ticket: any) => ({
  id: ticket.id,

  userName: ticket.user_name ?? ticket.userName,
  email: ticket.email,
  phone: ticket.phone,

  quantity: ticket.quantity,
  status: ticket.status,

  paymentMethod: ticket.payment_method,
  transactionId: ticket.transaction_id,

  eventId: ticket.event_id ?? ticket.eventId,
  eventName: ticket.event_name,
  eventDate: ticket.event_date,
  eventLocation: ticket.event_location,

  qrCode: ticket.qr_code,
});
// =========================
// RESPONSE HANDLER
// =========================
async function handleResponse(res: Response) {
  const text = await res.text();

  let data: any = {};

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
// ================= TOKEN HELPERS =================
const getToken = (): string | null => {
  try {
    const token = localStorage.getItem("token");

    if (!token || token === "null" || token === "undefined") {
      return null;
    }

    return token;
  } catch (err) {
    return null;
  }
};

const authHeader = (): Record<string, string> => {
  const token = getToken();

  // Always return a valid object
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
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

  getEventById: async (id: string) => {
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
createTicket: async (data: any) => {
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

// ✅ ADD THIS (IMPORTANT FIX)
purchaseTicket: async (data: any) => {
  const res = await fetch(`${API_URL}/tickets/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(data),
  });

  const result = await handleResponse(res);

  return normalizeTicket(result);
},

getTicketById: async (id: string) => {
  const res = await fetch(`${API_URL}/tickets/${id}`, {
    headers: authHeader(),
  });

  const data = await handleResponse(res);

  return normalizeTicket(data);
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
getPendingPayments: async (): Promise<any> => {
  const res = await fetch(`${API_URL}/payments/pending`, {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });

  return handleResponse(res);
},

verifyPayment: async (
  id: string,
  status: "verified" | "rejected",
  reason?: string
): Promise<any> => {
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
  // ================= CATEGORIES =================
getCategories: async () => {
  const res = await fetch(`${API_URL}/categories`);
  return handleResponse(res);
},

// ================= PROMOTIONAL VIDEOS =================
getVideos: async () => {
  const res = await fetch(`${API_URL}/videos`);
  return handleResponse(res);
},

// ================= MY TICKETS =================
getMyTickets: async () => {
  const res = await fetch(`${API_URL}/tickets/my`, {
    headers: authHeader(),
  });

  const data = await handleResponse(res);

  // 🔥 normalize here
  return data.map(normalizeTicket);
},

  // ================= ADMIN FIX (ADDED) =================
  getPendingTickets: async () => {
    const res = await fetch(`${API_URL}/tickets/pending`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  approveTicket: async (ticketId: string) => {
    const res = await fetch(`${API_URL}/tickets/approve/${ticketId}`, {
      method: "PUT",
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  rejectTicket: async (ticketId: string) => {
    const res = await fetch(`${API_URL}/tickets/reject/${ticketId}`, {
      method: "PUT",
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  // ================= PAYMENT ACCOUNTS =================
  getPaymentAccounts: async () => {
    const res = await fetch(`${API_URL}/payments/accounts`, {
      headers: authHeader(),
    });
    return handleResponse(res);
  },

  createPaymentAccount: async (data: any) => {
    const res = await fetch(`${API_URL}/payments/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  updatePaymentAccount: async (id: string, data: any) => {
    const res = await fetch(`${API_URL}/payments/accounts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  deletePaymentAccount: async (id: string) => {
    const res = await fetch(`${API_URL}/payments/accounts/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    return handleResponse(res);
  },
};

// =========================
// EXPORTS
// =========================
export const {
  login,
  loginWithUsernameOrEmail,
  getMe,
  logout,
  getEvents,
  getAllEvents,
  getEvent,
  getEventById,
  createEvent,
  uploadImage,
  purchaseTicket,
  createTicket,
  getTicketById,
  scanTicket,
  getPendingPayments,
  verifyPayment,
  updateProfile,
  getOrganizers,
  createOrganizer,
  getMetrics,
  getPendingTickets,
  approveTicket,
  rejectTicket,
  getPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  getCategories,
  getVideos,
  getMyTickets,
} = api;