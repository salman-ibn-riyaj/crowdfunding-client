import { createAuthClient } from "better-auth/react";

export const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export const authClient = createAuthClient({
  baseURL: API_ORIGIN,
  basePath: "/api/auth",
  fetchOptions: { credentials: "include" },
  sessionOptions: { refetchOnWindowFocus: true },
});