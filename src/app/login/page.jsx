import PagePlaceholder from "../../components/PagePlaceholder";

export default function LoginPage() {
  return (
    <PagePlaceholder
      actionHref="/register"
      actionLabel="Create an account"
      description="Account sign-in is not connected yet. Your supporter and campaign tools will live here."
      eyebrow="Welcome back"
      title="Your next good idea is close."
    />
  );
}