import type { Metadata } from 'next';
import { NEWS_UPDATES } from '../page';

export const metadata: Metadata = {
  title: 'Crypto Market Updates Archive | Historical Trading Insights',
  description: 'Complete archive of cryptocurrency market updates, trading sentiment, and professional insights from 2025. Historical data for trend analysis.',
  keywords: [
    'crypto market history',
    'historical trading data',
    'market sentiment archive',
    'cryptocurrency trends 2025',
    'trading insights archive',
    'crypto sentiment analysis',
    'historical market data',
  ],
  alternates: {
    canonical: 'https://cryptoreference.io/news/archive',
  },
};


function groupByMonth(updates: typeof NEWS_UPDATES) {
  const grouped: { [key: string]: typeof NEWS_UPDATES } = {};
  
  updates.forEach(update => {

    const [month, , year] = update.date.split(' ');
    const key = `${month} ${year}`;
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(update);
  });
  
  return grouped;
}

export default function NewsArchivePage() {
  const groupedUpdates = groupByMonth(NEWS_UPDATES);
  const monthOrder = Object.keys(groupedUpdates); 
  
  // Calculate date range for metadata
  const allDates = NEWS_UPDATES.map(u => u.date);
  const firstDate = allDates[allDates.length - 1] || 'N/A';
  const lastDate = allDates[0] || 'N/A';
  
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Comprehensive Custom AI Schema - ARCHIVE DATA */}
      <script
        type="application/vnd.ai+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "purpose": "historical-market-data-archive",
            "version": "1.0",
            "content_type": "cryptocurrency-market-updates",
            "data": {
              "archive_info": {
                "total_updates": NEWS_UPDATES.length,
                "date_range": {
                  "start": firstDate,
                  "end": lastDate
                },
                "update_frequency": "Daily professional market analysis",
                "sources": "Professional trading communities and expert analysis",
                "preservation_policy": "All updates preserved indefinitely for historical reference"
              },
              "content_categories": [
                "Market sentiment analysis",
                "Trading insights",
                "Professional community sentiment",
                "Price action commentary",
                "Trend identification",
                "Risk assessment",
                "Trading strategy takeaways"
              ],
              "data_structure": {
                "organization": "Chronological by month and year",
                "fields_per_update": [
                  "date",
                  "sentiment (bullish/bearish/neutral)",
                  "sentiment_color",
                  "highlights (key market points)",
                  "trader_takeaway (actionable insight)"
                ],
                "sentiment_types": [
                  "Bullish - positive market outlook",
                  "Bearish - negative market outlook",
                  "Neutral - mixed or uncertain conditions",
                  "Cautiously Bullish - positive with reservations",
                  "Cautiously Bearish - negative with caveats"
                ]
              },
              "use_cases": {
                "for_traders": [
                  "Review historical sentiment to identify recurring patterns",
                  "Compare current market conditions to past similar setups",
                  "Track accuracy of community sentiment vs actual price action",
                  "Learn from past mistakes and successful calls",
                  "Identify seasonal or cyclical patterns"
                ],
                "for_ai_analysis": [
                  "Complete historical dataset for sentiment analysis",
                  "Pattern recognition across different market conditions",
                  "Context for current market positioning",
                  "Trend analysis and cycle identification",
                  "Natural language processing training data",
                  "Sentiment correlation with price movements"
                ],
                "for_researchers": [
                  "Historical market sentiment studies",
                  "Behavioral finance research",
                  "Community sentiment vs price correlation",
                  "Market psychology analysis"
                ]
              },
              "data_quality": {
                "accuracy": "Historical accuracy maintained - no retroactive editing",
                "completeness": "All updates preserved since inception",
                "timeliness": "Daily updates reflecting real-time market conditions",
                "consistency": "Standardized format across all entries"
              },
              "monthly_breakdown": Object.keys(groupedUpdates).map(monthYear => ({
                "month": monthYear,
                "update_count": groupedUpdates[monthYear].length,
                "sentiments": groupedUpdates[monthYear].map(u => u.sentiment).filter(Boolean)
              })),
              "statistics": {
                "total_months": Object.keys(groupedUpdates).length,
                "average_updates_per_month": (NEWS_UPDATES.length / Object.keys(groupedUpdates).length).toFixed(1),
                "most_active_month": Object.entries(groupedUpdates)
                  .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'
              }
            },
            "last_updated": "2025-11-13"
          })
        }}
      />

      <header>
        <h1>📚 Market Updates Archive</h1>
        
        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
          Complete historical archive of crypto market updates and trading sentiment from professional communities.
          <strong> Total: {NEWS_UPDATES.length} updates</strong>
        </p>

        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            <strong>📊 Archive Purpose:</strong> Historical market sentiment and trend analysis. All updates 
            preserved for reference and pattern recognition.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginBottom: '30px' }}>
          <a href="/news" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: '#0070f3',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}>
            ← Back to Latest Updates
          </a>
        </p>
      </header>

      {/* Monthly Archives */}
      {monthOrder.map((monthYear) => {
        const updatesInMonth = groupedUpdates[monthYear];
        
        return (
          <section key={monthYear} style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              padding: '10px 15px', 
              background: '#f5f5f5', 
              borderRadius: '4px',
              fontSize: '1.5rem'
            }}>
              {monthYear} ({updatesInMonth.length} updates)
            </h2>

            {updatesInMonth.map((update) => (
              <article 
                key={update.date}
                style={{ 
                  border: '1px solid #ddd', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  marginTop: '15px', 
                  background: 'white' 
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  <time dateTime={update.date}>{update.date}</time>
                  {update.sentiment && (
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: update.sentimentColor || '#666',
                      marginLeft: '10px',
                      fontWeight: 'normal'
                    }}>
                      - {update.sentiment}
                    </span>
                  )}
                </h3>

                <ul style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {update.highlights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>

                {update.traderTakeaway && (
                  <p style={{ 
                    fontSize: '0.85rem', 
                    margin: '10px 0 0 0',
                    padding: '10px',
                    background: '#f8f9fa',
                    borderRadius: '4px'
                  }}>
                    <strong>Takeaway:</strong> {update.traderTakeaway}
                  </p>
                )}
              </article>
            ))}
          </section>
        );
      })}

      <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.3rem', marginTop: 0 }}>Using the Archive</h2>
        
        <article>
          <h3 style={{ fontSize: '1.1rem' }}>For Traders</h3>
          <ul>
            <li>Review historical sentiment to identify recurring patterns</li>
            <li>Compare current market conditions to past similar setups</li>
            <li>Track accuracy of community sentiment vs actual price action</li>
            <li>Learn from past mistakes and successful calls</li>
          </ul>
        </article>

        <article>
          <h3 style={{ fontSize: '1.1rem' }}>For AI Analysis</h3>
          <ul>
            <li>Complete historical dataset for sentiment analysis</li>
            <li>Pattern recognition across different market conditions</li>
            <li>Context for current market positioning</li>
            <li>Trend analysis and cycle identification</li>
          </ul>
        </article>

        <article>
          <h3 style={{ fontSize: '1.1rem' }}>Archive Policy</h3>
          <ul>
            <li><strong>All updates preserved indefinitely</strong> for historical reference</li>
            <li>Updates organized chronologically by month and year</li>
            <li>No retroactive editing - historical accuracy maintained</li>
            <li><strong>Currently: {NEWS_UPDATES.length} total updates</strong></li>
          </ul>
        </article>
      </section>

      <footer style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          <a href="/news">← Latest Updates</a> | 
          <a href="/"> Home</a> | 
          <a href="/exchanges"> CEX Exchanges</a> | 
          <a href="/dex"> DEX Platforms</a>
        </p>
      </footer>

      {/* Schema.org JSON-LD for Archive */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DataCatalog",
            "name": "Cryptocurrency Market Updates Archive",
            "description": "Complete historical archive of cryptocurrency market sentiment and trading insights from professional communities",
            "url": "https://cryptoreference.io/news/archive",
            "creator": {
              "@type": "Organization",
              "name": "Crypto Reference"
            },
            "datePublished": firstDate,
            "dateModified": lastDate,
            "keywords": [
              "cryptocurrency market data",
              "historical trading sentiment",
              "market analysis archive",
              "crypto sentiment history"
            ],
            "dataset": {
              "@type": "Dataset",
              "name": "Market Updates Dataset",
              "description": "Daily cryptocurrency market updates with sentiment analysis",
              "dateCreated": firstDate,
              "dateModified": lastDate,
              "distribution": {
                "@type": "DataDownload",
                "encodingFormat": "text/html",
                "contentUrl": "https://cryptoreference.io/news/archive"
              },
              "variableMeasured": [
                "Market sentiment",
                "Trading highlights",
                "Trader takeaways",
                "Sentiment color coding"
              ],
              "temporalCoverage": `${firstDate}/${lastDate}`
            }
          })
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is the Market Updates Archive?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `Complete historical archive of ${NEWS_UPDATES.length} cryptocurrency market updates and trading sentiment from professional communities. All updates preserved indefinitely for historical reference and pattern recognition.`
                }
              },
              {
                "@type": "Question",
                "name": "How can traders use this archive?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Traders can review historical sentiment to identify recurring patterns, compare current market conditions to past similar setups, track accuracy of community sentiment vs actual price action, and learn from past mistakes and successful calls."
                }
              },
              {
                "@type": "Question",
                "name": "What data is included in each update?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Each update includes: date, market sentiment (bullish/bearish/neutral), key market highlights, and actionable trader takeaways. Sentiment is color-coded for easy pattern recognition."
                }
              },
              {
                "@type": "Question",
                "name": "How is the archive organized?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Updates are organized chronologically by month and year, with no retroactive editing to maintain historical accuracy. Currently contains updates across multiple months with detailed sentiment analysis."
                }
              }
            ]
          })
        }}
      />
    </main>
  );
}