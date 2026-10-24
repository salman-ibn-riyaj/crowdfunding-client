import Link from "next/link";
import {
  FiArrowRight,
  FiBookOpen,
  FiCompass,
  FiHeart,
  FiSun,
} from "react-icons/fi";
import HeroSlider from "../components/home/HeroSlider";
import TestimonialsSlider from "../components/home/TestimonialsSlider";
import TopFundedCampaigns from "../components/home/TopFundedCampaigns";
import { CAMPAIGNS, HERO_SLIDES, TESTIMONIALS } from "../components/home/home-content";

export default function Home() {
  return (
    <main className="homepage">
      <HeroSlider slides={HERO_SLIDES} />

      <TopFundedCampaigns campaigns={CAMPAIGNS} />

      <section aria-labelledby="how-it-works-title" className="home-section how-section home-reveal">
        <div className="section-heading">
          <p className="section-eyebrow">Good things grow together</p>
          <h2 id="how-it-works-title">A few steps from idea to impact.</h2>
        </div>
        <ol className="steps-list">
          <li className="step-item">
            <span className="step-item__number">01</span>
            <h3>Find a project</h3>
            <p>Browse community-led ideas and learn what each one hopes to make possible.</p>
          </li>
          <li className="step-item">
            <span className="step-item__number">02</span>
            <h3>Choose your support</h3>
            <p>Use available credits to back the campaigns that matter to you.</p>
          </li>
          <li className="step-item">
            <span className="step-item__number">03</span>
            <h3>Follow the progress</h3>
            <p>Keep up with the people building the idea and the milestones they reach.</p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="categories-title" className="home-section categories-section home-reveal">
        <div className="categories-section__copy">
          <p className="section-eyebrow">Find your kind of change</p>
          <h2 id="categories-title">Ideas worth backing, across every corner.</h2>
          <p>Start with a cause you care about. There is more than one way to move things forward.</p>
          <Link className="text-link" href="/campaigns">
            Explore all campaigns <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
        <ul className="category-list">
          <li><Link href="/campaigns"><FiHeart aria-hidden="true" /><span>Health &amp; wellbeing</span><FiArrowRight aria-hidden="true" /></Link></li>
          <li><Link href="/campaigns"><FiCompass aria-hidden="true" /><span>Community projects</span><FiArrowRight aria-hidden="true" /></Link></li>
          <li><Link href="/campaigns"><FiBookOpen aria-hidden="true" /><span>Education</span><FiArrowRight aria-hidden="true" /></Link></li>
          <li><Link href="/campaigns"><FiSun aria-hidden="true" /><span>Climate &amp; clean energy</span><FiArrowRight aria-hidden="true" /></Link></li>
        </ul>
      </section>

      <TestimonialsSlider testimonials={TESTIMONIALS} />

      <section aria-labelledby="creator-callout-title" className="creator-callout home-reveal">
        <div>
          <p className="section-eyebrow">For the people with an idea</p>
          <h2 id="creator-callout-title">Your next step could start here.</h2>
          <p>Bring your project into focus and invite a community to help you build it.</p>
        </div>
        <Link className="creator-callout__link" href="/register">
          Start your campaign <FiArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}