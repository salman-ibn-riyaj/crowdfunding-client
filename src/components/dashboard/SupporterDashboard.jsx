"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiRefreshCw } from "react-icons/fi";
import { supporterApi, CREDIT_PACKAGES } from "../../lib/supporter-api";

const EMPTY_SUMMARY = {
    totalContributions: 0,
    pendingContributions: 0,
    totalApprovedCredits: 0,
};

const PAYMENT_METHODS = ["Stripe (Demo)", "Bkash", "Rocket", "Nagad", "Other"];

function formatCredits(value = 0) {
    return `${Number(value).toLocaleString()} credits`;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function formatMoney(cents = 0) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function SummaryTile({ label, value, note }) {
    return (
        <article className="supporter-stat">
            <p>{label}</p>
            <strong>{value}</strong>
            {note && <small>{note}</small>}
        </article>
    );
}

function StatusBadge({ status }) {
    return (
        <span className={`creator-status creator-status--${status}`}>
            {status}
        </span>
    );
}

export default function SupporterDashboard({ section = "home", user }) {
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [contributions, setContributions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [approved, setApproved] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");
    const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);

    async function loadDashboard(showSpinner = false) {
        if (showSpinner) setRefreshing(true);
        setError("");
        try {
            const [summaryRes, contribRes, approvedRes, paymentsRes] = await Promise.all([
                supporterApi.getSummary(),
                supporterApi.getContributions(pagination.page, 10),
                supporterApi.getApprovedContributions(),
                supporterApi.getPayments(),
            ]);
            setSummary(summaryRes.summary || EMPTY_SUMMARY);
            setContributions(contribRes.contributions || []);
            setPagination(contribRes.pagination || { page: 1, totalPages: 1, total: 0 });
            setApproved(approvedRes.contributions || []);
            setPayments(paymentsRes.payments || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load Supporter dashboard.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function changePage(newPage) {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        setPagination({ ...pagination, page: newPage });
    }

    useEffect(() => {
        let active = true;
        Promise.all([
            supporterApi.getSummary(),
            supporterApi.getContributions(1, 10),
            supporterApi.getApprovedContributions(),
            supporterApi.getPayments(),
        ]).then(([summaryRes, contribRes, approvedRes, paymentsRes]) => {
            if (!active) return;
            setSummary(summaryRes.summary || EMPTY_SUMMARY);
            setContributions(contribRes.contributions || []);
            setPagination(contribRes.pagination || { page: 1, totalPages: 1, total: 0 });
            setApproved(approvedRes.contributions || []);
            setPayments(paymentsRes.payments || []);
        }).catch((err) => {
            if (active) setError(err instanceof Error ? err.message : "Unable to load Supporter dashboard.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, []);

    // Reload contributions when page changes
    useEffect(() => {
        if (section === "contributions" && !loading) {
            loadDashboard();
        }
    }, [pagination.page]);

    async function buyPackage(pkg) {
        if (busyId) return;
        setBusyId(pkg.id);
        setError("");
        setNotice("");
        try {
            await supporterApi.purchaseCredits(pkg.id, selectedPayment);
            setNotice(`${pkg.credits} credits added to your account. Refresh to see your updated balance.`);
            await loadDashboard();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Purchase failed. Please try again.");
        } finally {
            setBusyId("");
        }
    }

    const sectionTitle = {
        home: "Home",
        campaigns: "Explore Campaigns",
        contributions: "My Contributions",
        credits: "Purchase Credit",
        payments: "Payment History",
    }[section] ?? "Home";

    if (loading) {
        return <section aria-busy="true" className="supporter-loading">Loading Supporter workspace…</section>;
    }

    return (
        <section className="supporter-workspace">
            <header className="supporter-workspace__heading">
                <div>
                    <p className="section-eyebrow">Supporter workspace</p>
                    <h2>{sectionTitle}</h2>
                </div>
                <div className="supporter-workspace__actions">
                    <span className="supporter-user-label">{user.name || user.email}</span>
                    <button
                        aria-label="Refresh Supporter data"
                        className="creator-icon-button"
                        disabled={refreshing}
                        onClick={() => loadDashboard(true)}
                        type="button"
                    >
                        <FiRefreshCw aria-hidden="true" />
                    </button>
                </div>
            </header>

            {(error || notice) && (
                <div
                    aria-live="polite"
                    className={error ? "creator-message creator-message--error" : "creator-message"}
                    role={error ? "alert" : "status"}
                >
                    {error || notice}
                </div>
            )}

            {/* ── HOME ─────────────────────────────────────────────── */}
            {section === "home" && (
                <>
                    <div className="supporter-stat-grid">
                        <SummaryTile
                            label="Total contributions"
                            value={summary.totalContributions}
                            note="All contributions you have made"
                        />
                        <SummaryTile
                            label="Pending contributions"
                            value={summary.pendingContributions}
                            note="Awaiting creator review"
                        />
                        <SummaryTile
                            label="Total credits contributed"
                            value={formatCredits(summary.totalApprovedCredits)}
                            note="Across approved contributions"
                        />
                    </div>

                    <section className="supporter-home-shortcuts">
                        <div>
                            <p className="section-eyebrow">Next steps</p>
                            <h3>Discover campaigns worth backing.</h3>
                        </div>
                        <Link href="/dashboard?section=campaigns">
                            Explore campaigns <FiArrowRight aria-hidden="true" />
                        </Link>
                        <Link href="/dashboard?section=credits">
                            Purchase credits <FiArrowRight aria-hidden="true" />
                        </Link>
                    </section>

                    {/* Approved contributions table on home */}
                    <section className="supporter-section">
                        <header className="supporter-section__header">
                            <p className="section-eyebrow">Recent activity</p>
                            <h3>Approved Contributions</h3>
                            <p className="creator-section__note">Contributions that have been approved by the campaign creator.</p>
                        </header>
                        <div className="creator-table-wrap">
                            <table className="creator-table">
                                <thead>
                                    <tr>
                                        <th>Campaign</th>
                                        <th>Amount</th>
                                        <th>Creator</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approved.length === 0 ? (
                                        <tr>
                                            <td className="creator-table__empty" colSpan={4}>
                                                No approved contributions yet. Start by exploring campaigns.
                                            </td>
                                        </tr>
                                    ) : approved.map((c) => (
                                        <tr key={c._id}>
                                            <td>{c.campaignTitle}</td>
                                            <td>{formatCredits(c.amountCredits)}</td>
                                            <td>{c.creatorName || "—"}</td>
                                            <td><StatusBadge status={c.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}

            {/* ── EXPLORE CAMPAIGNS ────────────────────────────────── */}
            {section === "campaigns" && (
                <section className="supporter-section">
                    <p className="creator-section__note">
                        Active campaigns accepting contributions. Click View Details to learn more and contribute.
                    </p>
                    <CampaignBrowser />
                </section>
            )}

            {/* ── MY CONTRIBUTIONS ─────────────────────────────────── */}
            {section === "contributions" && (
                <section className="supporter-section">
                    <p className="creator-section__note">
                        All contributions you have made. Status is highlighted to show pending, approved, or rejected.
                    </p>
                    <div className="creator-table-wrap">
                        <table className="creator-table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Amount</th>
                                    <th>Creator</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contributions.length === 0 ? (
                                    <tr>
                                        <td className="creator-table__empty" colSpan={5}>
                                            You have not made any contributions yet.
                                        </td>
                                    </tr>
                                ) : contributions.map((c) => (
                                    <tr key={c._id}>
                                        <td>{c.campaignTitle}</td>
                                        <td>{formatCredits(c.amountCredits)}</td>
                                        <td>{c.creatorName || "—"}</td>
                                        <td>{formatDate(c.createdAt)}</td>
                                        <td><StatusBadge status={c.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button
                                className="pagination-button"
                                disabled={!pagination.hasPrev}
                                onClick={() => changePage(pagination.page - 1)}
                                type="button"
                            >
                                Previous
                            </button>
                            <div className="pagination-numbers">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`pagination-number${pagination.page === pageNum ? " pagination-number--active" : ""}`}
                                            onClick={() => changePage(pageNum)}
                                            type="button"
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                className="pagination-button"
                                disabled={!pagination.hasNext}
                                onClick={() => changePage(pagination.page + 1)}
                                type="button"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* ── PURCHASE CREDIT ──────────────────────────────────── */}
            {section === "credits" && (
                <section className="supporter-section">
                    <p className="creator-section__note">
                        10 credits = $1.00. Credits are deducted when you contribute to a campaign and refunded if a
                        contribution is rejected.
                    </p>

                    <div className="supporter-credit-packages">
                        {CREDIT_PACKAGES.map((pkg) => (
                            <article className="supporter-credit-card" key={pkg.id}>
                                <p className="supporter-credit-card__credits">{pkg.label}</p>
                                <p className="supporter-credit-card__price">{pkg.price}</p>
                                <p className="supporter-credit-card__rate">
                                    {(pkg.priceCents / pkg.credits / 100 * 10).toFixed(2)}¢ per credit
                                </p>
                                <button
                                    className="creator-button creator-button--primary supporter-credit-card__buy"
                                    disabled={!!busyId}
                                    onClick={() => buyPackage(pkg)}
                                    type="button"
                                >
                                    {busyId === pkg.id ? "Processing…" : `Buy for ${pkg.price}`}
                                </button>
                            </article>
                        ))}
                    </div>

                    <div className="supporter-payment-method">
                        <label className="creator-field">
                            <span>Payment method</span>
                            <select
                                onChange={(e) => setSelectedPayment(e.target.value)}
                                value={selectedPayment}
                            >
                                {PAYMENT_METHODS.map((m) => (
                                    <option key={m}>{m}</option>
                                ))}
                            </select>
                        </label>
                        <p className="creator-section__note">
                            Payments are processed as a demo. No real charge is made.
                        </p>
                    </div>
                </section>
            )}

            {/* ── PAYMENT HISTORY ──────────────────────────────────── */}
            {section === "payments" && (
                <section className="supporter-section">
                    <p className="creator-section__note">
                        All credit purchases you have made, newest first.
                    </p>
                    <div className="creator-table-wrap">
                        <table className="creator-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Credits</th>
                                    <th>Amount paid</th>
                                    <th>Payment method</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length === 0 ? (
                                    <tr>
                                        <td className="creator-table__empty" colSpan={5}>
                                            No payment history yet. Purchase credits to get started.
                                        </td>
                                    </tr>
                                ) : payments.map((p) => (
                                    <tr key={p._id}>
                                        <td>{formatDate(p.createdAt)}</td>
                                        <td>{formatCredits(p.creditsAdded)}</td>
                                        <td>{formatMoney(p.priceCents)}</td>
                                        <td>{p.paymentMethod}</td>
                                        <td><StatusBadge status={p.status} /></td>
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

/* ── Inline sub-component: campaign browser for the dashboard ── */
function CampaignBrowser() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        supporterApi.getCampaigns()
            .then((res) => { if (active) setCampaigns(res.campaigns || []); })
            .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Unable to load campaigns."); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    if (loading) return <p className="supporter-loading">Loading campaigns…</p>;
    if (error) return <p className="creator-message creator-message--error">{error}</p>;

    if (campaigns.length === 0) {
        return (
            <p className="creator-section__note">
                No active campaigns at the moment. Check back soon.
            </p>
        );
    }

    return (
        <div className="supporter-campaign-grid">
            {campaigns.map((campaign) => (
                <article className="supporter-campaign-card" key={campaign._id}>
                    {campaign.imageUrl && (
                        <div className="supporter-campaign-card__image">
                            <Image
                                alt={campaign.title}
                                fill
                                src={campaign.imageUrl}
                                style={{ objectFit: "cover" }}
                                unoptimized
                            />
                            <span className="campaign-card__category">{campaign.category}</span>
                        </div>
                    )}
                    <div className="supporter-campaign-card__body">
                        <h3>{campaign.title}</h3>
                        <p className="supporter-campaign-card__creator">by {campaign.creatorName}</p>
                        <div className="supporter-campaign-card__meta">
                            <span><strong>{formatCredits(campaign.raisedCredits)}</strong> raised</span>
                            <span>Goal: {formatCredits(campaign.fundingGoal)}</span>
                        </div>
                        <div className="supporter-campaign-card__progress">
                            <div
                                className="supporter-campaign-card__bar"
                                style={{
                                    width: `${Math.min(100, Math.round((campaign.raisedCredits / campaign.fundingGoal) * 100))}%`,
                                }}
                                aria-hidden="true"
                            />
                        </div>
                        <div className="supporter-campaign-card__footer">
                            <span className="supporter-campaign-card__deadline">
                                Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                            </span>
                            <Link
                                className="creator-button creator-button--primary"
                                href={`/campaigns/${campaign._id}`}
                            >
                                View Details
                            </Link>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
