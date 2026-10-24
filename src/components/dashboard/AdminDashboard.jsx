"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiRefreshCw, FiTrash2, FiCheckCircle, FiXCircle, FiAlertTriangle } from "react-icons/fi";
import { adminApi } from "../../lib/admin-api";

// ─── Helpers ────────────────────────────────────────────────────

function formatCredits(value = 0) {
    return `${Number(value).toLocaleString()} credits`;
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatMoney(cents = 0) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function getInitials(name = "") {
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

// ─── Sub-components ──────────────────────────────────────────────

function SummaryTile({ label, value, note, accent }) {
    return (
        <article className={`admin-stat${accent ? " admin-stat--accent" : ""}`}>
            <p>{label}</p>
            <strong>{value}</strong>
            {note && <small>{note}</small>}
        </article>
    );
}

function StatusBadge({ status }) {
    return <span className={`creator-status creator-status--${status}`}>{status}</span>;
}

function EmptyRow({ cols, message }) {
    return (
        <tr>
            <td className="creator-table__empty" colSpan={cols}>{message}</td>
        </tr>
    );
}

// ─── Main component ──────────────────────────────────────────────

const EMPTY_SUMMARY = {
    totalSupporters: 0,
    totalCreators: 0,
    totalAvailableCredits: 0,
    totalPaymentsProcessed: 0,
    pendingCampaigns: 0,
    pendingWithdrawals: 0,
};

const SECTION_TITLE = {
    home: "Admin Home",
    "approvals": "Campaign Approvals",
    campaigns: "Manage Campaigns",
    users: "Manage Users",
    withdrawals: "Withdrawal Requests",
    reports: "Reports",
};

const ALL_ROLES = ["admin", "creator", "supporter"];

export default function AdminDashboard({ section = "home", user }) {
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [users, setUsers] = useState([]);
    const [pending, setPending] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");

    // ── Data loader ─────────────────────────────────────────────
    async function loadDashboard(showSpinner = false) {
        if (showSpinner) setRefreshing(true);
        setError("");
        try {
            const [sumRes, usersRes, pendRes, campRes, wdRes, repRes] = await Promise.all([
                adminApi.getSummary(),
                adminApi.getUsers(),
                adminApi.getPendingCampaigns(),
                adminApi.getAllCampaigns(),
                adminApi.getWithdrawals(),
                adminApi.getReports(),
            ]);
            setSummary(sumRes.summary || EMPTY_SUMMARY);
            setUsers(usersRes.users || []);
            setPending(pendRes.campaigns || []);
            setCampaigns(campRes.campaigns || []);
            setWithdrawals(wdRes.withdrawals || []);
            setReports(repRes.reports || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load Admin dashboard.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        let active = true;
        Promise.all([
            adminApi.getSummary(),
            adminApi.getUsers(),
            adminApi.getPendingCampaigns(),
            adminApi.getAllCampaigns(),
            adminApi.getWithdrawals(),
            adminApi.getReports(),
        ]).then(([sumRes, usersRes, pendRes, campRes, wdRes, repRes]) => {
            if (!active) return;
            setSummary(sumRes.summary || EMPTY_SUMMARY);
            setUsers(usersRes.users || []);
            setPending(pendRes.campaigns || []);
            setCampaigns(campRes.campaigns || []);
            setWithdrawals(wdRes.withdrawals || []);
            setReports(repRes.reports || []);
        }).catch((err) => {
            if (active) setError(err instanceof Error ? err.message : "Unable to load Admin dashboard.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, []);

    // ── Actions ─────────────────────────────────────────────────
    async function reviewCampaign(campaignId, decision) {
        if (!window.confirm(`${decision === "approve" ? "Approve" : "Reject"} this campaign?`)) return;
        setBusyId(campaignId + decision);
        setError(""); setNotice("");
        try {
            await adminApi.reviewCampaign(campaignId, decision);
            setNotice(`Campaign ${decision === "approve" ? "approved" : "rejected"}.`);
            await loadDashboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to review campaign.");
        } finally { setBusyId(""); }
    }

    async function deleteCampaign(campaignId, title) {
        if (!window.confirm(`Delete "${title}"? All approved supporters will be refunded.`)) return;
        setBusyId("del-" + campaignId);
        setError(""); setNotice("");
        try {
            await adminApi.deleteCampaign(campaignId);
            setNotice("Campaign deleted and supporters refunded.");
            await loadDashboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to delete campaign.");
        } finally { setBusyId(""); }
    }

    async function changeUserRole(userId, role) {
        setBusyId("role-" + userId);
        setError(""); setNotice("");
        try {
            await adminApi.updateUserRole(userId, role);
            setNotice("User role updated.");
            await loadDashboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to update role.");
        } finally { setBusyId(""); }
    }

    async function deleteUser(userId, name) {
        if (!window.confirm(`Remove user "${name}"? This cannot be undone.`)) return;
        setBusyId("usr-" + userId);
        setError(""); setNotice("");
        try {
            await adminApi.removeUser(userId);
            setNotice("User removed.");
            await loadDashboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to remove user.");
        } finally { setBusyId(""); }
    }

    async function processWithdrawal(withdrawalId) {
        if (!window.confirm("Mark this withdrawal as paid?")) return;
        setBusyId("wd-" + withdrawalId);
        setError(""); setNotice("");
        try {
            await adminApi.processWithdrawal(withdrawalId);
            setNotice("Withdrawal marked as approved.");
            await loadDashboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to process withdrawal.");
        } finally { setBusyId(""); }
    }

    async function resolveReport(reportId, action) {
        const labels = { suspend: "Suspend campaign", delete: "Delete campaign", dismiss: "Dismiss report" };
        if (!window.confirm(`${labels[action]}?`)) return;
        setBusyId("rep-" + reportId + action);
        setError(""); setNotice("");
        try {
            await adminApi.resolveReport(reportId, action);
            setNotice(`Report ${action === "dismiss" ? "dismissed" : action + "d"}.`);
            await loadDashboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to resolve report.");
        } finally { setBusyId(""); }
    }

    // ── Render ──────────────────────────────────────────────────
    if (loading) {
        return <section aria-busy="true" className="admin-loading">Loading Admin workspace…</section>;
    }

    return (
        <section className="admin-workspace">
            {/* Heading */}
            <header className="admin-workspace__heading">
                <div>
                    <p className="section-eyebrow">Admin workspace</p>
                    <h2>{SECTION_TITLE[section] ?? "Admin Home"}</h2>
                </div>
                <div className="admin-workspace__actions">
                    <span className="admin-user-label">{user.name || user.email}</span>
                    <button
                        aria-label="Refresh Admin data"
                        className="creator-icon-button"
                        disabled={refreshing}
                        onClick={() => loadDashboard(true)}
                        type="button"
                    >
                        <FiRefreshCw aria-hidden="true" />
                    </button>
                </div>
            </header>

            {/* Feedback */}
            {(error || notice) && (
                <div
                    aria-live="polite"
                    className={error ? "creator-message creator-message--error" : "creator-message"}
                    role={error ? "alert" : "status"}
                >
                    {error || notice}
                </div>
            )}

            {/* ── HOME ──────────────────────────────────────────── */}
            {section === "home" && (
                <div className="admin-stat-grid">
                    <SummaryTile label="Total supporters" value={summary.totalSupporters} note="Registered supporter accounts" />
                    <SummaryTile label="Total creators" value={summary.totalCreators} note="Registered creator accounts" />
                    <SummaryTile label="Credits in circulation" value={formatCredits(summary.totalAvailableCredits)} note="Sum of all user balances" />
                    <SummaryTile label="Payments processed" value={summary.totalPaymentsProcessed} note="Completed credit purchases" />
                    <SummaryTile label="Pending campaigns" value={summary.pendingCampaigns} note="Awaiting approval" accent />
                    <SummaryTile label="Pending withdrawals" value={summary.pendingWithdrawals} note="Awaiting processing" accent />
                </div>
            )}

            {/* ── CAMPAIGN APPROVALS ────────────────────────────── */}
            {section === "approvals" && (
                <section className="admin-section">
                    <p className="creator-section__note">
                        Review newly submitted campaigns. Approved campaigns become visible to Supporters.
                    </p>
                    <div className="creator-table-wrap">
                        <table className="creator-table admin-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Creator</th>
                                    <th>Goal</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.length === 0
                                    ? <EmptyRow cols={5} message="No campaigns pending approval." />
                                    : pending.map((c) => (
                                        <tr key={c._id}>
                                            <td>
                                                <div className="admin-campaign-cell">
                                                    {c.imageUrl && (
                                                        <Image alt="" height={40} src={c.imageUrl} unoptimized width={58} style={{ objectFit: "cover", borderRadius: 4 }} />
                                                    )}
                                                    <div>
                                                        <strong>{c.title}</strong>
                                                        <small>{c.category}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{c.creatorName}</td>
                                            <td>{formatCredits(c.fundingGoal)}</td>
                                            <td>{formatDate(c.createdAt)}</td>
                                            <td>
                                                <div className="creator-row-actions">
                                                    <button
                                                        className="creator-button creator-button--approve"
                                                        disabled={!!busyId}
                                                        onClick={() => reviewCampaign(c._id, "approve")}
                                                        type="button"
                                                    >
                                                        <FiCheckCircle aria-hidden="true" /> Approve
                                                    </button>
                                                    <button
                                                        className="creator-button creator-button--reject"
                                                        disabled={!!busyId}
                                                        onClick={() => reviewCampaign(c._id, "reject")}
                                                        type="button"
                                                    >
                                                        <FiXCircle aria-hidden="true" /> Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ── MANAGE CAMPAIGNS ──────────────────────────────── */}
            {section === "campaigns" && (
                <section className="admin-section">
                    <p className="creator-section__note">
                        All campaigns in the system. Deleting a campaign refunds all approved supporters.
                    </p>
                    <div className="creator-table-wrap">
                        <table className="creator-table admin-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Creator</th>
                                    <th>Status</th>
                                    <th>Raised</th>
                                    <th>Deadline</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.length === 0
                                    ? <EmptyRow cols={6} message="No campaigns found." />
                                    : campaigns.map((c) => (
                                        <tr key={c._id}>
                                            <td>
                                                <div className="admin-campaign-cell">
                                                    {c.imageUrl && (
                                                        <Image alt="" height={40} src={c.imageUrl} unoptimized width={58} style={{ objectFit: "cover", borderRadius: 4 }} />
                                                    )}
                                                    <div>
                                                        <strong>{c.title}</strong>
                                                        <small>{c.category}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{c.creatorName}</td>
                                            <td><StatusBadge status={c.status} /></td>
                                            <td>{formatCredits(c.raisedCredits)}</td>
                                            <td>{formatDate(c.deadline)}</td>
                                            <td>
                                                <button
                                                    aria-label={`Delete campaign ${c.title}`}
                                                    className="creator-button creator-button--reject"
                                                    disabled={busyId === "del-" + c._id}
                                                    onClick={() => deleteCampaign(c._id, c.title)}
                                                    type="button"
                                                >
                                                    <FiTrash2 aria-hidden="true" /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ── MANAGE USERS ──────────────────────────────────── */}
            {section === "users" && (
                <section className="admin-section">
                    <p className="creator-section__note">
                        All registered users. Role changes take effect immediately. Removal is permanent.
                    </p>
                    <div className="creator-table-wrap">
                        <table className="creator-table admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Credits</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0
                                    ? <EmptyRow cols={6} message="No users found." />
                                    : users.map((u) => (
                                        <tr key={u._id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-avatar" aria-hidden="true">
                                                        {u.image
                                                            ? <Image alt="" height={34} src={u.image} unoptimized width={34} />
                                                            : getInitials(u.name)}
                                                    </div>
                                                    <span>{u.name || "—"}</span>
                                                </div>
                                            </td>
                                            <td className="admin-email-cell">{u.email}</td>
                                            <td>
                                                <select
                                                    aria-label={`Role for ${u.name || u.email}`}
                                                    className="admin-role-select"
                                                    disabled={busyId === "role-" + u._id}
                                                    onChange={(e) => changeUserRole(u._id, e.target.value)}
                                                    value={u.role}
                                                >
                                                    {ALL_ROLES.map((r) => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>{u.credits ?? 0}</td>
                                            <td>{formatDate(u.createdAt)}</td>
                                            <td>
                                                <button
                                                    aria-label={`Remove ${u.name || u.email}`}
                                                    className="creator-button creator-button--reject"
                                                    disabled={busyId === "usr-" + u._id}
                                                    onClick={() => deleteUser(u._id, u.name || u.email)}
                                                    type="button"
                                                >
                                                    <FiTrash2 aria-hidden="true" /> Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ── WITHDRAWAL REQUESTS ───────────────────────────── */}
            {section === "withdrawals" && (
                <section className="admin-section">
                    <p className="creator-section__note">
                        Pending withdrawal requests from Creators. Clicking Payment Success marks the request as approved
                        and decrements the creator&apos;s payout balance.
                    </p>
                    <div className="creator-table-wrap">
                        <table className="creator-table admin-table">
                            <thead>
                                <tr>
                                    <th>Creator</th>
                                    <th>Email</th>
                                    <th>Credits</th>
                                    <th>Amount</th>
                                    <th>Payment system</th>
                                    <th>Requested</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.length === 0
                                    ? <EmptyRow cols={7} message="No pending withdrawal requests." />
                                    : withdrawals.map((w) => (
                                        <tr key={w._id}>
                                            <td>{w.creatorName}</td>
                                            <td className="admin-email-cell">{w.creatorEmail}</td>
                                            <td>{formatCredits(w.withdrawalCredits)}</td>
                                            <td>{formatMoney(w.withdrawalAmountCents)}</td>
                                            <td>{w.paymentSystem}</td>
                                            <td>{formatDate(w.createdAt)}</td>
                                            <td>
                                                <button
                                                    className="creator-button creator-button--approve"
                                                    disabled={busyId === "wd-" + w._id}
                                                    onClick={() => processWithdrawal(w._id)}
                                                    type="button"
                                                >
                                                    <FiCheckCircle aria-hidden="true" />
                                                    {busyId === "wd-" + w._id ? "Processing…" : "Payment Success"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* ── REPORTS ───────────────────────────────────────── */}
            {section === "reports" && (
                <section className="admin-section">
                    <p className="creator-section__note">
                        Campaigns reported by Supporters as suspicious or fraudulent. Suspend or delete to act on the campaign.
                    </p>
                    <div className="creator-table-wrap">
                        <table className="creator-table admin-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Reporter</th>
                                    <th>Reason</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0
                                    ? <EmptyRow cols={6} message="No reports to review." />
                                    : reports.map((r) => (
                                        <tr key={r._id}>
                                            <td>{r.campaignTitle}</td>
                                            <td>{r.reporterName}</td>
                                            <td className="admin-reason-cell">{r.reason}</td>
                                            <td>{formatDate(r.createdAt)}</td>
                                            <td><StatusBadge status={r.status} /></td>
                                            <td>
                                                {r.status === "open" ? (
                                                    <div className="creator-row-actions">
                                                        <button
                                                            className="creator-button admin-button--warn"
                                                            disabled={!!busyId}
                                                            onClick={() => resolveReport(r._id, "suspend")}
                                                            title="Suspend campaign"
                                                            type="button"
                                                        >
                                                            <FiAlertTriangle aria-hidden="true" /> Suspend
                                                        </button>
                                                        <button
                                                            className="creator-button creator-button--reject"
                                                            disabled={!!busyId}
                                                            onClick={() => resolveReport(r._id, "delete")}
                                                            title="Delete campaign"
                                                            type="button"
                                                        >
                                                            <FiTrash2 aria-hidden="true" /> Delete
                                                        </button>
                                                        <button
                                                            className="creator-button"
                                                            disabled={!!busyId}
                                                            onClick={() => resolveReport(r._id, "dismiss")}
                                                            title="Dismiss report"
                                                            type="button"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="admin-resolved-label">Resolved</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </section>
    );
}
