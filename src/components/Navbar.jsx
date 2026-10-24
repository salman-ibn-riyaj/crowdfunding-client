"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiArrowUpRight,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSun,
  FiX,
} from "react-icons/fi";

const THEME_STORAGE_KEY = "crowdfunding-theme";
const DEVELOPER_REPOSITORY = "https://github.com/salman-ibn-riyaj/crowdfunding-client";

function readTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export default function Navbar({ user = null, availableCredits = null, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event) => {
      try {
        if (localStorage.getItem(THEME_STORAGE_KEY) === null) {
          document.documentElement.dataset.theme = event.matches ? "dark" : "light";
        }
      } catch {
        document.documentElement.dataset.theme = event.matches ? "dark" : "light";
      }
    };

    systemTheme.addEventListener("change", syncSystemTheme);
    return () => systemTheme.removeEventListener("change", syncSystemTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = readTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The current-page theme still changes when storage is unavailable.
    }
  }

  const navItems = user
    ? [{ href: "/dashboard", label: "Dashboard" }]
    : [
        { href: "/campaigns", label: "Explore Campaigns" },
        { href: "/login", label: "Login" },
      ];

  return (
    <header className="site-header">
      <div className="navbar">
        <Link className="navbar__brand" href="/" onClick={() => setMenuOpen(false)}>
          <span aria-hidden="true" className="navbar__brand-mark">
            c
          </span>
          <span>crowdfunding</span>
        </Link>

        <nav aria-label="Primary navigation">
          <ul
            className="navbar__links"
            data-open={menuOpen}
            id="primary-navigation"
            onClick={() => setMenuOpen(false)}
          >
            {navItems.map(({ href, label }) => (
              <li key={href}>
                <Link className="navbar__link" href={href}>
                  {label}
                </Link>
              </li>
            ))}
            {!user && (
              <li>
                <Link className="navbar__link" href="/register">
                  Register
                </Link>
              </li>
            )}
            {user && (
              <li className="navbar__account">
                <span className="navbar__credits">
                  Available credits
                  <strong>{availableCredits ?? "—"}</strong>
                </span>
                <Link className="navbar__profile" href={user.profileHref || "/dashboard"}>
                  {user.name || user.email || "Profile"}
                </Link>
                <button
                  className="navbar__logout"
                  disabled={!onLogout}
                  onClick={onLogout}
                  title={onLogout ? "Log out" : "Connect logout handling to enable"}
                  type="button"
                >
                  <FiLogOut aria-hidden="true" />
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>

        <div className="navbar__actions">
          <a
            aria-label="Join as Developer (opens in a new tab)"
            className="navbar__join"
            href={DEVELOPER_REPOSITORY}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>Join as Developer</span>
            <FiArrowUpRight aria-hidden="true" />
          </a>
          <button
            aria-label="Switch between light and dark themes"
            className="navbar__icon-button"
            onClick={toggleTheme}
            title="Switch color theme"
            type="button"
          >
            <FiSun aria-hidden="true" className="navbar__theme-sun" />
            <FiMoon aria-hidden="true" className="navbar__theme-moon" />
          </button>
          <button
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="navbar__menu-button"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            {menuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}