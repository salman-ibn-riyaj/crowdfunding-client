import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export default function TopFundedCampaigns({ campaigns }) {
  const topCampaigns = [...campaigns].sort((first, second) => second.amount - first.amount);

  return (
    <section aria-labelledby="top-campaigns-title" className="home-section campaigns-section home-reveal">
      <div className="section-heading section-heading--split">
        <div>
          <p className="section-eyebrow">Top funded · sample data</p>
          <h2 id="top-campaigns-title">Small ideas. Serious momentum.</h2>
        </div>
        <p className="section-heading__note">Illustrative campaigns and credit totals for preview only.</p>
      </div>
      <div className="campaign-grid">
        {topCampaigns.map((campaign) => (
          <article className="campaign-card" key={campaign.id}>
            <Link aria-label={`View ${campaign.title}`} className="campaign-card__image" href="/campaigns">
              <Image
                alt={campaign.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
                src={campaign.image}
              />
              <span className="campaign-card__category">{campaign.category}</span>
            </Link>
            <div className="campaign-card__body">
              <h3><Link href="/campaigns">{campaign.title}</Link></h3>
              <div className="campaign-card__funding">
                <span>Raised <strong>{campaign.amount.toLocaleString()} credits</strong></span>
                <FiArrowRight aria-hidden="true" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}