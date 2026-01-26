export const metadata = {
  title: "Aster DEX — Asterdex",
  description: "Decentralized perpetual contracts. Trade crypto.",
};

export default function AsterdexLanding() {
  return (
    <main className="asterdex">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        :root {
          --bg: #0b0b0b;
          --panel: rgba(255,255,255,0.04);
          --text: #f0f0f0;
          --muted: rgba(240,240,240,0.7);
          --accent: #E8C08D;
          --border: rgba(255,255,255,0.08);
        }

        body {
          margin: 0;
          padding: 0;
          background: var(--bg) !important;
          color: var(--text) !important;
          font-family: "Space Grotesk", "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
          letter-spacing: 0.1px;
        }

        a {
          color: var(--text);
          text-decoration: none;
        }

        .asterdex {
          min-height: 100vh;
          background-image:
            radial-gradient(800px 400px at 20% 10%, rgba(209,191,168,0.12), transparent 60%),
            radial-gradient(900px 500px at 80% 20%, rgba(209,191,168,0.08), transparent 60%),
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.0) 40%),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: auto, auto, auto, 80px 80px, 80px 80px;
          background-position: center, center, center, 0 0, 0 0;
        }

        .page {
          max-width: 100%;
          margin: 0 auto;
          padding: 32px 0 96px;
        }

        .hero {
          display: grid;
          gap: 20px;
          padding: 40px 0 24px;
        }

        .kicker {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          color: var(--muted);
          font-size: 13px;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        .kicker .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 16px rgba(209,191,168,0.8);
        }

        h1 {
          margin: 0;
          font-size: 40px;
          line-height: 1.05;
          font-weight: 600;
        }

        .accent {
          color: var(--accent);
          display: inline-block;
        }

        .headline {
          color: var(--text);
          display: inline-block;
        }

        .subtitle {
          margin: 0;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.5;
          max-width: 520px;
        }

        .cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 28px;
          font-weight: 600;
          border-radius: 999px;
          border: 1px solid rgba(209,191,168,0.5);
          background: linear-gradient(135deg, rgba(209,191,168,0.15), rgba(209,191,168,0.05));
          color: var(--text);
          box-shadow: 0 14px 40px rgba(209,191,168,0.22);
          transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
          min-width: 180px;
        }

        .cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 48px rgba(209,191,168,0.32);
          border-color: rgba(209,191,168,0.85);
        }

        .features {
          display: grid;
          gap: 12px;
          margin: 28px 0 28px;
        }

        .feature-item {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 12px;
          align-items: center;
          padding: 12px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 14px;
          font-size: 14px;
        }

        .feature-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(209,191,168,0.12);
          border: 1px solid rgba(209,191,168,0.35);
          display: grid;
          place-items: center;
          color: var(--accent);
          font-size: 14px;
        }

        .stats {
          display: grid;
          gap: 12px;
          margin: 10px 0 24px;
        }

        .stat {
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border);
          border-radius: 14px;
          display: grid;
          gap: 6px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 600;
          color: var(--accent);
        }

        .stat-label {
          color: var(--muted);
          font-size: 13px;
        }

        .repeat-cta {
          margin: 28px 0 40px;
          display: grid;
          place-items: center;
        }

        .footer {
          border-top: 1px solid var(--border);
          padding: 24px 0 0;
          color: var(--muted);
          font-size: 13px;
          text-align: center;
        }

        .sticky-cta {
          position: fixed;
          left: 16px;
          right: 16px;
          bottom: 16px;
          z-index: 20;
          display: none;
          padding: 10px;
          border-radius: 999px;
          background: rgba(11,11,11,0.72);
          border: 1px solid rgba(209,191,168,0.4);
          backdrop-filter: blur(12px);
        }

        .sticky-cta .cta {
          width: 100%;
        }

        @media (min-width: 640px) {
          .hero { padding: 60px 0 32px; }
          h1 { font-size: 54px; }
          .subtitle { font-size: 17px; }
          .features { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (min-width: 920px) {
          .hero { padding: 80px 0 40px; }
          h1 { font-size: 64px; }
          .features { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .stats { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .stat { text-align: center; }
        }

        @media (max-width: 768px) {
          .sticky-cta { display: block; }
          body { padding-bottom: 90px; }
        }
      `,
        }}
      />

      <div className="page">
        <section className="hero" aria-label="Hero">
          <div className="kicker"><span className="dot" /> Aster DEX</div>
          <h1>
            <span className="headline">Decentralized perpetual contracts.</span>
            <br />
            <span className="accent">Trade crypto</span>
          </h1>
          <p className="subtitle">
            Non-custodial trading built for all — whether you're new to crypto or a seasoned pro.
          </p>
          <a className="cta" href="https://www.asterdex.com/en/referral/tlRYkq">
            Launch app
          </a>
        </section>

        <section className="features" aria-label="Features">
          <div className="feature-item">
            <div className="feature-icon">◆</div>
            <div>Invisible orders. Visible advantage.</div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">◇</div>
            <div>Cross-chain trading</div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">◈</div>
            <div>Unmatched liquidity</div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⬡</div>
            <div>Advanced tools</div>
          </div>
        </section>

        <section className="stats" aria-label="Trust stats">
          <div className="stat">
            <div className="stat-value">$3.97T</div>
            <div className="stat-label">Total Trading Volume</div>
          </div>
          <div className="stat">
            <div className="stat-value">8.50M</div>
            <div className="stat-label">Users</div>
          </div>
          <div className="stat">
            <div className="stat-value">$2.47B</div>
            <div className="stat-label">Open Interest</div>
          </div>
          <div className="stat">
            <div className="stat-value">$1.19B</div>
            <div className="stat-label">TVL</div>
          </div>
          <div className="stat">
            <div className="stat-value">181</div>
            <div className="stat-label">Symbols</div>
          </div>
        </section>

        <section className="repeat-cta" aria-label="Launch">
          <a className="cta" href="https://www.asterdex.com/en/referral/tlRYkq">
            Launch app
          </a>
        </section>

        <footer className="footer">© 2026 Aster DEX. All rights reserved.</footer>
      </div>

      <div className="sticky-cta" aria-label="Sticky launch">
        <a className="cta" href="https://www.asterdex.com/en/referral/tlRYkq">
          Launch app
        </a>
      </div>
    </main>
  );
}
