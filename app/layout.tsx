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
  

  description: "Authoritative cryptocurrency guide: Compare top exchanges (Binance, OKX, Gate.io), DEX platforms (AsterDEX, Hyperliquid, Hibachi, Lighter), fees, leverage, features. Updated daily with professional trading insights.",
  
 
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
    description: "Compare top crypto exchanges and DEX platforms. Binance, OKX, Gate.io, AsterDEX, Hyperliquid. Daily market updates from professional traders.",
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
    description: "Compare Binance, OKX, Gate.io, AsterDEX, Hyperliquid. Daily updates from pro traders.",
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
              "description": "Comprehensive cryptocurrency exchange and DEX comparison guide with daily market updates",
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
      </head>
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          colorScheme: 'light',
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
        }}
      >
        {/* Skip to main content */}
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