import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { initSentry } from "@/lib/sentry";
import RootLayoutClient from "./RootLayoutClient";

// Initialize Sentry
initSentry();

export const metadata: Metadata = {
  title: {
    default: "Arena Africa | Africa-First, Global Prediction Markets",
    template: "%s | Arena Africa",
  },
  description:
    "An API-first prediction platform for local, pan-African and global markets across web, mobile and USSD, with mobile-money-ready wallets and community pools.",
  applicationName: "Arena Africa",
  keywords: [
    "prediction markets",
    "Africa fintech",
    "USSD",
    "mobile money",
    "M-Pesa",
    "MTN MoMo",
    "global markets",
  ],
  icons: { icon: "/icon.svg" },
};

// Applies the persisted theme before paint so the page never flashes the
// wrong palette. Light is the default whenever nothing has been stored yet.
const THEME_INIT_SCRIPT = `
  try {
    var t = window.localStorage.getItem("arena-theme");
    if (t === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-white text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-100">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}