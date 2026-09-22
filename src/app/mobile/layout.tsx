import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Arena Africa Mobile App",
  description: "Mobile app for Arena Africa - Localized P2P Prediction Market",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Arena" />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              });
            }
          `,
        }}
      />
      {children}
    </>
  );
}
