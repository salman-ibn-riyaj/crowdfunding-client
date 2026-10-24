"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArchive, FiArrowRight, FiPlus, FiRefreshCw, FiX } from "react-icons/fi";
import { creatorApi } from "../../lib/creator-api";

const EMPTY_SUMMARY = {
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRaisedCredits: 0,
    totalEarnedCredits: 0,
    availablePayoutCredits: 0,
};

const PAYMENT_SYSTEMS = ["Stripe", "Bkash", "Rocket", "Nagad", "Other"];

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

function campaignStatus(campaign) {
    if (campaign.lifecycle === "archived") return "Archived";
    if (campaign.lifecycle === "funded") return "Funded";
    return campaign.status?.[0]?.toUpperCase() + campaign.status?.slice(1);
}

function SummaryTile({ label, value, note }) {
    return (
        <article className="creator-stat">
            <p>{label}</p>
            <strong>{value}</strong>
            {note && <small>{note}</small>}
        </article>
    );
}

function CreatorModal({ title, onClose, children }) {
    useEffect(() => {
        function closeOnEscape(event) {
            if (event.key === "Escape") onClose();
        }
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [onClose]);

    return (
        <div className="creator-modal-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
        }}>
            <section aria-labelledby="creator-modal-title" aria-modal="true" className="creator-modal" role="dialog">
                <header className="creator-modal__header">
                    <h2 id="creator-modal-title">{title}</h2>
                    <button aria-label="Close dialog" className="creator-icon-button" onClick={onClose} type="button">
                        <FiX aria-hidden="true" />
                    </button>
                </header>
                {children}
            </section>
        </div>
    );
}

function CampaignFields({ campaign = {}, prefix }) {
    return (
        <>
            <label className="creator-field creator-field--wide">
                <span>Campaign title</span>
                <input defaultValue={campaign.title || ""} maxLength={120} minLength={8} name="title" required />
            </label>
            <label className="creator-field creator-field--wide">
                <span>Campaign story</span>
                <textarea defaultValue={campaign.story || ""} minLength={40} name="story" required rows={5} />
            </label>
            {prefix === "create" && (
                <>
                    <label className="creator-field">
                        <span>Category</span>
                        <select defaultValue="Community" name="category" required>
                            <option>Technology</option>
                            <option>Art</option>
                            <option>Community</option>
                            <option>Health</option>
                            <option>Education</option>
                            <option>Climate</option>
                        </select>
                    </label>
                    <label className="creator-field">
                        <span>Funding goal (credits)</span>
                        <input defaultValue="" min="1" name="fundingGoal" required step="1" type="number" />
                    </label>
                    <label className="creator-field">
                        <span>Minimum contribution (credits)</span>
                        <input defaultValue="1" min="1" name="minimumContribution" required step="1" type="number" />
                    </label>
                    <label className="creator-field">
                        <span>Deadline</span>
                        <input name="deadline" required type="date" />
                    </label>
                    <label className="creator-field creator-field--wide">
                        <span>Reward information</span>
                        <textarea defaultValue="" maxLength={2000} minLength={2} name="rewardInfo" required rows={3} />
                    </label>
                    <label className="creator-field creator-field--wide">
                        <span>Campaign image URL</span>
                        <input defaultValue="" name="imageUrl" placeholder="https://example.com/campaign.jpg" required type="url" />
                    </label>
                </>
            )}
            {prefix === "edit" && (
                <label className="creator-field creator-field--wide">
                    <span>Reward information</span>
                    <textarea defaultValue={campaign.rewardInfo || ""} maxLength={2000} minLength={2} name="rewardInfo" required rows={3} />
                </label>
            )}
        </>
    );
}

export default function CreatorDashboard({ section = "home", user }) {
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [campaigns, setCampaigns] = useState([]);
    const [pendingContributions, setPendingContributions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");
    const [showCampaignForm, setShowCampaignForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [viewingContribution, setViewingContribution] = useState(null);
    const [withdrawCredits, setWithdrawCredits] = useState("");
    const [paymentSystem, setPaymentSystem] = useState("Stripe");
    const [accountNumber, setAccountNumber] = useState("");

    async function loadDashboard(showSpinner = false) {
        if (showSpinner) setRefreshing(true);
        setError("");
        try {
            const [summaryResult, campaignResult, contributionResult, withdrawalResult] = await Promise.all([
                creatorApi.getSummary(),
                creatorApi.getCampaigns(),
                creatorApi.getPendingContributions(),
                creatorApi.getWithdrawals(),
            ]);
            setSummary(summaryResult.summary || EMPTY_SUMMARY);
            setCampaigns(campaignResult.campaigns || []);
            setPendingContributions(contributionResult.contributions || []);
            setWithdrawals(withdrawalResult.withdrawals || []);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Unable to load Creator dashboard.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        let active = true;
        Promise.all([
            creatorApi.getSummary(),
            creatorApi.getCampaigns(),
            creatorApi.getPendingContributions(),
            creatorApi.getWithdrawals(),
        ]).then(([summaryResult, campaignResult, contributionResult, withdrawalResult]) => {
            if (!active) return;
            setSummary(summaryResult.summary || EMPTY_SUMMARY);
            setCampaigns(campaignResult.campaigns || []);
            setPendingContributions(contributionResult.contributions || []);
            setWithdrawals(withdrawalResult.withdrawals || []);
        }).catch((loadError) => {
            if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load Creator dashboard.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const withdrawAmount = useMemo(() => {
        const credits = Number(withdrawCredits);
        return Number.isSafeInteger(credits) && credits > 0 ? (credits * 0.05).toFixed(2) : "0.00";
    }, [withdrawCredits]);

    async function submitCampaign(event) {
        event.preventDefault();
        setBusyId("campaign-create");
        setError("");
        setNotice("");
        const form = new FormData(event.currentTarget);
        const deadline = new Date(`${form.get("deadline")}T23:59:59.999`);
        try {
            await creatorApi.createCampaign({
                title: String(form.get("title")),
                story: String(form.get("story")),
                category: String(form.get("category")),
                fundingGoal: Number(form.get("fundingGoal")),
                minimumContribution: Number(form.get("minimumContribution")),
                deadline: deadline.toISOString(),
                rewardInfo: String(form.get("rewardInfo")),
                imageUrl: String(form.get("imageUrl")),
            });
            setNotice("Campaign submitted for Admin approval.");
            setShowCampaignForm(false);
            await loadDashboard();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Unable to submit campaign.");
        } finally {
            setBusyId("");
        }
    }

    async function submitCampaignUpdate(event) {
        event.preventDefault();
        if (!editingCampaign) return;
        setBusyId(editingCampaign._id);
        setError("");
        try {
            const form = new FormData(event.currentTarget);
            await creatorApi.updateCampaign(editingCampaign._id, {
                title: String(form.get("title")),
                story: String(form.get("story")),
                rewardInfo: String(form.get("rewardInfo")),
            });
            setNotice("Campaign details updated.");
            setEditingCampaign(null);
            await loadDashboard();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Unable to update campaign.");
        } finally {
            setBusyId("");
        }
    }

    async function deleteCampaign(campaign) {
        const message = "This campaign will be archived if it has contribution history. Continue?";
        if (!window.confirm(message)) return;
        setBusyId(campaign._id);
        setError("");
        try {
            const result = await creatorApi.deleteCampaign(campaign._id);
            setNotice(result.deleted ? "Campaign deleted." : "Campaign archived; contribution history is preserved.");
            await loadDashboard();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Unable to delete campaign.");
        } finally {
            setBusyId("");
        }
    }

    async function reviewContribution(contribution, decision) {
        const action = decision === "approve" ? "Approve this contribution?" : "Reject it and refund the Supporter credits?";
        if (!window.confirm(action)) return;
        setBusyId(contribution._id);
        setError("");
        try {
            await creatorApi.reviewContribution(contribution._id, decision);
            setNotice(decision === "approve" ? "Contribution approved." : "Contribution rejected and Supporter credits refunded.");
            if (viewingContribution?._id === contribution._id) setViewingContribution(null);
            await loadDashboard();
        } catch (reviewError) {
            setError(reviewError instanceof Error ? reviewError.message : "Unable to review contribution.");
        } finally {
            setBusyId("");
        }
    }

    async function submitWithdrawal(event) {
        event.preventDefault();
        setError("");
        setNotice("");
        setBusyId("withdrawal");
        try {
            const result = await creatorApi.createWithdrawal(Number(withdrawCredits), paymentSystem, accountNumber);
            setNotice(`Withdrawal request submitted for ${formatCredits(result.withdrawal.withdrawalCredits)}.`);
            setWithdrawCredits("");
            setAccountNumber("");
            await loadDashboard();
        } catch (withdrawError) {
            setError(withdrawError instanceof Error ? withdrawError.message : "Unable to submit withdrawal.");
        } finally {
            setBusyId("");
        }
    }

    if (loading) return <section aria-busy="true" className="creator-loading">Loading Creator workspace…</section>;

    return (
        <section className="creator-workspace">
            <header className="creator-workspace__heading">
                <div>
                    <p className="section-eyebrow">Creator workspace</p>
                    <h2>{section === "new-campaign" ? "Add New Campaign" : section === "campaigns" ? "My Campaigns" : section === "contributions" ? "Contributions To Review" : section === "withdrawals" ? "Withdrawals" : section === "payments" ? "Payment History" : "Creator Home"}</h2>
                </div>
                <div className="creator-workspace__actions">
                    <span className="creator-user-label">{user.name || user.email}</span>
                    <button aria-label="Refresh Creator data" className="creator-icon-button" disabled={refreshing} onClick={() => loadDashboard(true)} type="button">
                        <FiRefreshCw aria-hidden="true" />
                    </button>
                </div>
            </header>

            {(error || notice) && (
                <div aria-live="polite" className={error ? "creator-message creator-message--error" : "creator-message"} role={error ? "alert" : "status"}>
                    {error || notice}
                </div>
            )}

            {section === "home" && (
                <>
                    <div className="creator-stat-grid">
                        <SummaryTile label="Total campaigns" value={summary.totalCampaigns} note="All campaigns you have submitted" />
                        <SummaryTile label="Active campaigns" value={summary.activeCampaigns} note="Approved and before deadline" />
                        <SummaryTile label="Total amount raised" value={formatCredits(summary.totalRaisedCredits)} note="Across approved contributions" />
                    </div>
                    <section className="creator-home-shortcuts">
                        <div>
                            <p className="section-eyebrow">Next steps</p>
                            <h3>Keep your projects moving.</h3>
                        </div>
                        <Link href="/dashboard?section=new-campaign">Add a campaign <FiArrowRight aria-hidden="true" /></Link>
                        <Link href="/dashboard?section=contributions">Review {pendingContributions.length} pending contributions <FiArrowRight aria-hidden="true" /></Link>
                    </section>
                </>
            )}

            {section === "new-campaign" && (
                <section className="creator-section">
                    <p className="creator-section__note">New campaigns are saved as pending and become visible to Supporters after Admin approval.</p>
                    <form className="creator-form" onSubmit={submitCampaign}>
                        <CampaignFields prefix="create" />
                        <div className="creator-form__actions">
                            <button className="creator-button creator-button--primary" disabled={busyId === "campaign-create"} type="submit">
                                <FiPlus aria-hidden="true" /> {busyId === "campaign-create" ? "Submitting…" : "Add Campaign"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {section === "campaigns" && (
                <section className="creator-section">
                    <div className="creator-section__toolbar">
                        <p className="creator-section__note">Sorted by nearest deadline first. Campaigns with contribution history are archived on delete.</p>
                        <button className="creator-button creator-button--primary" onClick={() => setShowCampaignForm(true)} type="button">
                            <FiPlus aria-hidden="true" /> Add campaign
                        </button>
                    </div>
                    <div className="creator-table-wrap">
                        <table className="creator-table">
                            <thead><tr><th>Campaign</th><th>Status</th><th>Raised</th><th>Goal</th><th>Deadline</th><th>Actions</th></tr></thead>
                            <tbody>
                                {campaigns.length === 0 ? (
                                    <tr><td className="creator-table__empty" colSpan={6}>No campaigns yet. Add your first one to get started.</td></tr>
                                ) : campaigns.map((campaign) => (
                                    <tr key={campaign._id}>
                                        <td><div className="creator-campaign-cell"><Image alt="" height={44} src={campaign.imageUrl} unoptimized width={64} /><span><strong>{campaign.title}</strong><small>{campaign.category}</small></span></div></td>
                                        <td><span className={`creator-status creator-status--${campaign.status}`}>{campaignStatus(campaign)}</span></td>
                                        <td>{formatCredits(campaign.raisedCredits)}</td>
                                        <td>{formatCredits(campaign.fundingGoal)}</td>
                                        <td>{formatDate(campaign.deadline)}</td>
                                        <td><div className="creator-row-actions">
                                            <button className="creator-button" disabled={campaign.lifecycle === "archived" || busyId === campaign._id} onClick={() => setEditingCampaign(campaign)} type="button">Update</button>
                                            <button aria-label={`Delete or archive ${campaign.title}`} className="creator-icon-button" disabled={campaign.lifecycle === "archived" || busyId === campaign._id} onClick={() => deleteCampaign(campaign)} title="Delete or archive campaign" type="button"><FiArchive aria-hidden="true" /></button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {section === "contributions" && (
                <section className="creator-section">
                    <p className="creator-section__note">Approving adds credits to campaign totals and payout balance. Rejecting returns reserved credits to the Supporter.</p>
                    <div className="creator-table-wrap">
                        <table className="creator-table">
                            <thead><tr><th>Supporter</th><th>Campaign</th><th>Contribution</th><th>Received</th><th>Details</th><th>Actions</th></tr></thead>
                            <tbody>
                                {pendingContributions.length === 0 ? (
                                    <tr><td className="creator-table__empty" colSpan={6}>No pending contributions to review.</td></tr>
                                ) : pendingContributions.map((contribution) => (
                                    <tr key={contribution._id}>
                                        <td>{contribution.supporterName || "Supporter"}</td>
                                        <td>{contribution.campaignTitle}</td>
                                        <td>{formatCredits(contribution.amountCredits)}</td>
                                        <td>{formatDate(contribution.createdAt)}</td>
                                        <td><button className="creator-button" onClick={() => setViewingContribution(contribution)} type="button">View contribution</button></td>
                                        <td><div className="creator-row-actions">
                                            <button className="creator-button creator-button--approve" disabled={busyId === contribution._id} onClick={() => reviewContribution(contribution, "approve")} type="button">Approve</button>
                                            <button className="creator-button creator-button--reject" disabled={busyId === contribution._id} onClick={() => reviewContribution(contribution, "reject")} type="button">Reject</button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {section === "withdrawals" && (
                <section className="creator-section creator-withdrawals">
                    <div className="creator-stat-grid creator-stat-grid--two">
                        <SummaryTile label="Total credits raised" value={formatCredits(summary.totalEarnedCredits)} note="Approved contributions only" />
                        <SummaryTile label="Available to request" value={formatCredits(summary.availablePayoutCredits)} note="20 credits = $1.00" />
                    </div>
                    <form className="creator-form creator-form--withdrawal" onSubmit={submitWithdrawal}>
                        <div className="creator-form__heading"><h3>Request a withdrawal</h3><p>Requests are saved as pending for admin processing. Minimum earned balance: 200 credits ($10).</p></div>
                        <label className="creator-field"><span>Credits to withdraw</span><input max={summary.availablePayoutCredits} min="1" onChange={(event) => setWithdrawCredits(event.target.value)} required step="1" type="number" value={withdrawCredits} /></label>
                        <label className="creator-field"><span>Withdrawal amount (USD)</span><input readOnly value={`$${withdrawAmount}`} /></label>
                        <label className="creator-field"><span>Payment system</span><select onChange={(event) => setPaymentSystem(event.target.value)} value={paymentSystem}>{PAYMENT_SYSTEMS.map((system) => <option key={system}>{system}</option>)}</select></label>
                        <label className="creator-field"><span>Account number</span><input autoComplete="off" maxLength={80} onChange={(event) => setAccountNumber(event.target.value)} required value={accountNumber} /></label>
                        {summary.totalEarnedCredits < 200 || summary.availablePayoutCredits <= 0 ? (
                            <p className="creator-insufficient">Insufficient credit</p>
                        ) : (
                            <button className="creator-button creator-button--primary" disabled={busyId === "withdrawal"} type="submit">{busyId === "withdrawal" ? "Submitting…" : "Withdraw"}</button>
                        )}
                    </form>
                </section>
            )}

            {section === "payments" && (
                <section className="creator-section">
                    <p className="creator-section__note">Withdrawal requests and their processing status. This dashboard records requests; transfers are handled separately.</p>
                    <div className="creator-table-wrap">
                        <table className="creator-table">
                            <thead><tr><th>Request date</th><th>Credits</th><th>Amount</th><th>Payment system</th><th>Status</th></tr></thead>
                            <tbody>
                                {withdrawals.length === 0 ? (
                                    <tr><td className="creator-table__empty" colSpan={5}>No withdrawal requests yet.</td></tr>
                                ) : withdrawals.map((withdrawal) => (
                                    <tr key={withdrawal._id}>
                                        <td>{formatDate(withdrawal.createdAt)}</td>
                                        <td>{formatCredits(withdrawal.withdrawalCredits)}</td>
                                        <td>{formatMoney(withdrawal.withdrawalAmountCents)}</td>
                                        <td>{withdrawal.paymentSystem}</td>
                                        <td><span className={`creator-status creator-status--${withdrawal.status}`}>{withdrawal.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {showCampaignForm && (
                <CreatorModal title="Add New Campaign" onClose={() => setShowCampaignForm(false)}>
                    <form className="creator-form creator-form--modal" onSubmit={submitCampaign}>
                        <CampaignFields prefix="create" />
                        <button className="creator-button creator-button--primary" disabled={busyId === "campaign-create"} type="submit">{busyId === "campaign-create" ? "Submitting…" : "Add Campaign"}</button>
                    </form>
                </CreatorModal>
            )}

            {editingCampaign && (
                <CreatorModal title="Update Campaign" onClose={() => setEditingCampaign(null)}>
                    <form className="creator-form creator-form--modal" onSubmit={submitCampaignUpdate}>
                        <CampaignFields campaign={editingCampaign} prefix="edit" />
                        <button className="creator-button creator-button--primary" disabled={busyId === editingCampaign._id} type="submit">Save changes</button>
                    </form>
                </CreatorModal>
            )}

            {viewingContribution && (
                <CreatorModal title="Contribution details" onClose={() => setViewingContribution(null)}>
                    <dl className="creator-contribution-details">
                        <div><dt>Supporter</dt><dd>{viewingContribution.supporterName || "Supporter"}</dd></div>
                        <div><dt>Campaign</dt><dd>{viewingContribution.campaignTitle}</dd></div>
                        <div><dt>Contribution</dt><dd>{formatCredits(viewingContribution.amountCredits)}</dd></div>
                        <div><dt>Message</dt><dd>{viewingContribution.message || "No message provided."}</dd></div>
                    </dl>
                    <div className="creator-modal__actions">
                        <button className="creator-button creator-button--approve" disabled={busyId === viewingContribution._id} onClick={() => reviewContribution(viewingContribution, "approve")} type="button">Approve</button>
                        <button className="creator-button creator-button--reject" disabled={busyId === viewingContribution._id} onClick={() => reviewContribution(viewingContribution, "reject")} type="button">Reject and refund</button>
                    </div>
                </CreatorModal>
            )}
        </section>
    );
}