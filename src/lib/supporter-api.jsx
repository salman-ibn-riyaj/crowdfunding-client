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

export const CREDIT_PACKAGES = [
    { id: "pkg_100",  credits: 100,  priceCents: 1000,  label: "100 credits",  price: "$10" },
    { id: "pkg_300",  credits: 300,  priceCents: 2500,  label: "300 credits",  price: "$25" },
    { id: "pkg_800",  credits: 800,  priceCents: 6000,  label: "800 credits",  price: "$60" },
    { id: "pkg_1500", credits: 1500, priceCents: 11000, label: "1500 credits", price: "$110" },
];

export const supporterApi = {
    getSummary:           ()               => request("/api/supporter/summary"),
    getContributions:     (page = 1, limit = 10) => request(`/api/supporter/contributions?page=${page}&limit=${limit}`),
    getApprovedContributions: ()           => request("/api/supporter/contributions/approved"),
    getPayments:          ()               => request("/api/supporter/payments"),
    purchaseCredits:      (packageId, paymentMethod) =>
        request("/api/supporter/credits/purchase", {
            method: "POST",
            ...jsonBody({ packageId, paymentMethod }),
        }),
    getCampaigns:         ()               => request("/api/campaigns"),
    getCampaign:          (campaignId)     => request(`/api/campaigns/${campaignId}`),
    contribute:           (campaignId, amountCredits, message) =>
        request(`/api/campaigns/${campaignId}/contributions`, {
            method: "POST",
            ...jsonBody({ amountCredits, message }),
        }),
};
