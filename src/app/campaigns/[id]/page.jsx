import { Suspense } from "react";
import CampaignDetail from "./CampaignDetail";

export const metadata = {
    title: "Campaign Details · crowdfunding",
};

async function CampaignContent({ params }) {
    const { id } = await params;
    return <CampaignDetail id={id} />;
}

export default function CampaignDetailPage({ params }) {
    return (
        <main className="campaign-detail-page">
            <Suspense fallback={<p className="campaigns-loading">Loading campaign…</p>}>
                <CampaignContent params={params} />
            </Suspense>
        </main>
    );
}