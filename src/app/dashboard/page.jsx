import PagePlaceholder from "../../components/PagePlaceholder";

export default function DashboardPage() {
  return (
    <PagePlaceholder
      actionHref="/login"
      actionLabel="Go to sign in"
      description="Your campaigns, contributions, and available credits will appear here once account services are connected."
      eyebrow="Dashboard"
      title="Your activity, all in one place."
    />
  );
}