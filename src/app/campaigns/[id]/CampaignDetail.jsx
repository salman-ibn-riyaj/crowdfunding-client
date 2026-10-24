"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiClock, FiTarget, FiUsers } from "react-icons/fi";
import { authClient } from "../../../lib/auth-client";
import { supporterApi } from "../../../lib/supporter-api";

function formatCredits(value = 0) {
    return `${Number(value).toLocaleString()} credits`;
}

function progressPercent(raised, goal) {
    if (!goal) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
}

export default function CampaignDetail({ id }) {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const user = session?.user;

    const [campaign, setCampaign]   = useState(null);
    const [loading, setLoading]     = useState(true);
    const [fetchError, setFetchError] = useState("");

    const [amount, setAmount]       = useState("");
    const [message, setMessage]     = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitNotice, setSubmitNotice] = useState("");

    useEffect(() => {
        if (!id) return;
        supporterApi.getCampaign(id)
            .then((res) => setCampaign(res.campaign))
            .catch((err) => setFetchError(err instanceof Error ? err.message : "Campaign not found."))
            .finally(() => setLoading(false));
    }, [id]);

    async function handleContribute(event) {
        event.preventDefault();
        if (!user) { router.push("/login"); return; }
        if (user.role !== "supporter") {
            setSubmitError("Only Supporter accounts can contribute to campaigns.");
            return;
        }

        const amountCredits = Number(amount);
        if (!Number.isInteger(amountCredits) || amountCredits <= 0) {
            setSubmitError("Enter a valid whole number of credits.");
            return;
        }

        setSubmitting(true);
        setSubmitError("");
        setSubmitNotice("");
        try {
            await supporterApi.contribute(id, amountCredits, message);
            setSubmitNotice(`Your contribution of ${formatCredits(amountCredits)} has been submitted and is pending creator approval.`);
            setAmount("");
            setMessage("");
            // Refresh campaign data to show updated pendingCredits
            const res = await supporterApi.getCampaign(id);
            setCampaign(res.campaign);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Unable to submit contribution.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <p className="campaigns-loading">Loading campaign…</p>;

    if (fetchError) {
        return (
            <div className="campaign-detail__error">
                <p role="alert">{fetchError}</p>
                <Link className="campaign-detail__back" href="/campaigns">
                    <FiArrowLeft aria-hidden="true" /> Back to campaigns
                </Link>
            </div>
        );
    }

    if (!campaign) return null;

    const pct = progressPercent(campaign.raisedCredits, campaign.fundingGoal);
    const isSupporter = user?.role === "supporter";
    const isLoggedIn  = Boolean(user);

    return (
        <div className="campaign-detail">
            <Link className="campaign-detail__back" href="/campaigns">
                <FiArrowLeft aria-hidden="true" /> Back to campaigns
            </Link>

            <div className="campaign-detail__layout">
                {/* ── Left column: campaign info ── */}
                <div className="campaign-detail__main">
                    {campaign.imageUrl && (
                        <div className="campaign-detail__image-wrap">
                            <Image
                                alt={campaign.title}
                                fill
                                priority
                                src={campaign.imageUrl}
                                style={{ objectFit: "cover" }}
                                unoptimized
                            />
                            <span className="campaign-card__category">{campaign.category}</span>
                        </div>
                    )}

                    <h1 className="campaign-detail__title">{campaign.title}</h1>
                    <p className="campaign-detail__creator">Campaign by <strong>{campaign.creatorName}</strong></p>

                    {/* Progress */}
                    <div className="campaign-detail__progress-wrap" aria-label={`${pct}% funded`}>
                        <div className="campaign-detail__progress-bar">
                            <div className="campaign-detail__progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="campaign-detail__pct">{pct}% funded</span>
                    </div>

                    <div className="campaign-detail__stats">
                        <div className="campaign-detail__stat">
                            <FiTarget aria-hidden="true" />
                            <strong>{formatCredits(campaign.raisedCredits)}</strong>
                            <small>raised of {formatCredits(campaign.fundingGoal)}</small>
                        </div>
                        <div className="campaign-detail__stat">
                            <FiClock aria-hidden="true" />
                            <strong>{new Date(campaign.deadline).toLocaleDateString()}</strong>
                            <small>deadline</small>
                        </div>
                        <div className="campaign-detail__stat">
                            <FiUsers aria-hidden="true" />
                            <strong>{formatCredits(campaign.minimumContribution)}</strong>
                            <small>minimum contribution</small>
                        </div>
                    </div>

                    <section className="campaign-detail__story">
                        <h2>About this campaign</h2>
                        <p>{campaign.story}</p>
                    </section>

                    <section className="campaign-detail__reward">
                        <h2>Supporter rewards</h2>
                        <p>{campaign.rewardInfo}</p>
                    </section>
                </div>

                {/* ── Right column: contribution form ── */}
                <aside className="campaign-detail__sidebar">
                    <div className="campaign-detail__contribute-card">
                        <h2>Back this campaign</h2>
                        <p className="campaign-detail__contribute-note">
                            Credits are deducted immediately and refunded if your contribution is rejected.
                            Minimum: {formatCredits(campaign.minimumContribution)}.
                        </p>

                        {submitNotice && (
                            <div aria-live="polite" className="creator-message" role="status">
                                {submitNotice}
                            </div>
                        )}
                        {submitError && (
                            <div aria-live="polite" className="creator-message creator-message--error" role="alert">
                                {submitError}
                            </div>
                        )}

                        {!isLoggedIn && (
                            <div className="campaign-detail__auth-prompt">
                                <p>Sign in as a Supporter to contribute.</p>
                                <Link className="creator-button creator-button--primary" href="/login">
                                    Sign in
                                </Link>
                            </div>
                        )}

                        {isLoggedIn && !isSupporter && (
                            <p className="campaign-detail__role-note">
                                Only Supporter accounts can contribute to campaigns.
                            </p>
                        )}

                        {isSupporter && (
                            <form className="campaign-detail__form" onSubmit={handleContribute}>
                                <label className="creator-field campaign-detail__form-field">
                                    <span>Contribution amount (credits)</span>
                                    <input
                                        min={campaign.minimumContribution}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder={`Min. ${campaign.minimumContribution}`}
                                        required
                                        step="1"
                                        type="number"
                                        value={amount}
                                    />
                                </label>
                                <label className="creator-field campaign-detail__form-field">
                                    <span>Message to creator <small>(optional)</small></span>
                                    <textarea
                                        maxLength={2000}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Share why you're backing this campaign…"
                                        rows={3}
                                        value={message}
                                    />
                                </label>
                                <p className="campaign-detail__balance">
                                    Your balance: <strong>{formatCredits(user.credits ?? 0)}</strong>
                                </p>
                                <button
                                    className="creator-button creator-button--primary campaign-detail__submit"
                                    disabled={submitting}
                                    type="submit"
                                >
                                    {submitting ? "Submitting…" : "Contribute"}
                                </button>
                            </form>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
