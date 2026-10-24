import { use } from "react";
import { Suspense } from "react";
import CampaignDetail from "./CampaignDetail";

export const metadata = {
    title: "Campaign Details · crowdfunding",
};

export default function CampaignDetailPage({ params }) {
    // In Next.js 15+, params is a Promise — unwrap it with React.use()
    const { id } = use(params);
    return (
        <main className="campaign-detail-page">
            <Suspense fallback={<p className="campaigns-loading">Loading campaign…</p>}>
                <CampaignDetail id={id} />
            </Suspense>
        </main>
    );
}
