import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "../components/Navbar";
import SiteFooter from "../components/SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "crowdfunding",
  description: "Discover campaigns and support ideas worth building.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-initializer" strategy="beforeInteractive">
          {`(() => {
              try {
                const saved = localStorage.getItem("crowdfunding-theme");
                const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                document.documentElement.dataset.theme = saved || (systemDark ? "dark" : "light");
              } catch {
                document.documentElement.dataset.theme = "light";
              }
            })();`}
        </Script>
        <Navbar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
