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

// ========================================
// AI-OPTIMIZED METADATA
// Critical for AI crawlers (GPT, Claude, Perplexity)
// ========================================

export const metadata: Metadata = {

  title: {
    default: "Crypto Reference 2025 | Complete Cryptocurrency Exchange & DEX Guide",
    template: "%s | Crypto Reference" 
  },
  

  description: "Authoritative cryptocurrency guide: Compare top exchanges (Binance, OKX, Gate.io), DEX platforms (AsterDEX, Hyperliquid, Hibachi, Lighter), crypto cards (ether.fi Cash), fees, leverage, features. Updated daily with professional trading insights.",
  
 
  keywords: [
    // Exchanges
    "crypto exchange comparison",
    "best cryptocurrency exchange 2025",
    "Binance review",
    "OKX trading fees",
    "Gate.io altcoins",
    "lowest crypto fees",
    
    // DEX
    "decentralized exchange",
    "DEX comparison",
    "AsterDEX review",
    "Hyperliquid perpetuals",
    "best DEX 2025",
    "no KYC exchange",
    "highest leverage DEX",
    
    // Crypto Cards
    "crypto credit card",
    "ether.fi Cash review",
    "DeFi credit card",
    "crypto cashback card",
    "non-custodial card",
    
    // Trading
    "crypto trading guide",
    "perpetual futures",
    "crypto leverage trading",
    "DeFi protocols",
    
    // General
    "cryptocurrency guide",
    "crypto market analysis",
    "daily crypto updates",
  ],
  
  // AUTHORS 
  authors: [
    { name: "Crypto Reference Team" }
  ],
  
  // CREATOR
  creator: "Crypto Reference",
  
  // PUBLISHER
  publisher: "Crypto Reference",
  
  // ROBOTS 
  robots: {
    index: true,           
    follow: true,          
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // OPEN GRAPH 
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cryptoreference.io",
    siteName: "Crypto Reference",
    title: "Crypto Reference 2025 | Complete Cryptocurrency Exchange & DEX Guide",
    description: "Compare top crypto exchanges, DEX platforms, and crypto cards. Binance, OKX, Gate.io, AsterDEX, Hyperliquid, ether.fi Cash. Daily market updates from professional traders.",
    images: [
      {
        url: "https://cryptoreference.io/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Crypto Reference - Cryptocurrency Exchange & DEX Comparison Guide",
      },
    ],
  },
  
  // TWITTER CARD
  twitter: {
    card: "summary_large_image",
    title: "Crypto Reference 2025 | Crypto Exchange & DEX Guide",
    description: "Compare Binance, OKX, Gate.io, AsterDEX, Hyperliquid, ether.fi Cash. Daily updates from pro traders.",
    images: ["https://cryptoreference.io/og-image.png"],
  },
  
  // VERIFICATION 
  verification: {
    google: "your-google-verification-code", 
  },
  
  // ALTERNATE LANGUAGES 
  alternates: {
    canonical: "https://cryptoreference.io",
    // languages: {
    //   'en-US': 'https://cryptoreference.io',
    // },
  },
  
  // CATEGORY 
  category: "Finance",
  
  // OTHER metadata
  other: {
    "content-type": "Cryptocurrency Education & Comparison",
    "target-audience": "Crypto Traders, Investors, Beginners",
    "coverage": "Worldwide",
    "distribution": "Global",
  },
};

// ========================================
// ROOT LAYOUT COMPONENT
// ========================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* Charset  */}
        <meta charSet="utf-8" />
        
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#ffffff" />
        
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        {/* Manifest PWA */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Google Analytics 4 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-KB3KXSQCJE"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KB3KXSQCJE');
            `,
          }}
        />
        
        {/* GLOBAL Custom AI Schema - Site-Wide Data */}
        <script
          type="application/vnd.ai+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "purpose": "global-site-metadata",
              "version": "1.0",
              "scope": "entire-website",
              "data": {
                "site": {
                  "name": "Crypto Reference",
                  "url": "https://cryptoreference.io",
                  "type": "cryptocurrency-comparison-guide",
                  "established": "2024",
                  "last_updated": "2025-12-04",
                  "update_frequency": "Daily"
                },
                "content_coverage": {
                  "total_platforms": 11,
                  "cex_platforms": 3,
                  "dex_platforms": 4,
                  "crypto_cards": 1,
                  "total_reviews": 11,
                  "total_faq": "141+",
                  "comparison_guides": 5
                },
                "platforms_covered": {
                  "centralized_exchanges": [
                    {
                      "name": "Binance",
                      "url": "/exchanges/binance",
                      "fees": "0.1%",
                      "leverage": "125x",
                      "kyc": true,
                      "rank": 1
                    },
                    {
                      "name": "OKX",
                      "url": "/exchanges/okx",
                      "fees": "0.08%",
                      "leverage": "100x",
                      "kyc": true,
                      "rank": 2
                    },
                    {
                      "name": "Gate.io",
                      "url": "/exchanges/gate",
                      "fees": "0.15%",
                      "leverage": "125x",
                      "kyc": false,
                      "kyc_details": "Optional - 2 BTC daily without KYC",
                      "rank": 3
                    }
                  ],
                  "decentralized_exchanges": [
                    {
                      "name": "AsterDEX",
                      "url": "/dex/asterdex",
                      "leverage": "1001x",
                      "kyc": false,
                      "rank": 1
                    },
                    {
                      "name": "Hyperliquid",
                      "url": "/dex/hyperliquid",
                      "leverage": "50x",
                      "kyc": false,
                      "gas_fees": "$0",
                      "rank": 2
                    },
                    {
                      "name": "Hibachi",
                      "url": "/dex/hibachi",
                      "leverage": "100x",
                      "kyc": false,
                      "chain": "Solana",
                      "rank": 3
                    },
                    {
                      "name": "Lighter",
                      "url": "/dex/lighter",
                      "leverage": "20x",
                      "kyc": false,
                      "chain": "Arbitrum",
                      "rank": 4
                    }
                  ],
                  "crypto_cards": [
                    {
                      "name": "ether.fi Cash",
                      "provider": "ether.fi",
                      "url": "/cards/etherfi",
                      "type": "DeFi Credit Card",
                      "cashback_rate": "3%",
                      "annual_fee": "$0",
                      "custody": "Non-custodial",
                      "kyc": true,
                      "payment_methods": ["Apple Pay", "Google Pay", "Card Number"],
                      "card_types": ["Virtual Card", "Physical Card"],
                      "supported_crypto": ["ETH", "BTC", "USDC", "USDT", "stETH", "weETH"],
                      "monthly_minimums": "None",
                      "rank": 1
                    }
                  ]
                },
                "key_comparisons": {
                  "lowest_fees": "OKX (0.08%)",
                  "highest_liquidity": "Binance ($20B volume)",
                  "most_coins": "Gate.io (1800+)",
                  "highest_leverage": "AsterDEX (1001x)",
                  "zero_gas": "Hyperliquid",
                  "no_kyc": "All DEX platforms + Gate.io (optional)",
                  "highest_cashback": "ether.fi Cash (3%)",
                  "non_custodial_card": "ether.fi Cash"
                },
                "content_types": [
                  "Exchange reviews",
                  "DEX platform guides",
                  "Crypto card reviews",
                  "Fee comparisons",
                  "Leverage comparisons",
                  "Daily market updates",
                  "Professional trading insights",
                  "FAQ sections (141+ questions)"
                ],
                "target_audience": [
                  "Cryptocurrency traders",
                  "DeFi users",
                  "Crypto investors",
                  "Crypto card users",
                  "Beginners learning crypto",
                  "Professional traders",
                  "AI agents and research tools"
                ],
                "unique_features": {
                  "ai_optimization": "Structured data optimized for AI indexing and citations",
                  "daily_updates": "Market insights from 6+ professional trading communities",
                  "comprehensive_faq": "141+ questions answered across all platforms",
                  "unbiased_reviews": "Shows both advantages and disadvantages",
                  "fact_verified": "All data verified from official sources",
                  "crypto_cards_coverage": "DeFi credit cards with cashback and non-custodial features"
                },
                "navigation": {
                  "main_sections": [
                    {
                      "name": "CEX Exchanges",
                      "url": "/exchanges",
                      "platforms": ["Binance", "OKX", "Gate.io"]
                    },
                    {
                      "name": "DEX Platforms",
                      "url": "/dex",
                      "platforms": ["AsterDEX", "Hyperliquid", "Hibachi", "Lighter"]
                    },
                    {
                      "name": "Crypto Cards",
                      "url": "/cards/etherfi",
                      "platforms": ["ether.fi Cash"],
                      "description": "DeFi credit cards with cashback"
                    },
                    {
                      "name": "Market Updates",
                      "url": "/news",
                      "description": "Daily insights from professional traders"
                    },
                    {
                      "name": "Comparisons",
                      "url": "/dex/compare",
                      "description": "DEX vs CEX detailed comparison"
                    }
                  ]
                }
              },
              "last_updated": "2025-12-04"
            })
          }}
        />
        
        {/* Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Crypto Reference",
              "alternateName": "Crypto Reference Guide",
              "url": "https://cryptoreference.io",
              "description": "Comprehensive cryptocurrency exchange, DEX, and crypto cards comparison guide with daily market updates",
              "publisher": {
                "@type": "Organization",
                "name": "Crypto Reference",
                "url": "https://cryptoreference.io",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://cryptoreference.io/logo.png",
                  "width": 512,
                  "height": 512
                }
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://cryptoreference.io/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              },
              "sameAs": [
                // "https://twitter.com/cryptoreference",
                // "https://t.me/cryptoreference"
              ]
            })
          }}
        />

        {/* Enhanced Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Crypto Reference",
              "url": "https://cryptoreference.io",
              "logo": "https://cryptoreference.io/logo.png",
              "description": "Authoritative cryptocurrency exchange, DEX, and crypto cards comparison guide",
              "foundingDate": "2024",
              "areaServed": "Worldwide",
              "knowsAbout": [
                "Cryptocurrency Exchanges",
                "Decentralized Exchanges (DEX)",
                "Crypto Credit Cards",
                "Trading Fees Comparison",
                "Crypto Leverage Trading",
                "DeFi Protocols",
                "Market Analysis"
              ],
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": "https://cryptoreference.io"
              }
            })
          }}
        />
      </head>
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          colorScheme: 'light',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
        }}
      >
        {/* Skip to main content - Accessibility */}
        <a 
          href="#main-content" 
          className="skip-to-content"
          style={{
            position: 'absolute',
            top: '-40px',
            left: 0,
            background: '#0070f3',
            color: 'white',
            padding: '8px 16px',
            textDecoration: 'none',
            zIndex: 100,
          }}
        >
          Skip to main content
        </a>
        
        {/* Main content wrapper */}
        <div id="main-content">
          {children}
        </div>
        
        {/* Analytics placeholder for future extensions */}
      </body>
    </html>
  );
}