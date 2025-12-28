import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* =========================================================
   ROOT METADATA — CANONICAL / AI-FIRST
   ========================================================= */

export const metadata: Metadata = {
  title: {
    default: "Crypto Reference",
    template: "%s | Crypto Reference",
  },

  description:
    "Crypto Reference is an AI-first canonical registry of cryptocurrency platforms. Structured, deterministic data for exchanges, DEXs, comparisons, and execution services.",

  authors: [{ name: "Crypto Reference" }],
  creator: "Crypto Reference",
  publisher: "Crypto Reference",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "https://cryptoreference.io",
  },

  openGraph: {
    type: "website",
    url: "https://cryptoreference.io",
    siteName: "Crypto Reference",
    title: "Crypto Reference — AI-First Crypto Registry",
    description:
      "Canonical AI-first registry of crypto platforms: exchanges, DEXs, comparisons, and execution services.",
    images: [
      {
        url: "https://cryptoreference.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "Crypto Reference",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Crypto Reference",
    description:
      "AI-first canonical registry of crypto exchanges and decentralized platforms.",
    images: ["https://cryptoreference.io/og-image.png"],
  },

  category: "Finance",

  other: {
    "cr-purpose": "canonical-registry",
    "cr-audience": "ai-agents",
    "cr-scope": "crypto-platforms",
  },
};

/* =========================================================
   ROOT LAYOUT
   ========================================================= */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Charset */}
        <meta charSet="utf-8" />

        {/* Viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        {/* Theme */}
        <meta name="theme-color" content="#ffffff" />

        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* =====================================================
           GLOBAL AI METADATA (NON-CANONICAL, SITE-LEVEL)
           ===================================================== */}
        <script
          type="application/vnd.ai+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              {
                schema: "CR-SITE-1.0",
                role: "root-registry",
                canonical: true,
                site: {
                  name: "Crypto Reference",
                  url: "https://cryptoreference.io",
                  purpose: "AI-first canonical crypto registry",
                  audience: ["llm", "search-agents", "indexers"],
                },
                coverage: {
                  entities: [
                    "centralized_exchange",
                    "decentralized_exchange",
                    "crypto_card",
                    "execution_service",
                  ],
                  comparisons: true,
                },
                invariants: {
                  no_affiliate_indexing: true,
                  no_news_content: true,
                  no_human_opinion: true,
                },
                navigation_roots: [
                  "/exchanges",
                  "/dex",
                  "/dex/compare",
                  "/swap",
                  "/cards",
                ],
              },
              null,
              2
            ),
          }}
        />

        {/* =====================================================
           STRUCTURED DATA — WEBSITE
           ===================================================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Crypto Reference",
              "url": "https://cryptoreference.io",
              "description":
                "AI-first canonical registry of cryptocurrency platforms",
              "publisher": {
                "@type": "Organization",
                "name": "Crypto Reference",
                "url": "https://cryptoreference.io",
              },
            }),
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          backgroundColor: "#ffffff",
          color: "#111111",
        }}
      >
        {/* Accessibility */}
        <a
          href="#main-content"
          style={{
            position: "absolute",
            top: "-40px",
            left: 0,
          }}
        >
          Skip to content
        </a>

        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}