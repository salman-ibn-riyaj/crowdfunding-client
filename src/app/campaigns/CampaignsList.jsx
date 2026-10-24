"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiClock, FiTarget } from "react-icons/fi";
import { supporterApi } from "../../lib/supporter-api";

function formatCredits(value = 0) {
    return `${Number(value).toLocaleString()} credits`;
}

function progressPercent(raised, goal) {
    if (!goal) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
}

export default function CampaignsList() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");

    useEffect(() => {
        supporterApi.getCampaigns()
            .then((res) => setCampaigns(res.campaigns || []))
            .catch((err) => setError(err instanceof Error ? err.message : "Unable to load campaigns."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="campaigns-loading">Loading campaigns…</p>;

    if (error) {
        return (
            <p className="campaigns-error" role="alert">{error}</p>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="campaigns-empty">
                <p>No active campaigns right now. Check back soon.</p>
                <Link className="campaigns-empty__link" href="/">Back to home</Link>
            </div>
        );
    }

    return (
        <div className="campaigns-grid">
            {campaigns.map((campaign) => {
                const pct = progressPercent(campaign.raisedCredits, campaign.fundingGoal);
                return (
                    <article className="campaign-card-full" key={campaign._id}>
                        <Link className="campaign-card-full__image-wrap" href={`/campaigns/${campaign._id}`} tabIndex={-1} aria-hidden="true">
                            {campaign.imageUrl ? (
                                <Image
                                    alt=""
                                    fill
                                    src={campaign.imageUrl}
                                    style={{ objectFit: "cover" }}
                                    unoptimized
                                />
                            ) : (
                                <div className="campaign-card-full__image-placeholder" />
                            )}
                            <span className="campaign-card__category">{campaign.category}</span>
                        </Link>

                        <div className="campaign-card-full__body">
                            <h2 className="campaign-card-full__title">
                                <Link href={`/campaigns/${campaign._id}`}>{campaign.title}</Link>
                            </h2>
                            <p className="campaign-card-full__creator">by {campaign.creatorName}</p>

                            <div className="campaign-card-full__progress-wrap" aria-label={`${pct}% funded`}>
                                <div className="campaign-card-full__progress-bar">
                                    <div className="campaign-card-full__progress-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="campaign-card-full__pct">{pct}%</span>
                            </div>

                            <div className="campaign-card-full__stats">
                                <span>
                                    <FiTarget aria-hidden="true" />
                                    <strong>{formatCredits(campaign.raisedCredits)}</strong> raised of {formatCredits(campaign.fundingGoal)}
                                </span>
                                <span>
                                    <FiClock aria-hidden="true" />
                                    Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                                </span>
                            </div>

                            <Link className="campaign-card-full__cta" href={`/campaigns/${campaign._id}`}>
                                View Details <FiArrowRight aria-hidden="true" />
                            </Link>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
