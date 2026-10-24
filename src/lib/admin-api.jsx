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

export const adminApi = {
    // Home
    getSummary:          ()                            => request("/api/admin/summary"),

    // Users
    getUsers:            ()                            => request("/api/admin/users"),
    updateUserRole:      (userId, role)                => request(`/api/admin/users/${userId}/role`,          { method: "PATCH",  ...jsonBody({ role }) }),
    removeUser:          (userId)                      => request(`/api/admin/users/${userId}`,               { method: "DELETE" }),

    // Campaign approvals
    getPendingCampaigns: ()                            => request("/api/admin/campaigns/pending"),
    reviewCampaign:      (campaignId, decision)        => request(`/api/admin/campaigns/${campaignId}/review`, { method: "POST",   ...jsonBody({ decision }) }),

    // Manage campaigns
    getAllCampaigns:     ()                            => request("/api/admin/campaigns"),
    deleteCampaign:     (campaignId)                  => request(`/api/admin/campaigns/${campaignId}`,        { method: "DELETE" }),

    // Withdrawals
    getWithdrawals:     ()                            => request("/api/admin/withdrawals"),
    processWithdrawal:  (withdrawalId)                => request(`/api/admin/withdrawals/${withdrawalId}/process`, { method: "POST", ...jsonBody({}) }),

    // Reports
    getReports:         ()                            => request("/api/admin/reports"),
    resolveReport:      (reportId, action)            => request(`/api/admin/reports/${reportId}/resolve`,   { method: "POST",   ...jsonBody({ action }) }),
};
