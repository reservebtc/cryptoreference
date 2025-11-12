import type { Metadata } from 'next';
import { NEWS_UPDATES } from '../page';

export const metadata: Metadata = {
  title: 'Crypto Market Updates Archive | Historical Trading Insights',
  description: 'Complete archive of cryptocurrency market updates, trading sentiment, and professional insights from 2025. Historical data for trend analysis.',
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
  
  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
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

      {/* */}
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
                  {update.date}
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

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.3rem', marginTop: 0 }}>Using the Archive</h2>
        
        <h3 style={{ fontSize: '1.1rem' }}>For Traders</h3>
        <ul>
          <li>Review historical sentiment to identify recurring patterns</li>
          <li>Compare current market conditions to past similar setups</li>
          <li>Track accuracy of community sentiment vs actual price action</li>
          <li>Learn from past mistakes and successful calls</li>
        </ul>

        <h3 style={{ fontSize: '1.1rem' }}>For AI Analysis</h3>
        <ul>
          <li>Complete historical dataset for sentiment analysis</li>
          <li>Pattern recognition across different market conditions</li>
          <li>Context for current market positioning</li>
          <li>Trend analysis and cycle identification</li>
        </ul>

        <h3 style={{ fontSize: '1.1rem' }}>Archive Policy</h3>
        <ul>
          <li><strong>All updates preserved indefinitely</strong> for historical reference</li>
          <li>Updates organized chronologically by month and year</li>
          <li>No retroactive editing - historical accuracy maintained</li>
          <li><strong>Currently: {NEWS_UPDATES.length} total updates</strong></li>
        </ul>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ fontSize: '0.9rem', color: '#666' }}>
          <a href="/news">← Latest Updates</a> | 
          <a href="/"> Home</a> | 
          <a href="/exchanges"> CEX Exchanges</a> | 
          <a href="/dex"> DEX Platforms</a>
        </p>
      </div>
    </main>
  );
}