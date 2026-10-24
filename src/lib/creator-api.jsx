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

function jsonBody(body) {
  return { body: JSON.stringify(body) };
}

export const creatorApi = {
  getSummary: () => request("/api/creator/summary"),
  getCampaigns: () => request("/api/creator/campaigns"),
  createCampaign: (campaign) => request("/api/creator/campaigns", { method: "POST", ...jsonBody(campaign) }),
  updateCampaign: (campaignId, changes) => request(`/api/creator/campaigns/${campaignId}`, { method: "PATCH", ...jsonBody(changes) }),
  deleteCampaign: (campaignId) => request(`/api/creator/campaigns/${campaignId}`, { method: "DELETE" }),
  getPendingContributions: () => request("/api/creator/contributions/pending"),
  reviewContribution: (contributionId, decision) => request(`/api/creator/contributions/${contributionId}/${decision}`, { method: "POST", ...jsonBody({}) }),
  createWithdrawal: (creditsToWithdraw, paymentSystem, accountNumber) => request("/api/creator/withdrawals", {
    method: "POST",
    ...jsonBody({ creditsToWithdraw, paymentSystem, accountNumber }),
  }),
  getWithdrawals: () => request("/api/creator/withdrawals"),
};