"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiBell, FiLogOut } from "react-icons/fi";
import { authClient } from "../../lib/auth-client";
import { completeRoleOnboarding } from "../../lib/account-api";
import CreatorDashboard from "./CreatorDashboard";
import SupporterDashboard from "./SupporterDashboard";
import AdminDashboard from "./AdminDashboard";

const ROLE_NAVIGATION = {
    supporter: [
        { key: "home", label: "Home" },
        { key: "campaigns", label: "Explore Campaigns" },
        { key: "contributions", label: "My Contributions" },
        { key: "credits", label: "Purchase Credit" },
        { key: "payments", label: "Payment History" },
    ],
    creator: [
        { key: "home", label: "Home" },
        { key: "contributions", label: "Contributions To Review" },
        { key: "new-campaign", label: "Add New Campaign" },
        { key: "campaigns", label: "My Campaigns" },
        { key: "withdrawals", label: "Withdrawals" },
        { key: "payments", label: "Payment History" },
    ],
    admin: [
        { key: "home", label: "Home" },
        { key: "approvals", label: "Campaign Approvals" },
        { key: "campaigns", label: "Manage Campaigns" },
        { key: "users", label: "Manage Users" },
        { key: "withdrawals", label: "Withdrawal Requests" },
        { key: "reports", label: "Reports" },
    ],
};

function getInitials(name = "") {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function RoleOnboarding({ onComplete }) {
    const [role, setRole] = useState("supporter");
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);

    async function submitRole(event) {
        event.preventDefault();
        setError("");
        setPending(true);
        try {
            await completeRoleOnboarding(role);
            await onComplete();
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Unable to complete account setup.");
        } finally {
            setPending(false);
        }
    }

    return (
        <section aria-labelledby="role-onboarding-title" className="dashboard-onboarding">
            <p className="section-eyebrow">One last step</p>
            <h1 id="role-onboarding-title">Choose how you want to take part.</h1>
            <p>Your role cannot be changed after setup. Initial credits are granted once.</p>
            <form onSubmit={submitRole}>
                <label className="auth-field">
                    <span>Account role</span>
                    <select onChange={(event) => setRole(event.target.value)} value={role}>
                        <option value="supporter">Supporter · 50 starting credits</option>
                        <option value="creator">Creator · 20 starting credits</option>
                    </select>
                </label>
                {error && <p aria-live="polite" className="auth-form__error" role="alert">{error}</p>}
                <button className="auth-form__submit" disabled={pending} type="submit">
                    {pending ? "Setting up…" : "Continue to dashboard"}
                </button>
            </form>
        </section>
    );
}

export default function DashboardShell() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, isPending, refetch } = authClient.useSession();
    const user = session?.user;
    const role = user?.role;
    const onboardingRequired = role === "pending" || user?.roleOnboarded !== true;
    const navigation = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.supporter;
    const sectionKey = searchParams.get("section") || "home";
    const activeItem = navigation.find((item) => item.key === sectionKey) || navigation[0];

    useEffect(() => {
        if (!isPending && !user) router.replace("/login");
    }, [isPending, router, user]);

    async function logout() {
        await authClient.signOut();
        router.replace("/");
        router.refresh();
    }

    async function refreshAfterOnboarding() {
        await authClient.getSession({ query: { disableCookieCache: true } });
        await refetch();
        router.replace("/dashboard");
    }

    if (isPending) {
        return <main aria-busy="true" className="dashboard-loading">Loading your dashboard…</main>;
    }

    if (!user) {
        return <main className="dashboard-loading">Redirecting to sign in…</main>;
    }

    if (onboardingRequired && role !== "admin") {
        return <main className="dashboard-page"><RoleOnboarding onComplete={refreshAfterOnboarding} /></main>;
    }

    return (
        <main className="dashboard-page">
            <header className="dashboard-heading">
                <div className="dashboard-heading__identity">
                    <div aria-hidden="true" className="dashboard-avatar">
                        {user.image ? (
                            <Image alt="" height={52} src={user.image} unoptimized width={52} />
                        ) : getInitials(user.name)}
                    </div>
                    <div>
                        <p className="section-eyebrow">{role} account</p>
                        <h1>{user.name || user.email}</h1>
                    </div>
                </div>
                <div className="dashboard-heading__actions">
                    <span className="dashboard-credit-count">{user.credits ?? 0} <small>credits</small></span>
                    <button aria-label="Notifications are not available yet" className="dashboard-icon-button" disabled title="Notifications will be available with the dashboard plans" type="button">
                        <FiBell aria-hidden="true" />
                    </button>
                    <button className="dashboard-logout" onClick={logout} type="button">
                        <FiLogOut aria-hidden="true" /> Sign out
                    </button>
                </div>
            </header>

            <div className="dashboard-layout">
                <nav aria-label={`${role} dashboard navigation`} className="dashboard-nav">
                    <p>Workspace</p>
                    {navigation.map((item) => (
                        <Link
                            aria-current={activeItem.key === item.key ? "page" : undefined}
                            className="dashboard-nav__link"
                            href={item.key === "home" ? "/dashboard" : `/dashboard?section=${item.key}`}
                            key={item.key}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <section
                    aria-label={role === "creator" ? "Creator dashboard workspace" : role === "supporter" ? "Supporter dashboard workspace" : role === "admin" ? "Admin dashboard workspace" : undefined}
                    aria-labelledby={["creator", "supporter", "admin"].includes(role) ? undefined : "dashboard-section-title"}
                    className="dashboard-content"
                >
                    {role === "creator" ? (
                        <CreatorDashboard section={sectionKey} user={user} />
                    ) : role === "supporter" ? (
                        <SupporterDashboard section={sectionKey} user={user} />
                    ) : role === "admin" ? (
                        <AdminDashboard section={sectionKey} user={user} />
                    ) : (
                        <>
                            <p className="section-eyebrow">{role} workspace</p>
                            <h2 id="dashboard-section-title">{activeItem.label}</h2>
                            <p>
                                Your {activeItem.label.toLowerCase()} area is ready for its detailed workflow. This shell is connected to your account and role; the section features will follow your dashboard specifications.
                            </p>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}