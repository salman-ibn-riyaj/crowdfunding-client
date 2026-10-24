import { API_ORIGIN } from "./auth-client";

async function request(path, options = {}) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result.message || "The request could not be completed.");
    error.details = result.errors || {};
    throw error;
  }

  return result;
}

export const notificationsApi = {
  getNotifications: () => request("/api/notifications"),
  getUnreadCount: () => request("/api/notifications/unread-count"),
  markAllRead: () => request("/api/notifications/read", { method: "POST" }),
};
