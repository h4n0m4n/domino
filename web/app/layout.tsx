import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://domino-crisis.vercel.app";

export const metadata: Metadata = {
  title: "Domino — From Global Events to Your Kitchen Table",
  description:
    "Open-source engine that simulates how wars, pandemics & economic crises cascade into YOUR personal budget. 9 real crisis scenarios.",
  keywords: [
    "crisis simulation",
    "personal finance",
    "cascade engine",
    "geopolitics",
    "economic modeling",
    "domino effect",
    "budget impact",
  ],
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Domino — From Global Events to Your Kitchen Table",
    description:
      "See how the Hormuz war cascades through 15 steps into your grocery bill. Open-source crisis simulation engine.",
    url: siteUrl,
    siteName: "Domino",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Domino — From Global Events to Your Kitchen Table",
    description:
      "Open-source engine: wars, crises & pandemics → YOUR personal budget impact. Try 9 real scenarios.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
