import { API_ORIGIN } from "./auth-client";

export async function completeRoleOnboarding(role) {
  const response = await fetch(`${API_ORIGIN}/api/account/onboard`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "We could not finish setting up your account.");
  }

  return result.user;
}