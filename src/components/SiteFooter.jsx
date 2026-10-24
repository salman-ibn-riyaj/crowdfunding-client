import Link from "next/link";
import { FiFacebook, FiGithub, FiLinkedin } from "react-icons/fi";

const socialProfiles = [
    { href: "https://github.com/salman-ibn-riyaj", label: "GitHub", icon: FiGithub },
    { href: "https://www.linkedin.com/in/salman-ibn-riyaj/", label: "LinkedIn", icon: FiLinkedin },
    { href: "https://www.facebook.com/salmanshahibneriyaj", label: "Facebook", icon: FiFacebook },
];

export default function SiteFooter() {
    return (
        <footer className="site-footer">
            <div className="site-footer__inner">
                <Link aria-label="crowdfunding home" className="site-footer__brand" href="/">
                    <span aria-hidden="true" className="navbar__brand-mark">c</span>
                    <span>crowdfunding</span>
                </Link>
                <p className="site-footer__note">Ideas move further when we back them together.</p>
                <nav aria-label="Social profiles" className="site-footer__socials">
                    {socialProfiles.map(({ href, label, icon: Icon }) => (
                        <a
                            aria-label={`${label} profile (opens in a new tab)`}
                            className="site-footer__social-link"
                            href={href}
                            key={label}
                            rel="noopener noreferrer"
                            target="_blank"
                            title={label}
                        >
                            <Icon aria-hidden="true" />
                        </a>
                    ))}
                </nav>
            </div>
            <div className="site-footer__bottom">
                <span>© crowdfunding</span>
                <span>Support for ideas with a future.</span>
            </div>
        </footer>
    );
}