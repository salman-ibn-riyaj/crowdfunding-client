import { Suspense } from "react";
import CampaignsList from "./CampaignsList";

export const metadata = {
  title: "Explore Campaigns · crowdfunding",
  description: "Discover active crowdfunding campaigns and back ideas worth building.",
};

export default function CampaignsPage() {
  return (
    <main className="campaigns-page">
      <header className="campaigns-page__header">
        <div className="campaigns-page__header-inner">
          <p className="section-eyebrow">Explore</p>
          <h1>Active Campaigns</h1>
          <p className="campaigns-page__subtitle">
            Discover projects looking for supporters like you. Every credit you contribute moves an idea closer to reality.
          </p>
        </div>
      </header>
      <div className="campaigns-page__body">
        <Suspense fallback={<p className="campaigns-loading">Loading campaigns…</p>}>
          <CampaignsList />
        </Suspense>
      </div>
    </main>
  );
}
