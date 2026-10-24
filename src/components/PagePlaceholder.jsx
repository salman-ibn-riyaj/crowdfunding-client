import Link from "next/link";

export default function PagePlaceholder({
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref = "/",
}) {
  return (
    <main className="placeholder-page">
      <p className="placeholder-page__eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <Link className="home-page__primary" href={actionHref}>
        {actionLabel}
      </Link>
    </main>
  );
}