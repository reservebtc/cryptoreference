import type { Metadata } from "next";
import styles from "./hyperfoundation.module.css";

const REFERRAL_URL = "https://app.hyperliquid.xyz/join/CRYPTOREFERENCE";
const CTA_TEXT = "Start Trading";

export const metadata: Metadata = {
  title: "Hyperfoundation",
  description: "Start trading on Hyperliquid using the CryptoReference referral link.",
  alternates: {
    canonical: "",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Icon({
  name,
}: {
  name: "bolt" | "shield" | "coin" | "spark";
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  if (name === "bolt") {
    return (
      <svg {...common}>
        <path
          d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...common}>
        <path
          d="M12 2 20 6v7c0 5-3.4 8.8-8 9-4.6-.2-8-4-8-9V6l8-4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9.2 12.2 11 14l3.8-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "coin") {
    return (
      <svg {...common}>
        <path
          d="M12 21c4.4 0 8-4 8-9S16.4 3 12 3 4 7 4 12s3.6 9 8 9Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M9.5 10.2c.3-1.2 1.4-2 2.9-2 1.6 0 2.7.8 2.7 2 0 2.6-5.7 1.4-5.7 4.2 0 1.3 1.2 2.2 2.9 2.2 1.4 0 2.6-.7 2.9-1.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        d="M12 2l1.2 6.2L20 12l-6.8 3.8L12 22l-1.2-6.2L4 12l6.8-3.8L12 2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HyperfoundationLanding() {
  return (
    <main className={styles.hfMain}>
      <article className={styles.stage}>
        {/* On macOS/iOS overscroll can reveal the <body> background from RootLayout (white).
            Keep it dark only while this page is mounted to avoid white bands. */}
        <style>{`
          html, body, #main-content {
            background: #041b16 !important;
          }
          body {
            overscroll-behavior-y: none;
          }
        `}</style>

        <div className={styles.blobs}>
          <div className={`${styles.blob} ${styles.blobA}`} />
          <div className={`${styles.blob} ${styles.blobB}`} />
          <div className={`${styles.blob} ${styles.blobC}`} />
        </div>

        <div className={styles.shell}>
          <header className={styles.headerPill}>
            <div className={styles.brand}>
              <div className={styles.brandMark} aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7 8.5c0-2.5 2-4.5 4.5-4.5h1c2.5 0 4.5 2 4.5 4.5v7c0 2.5-2 4.5-4.5 4.5h-1C9 20 7 18 7 15.5v-7Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M10 9h4M10 15h4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className={styles.brandName}>CryptoReference</div>
            </div>

            <a
              className={styles.cta}
              href={REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {CTA_TEXT}
            </a>
          </header>

          <section className={styles.hero} aria-label="Hero">
            <div className={styles.heroMark} aria-hidden="true">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className={styles.h1}>Trade on Hyperliquid with our referral</h1>
            <p className={styles.subhead}>
              One click opens the official app and applies code{" "}
              <span style={{ color: "rgba(127,255,225,0.95)", fontWeight: 650 }}>
                CRYPTOREFERENCE
              </span>
              .
            </p>

            <div className={styles.heroCtaRow}>
              <a
                className={styles.cta}
                href={REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CTA_TEXT}
              </a>
            </div>

            <div className={styles.micro}>
              Opens{" "}
              <span style={{ color: "rgba(243,255,251,0.86)" }}>
                app.hyperliquid.xyz
              </span>{" "}
              in a new tab.
            </div>
          </section>

          <div className={styles.content}>
            <section className={styles.panel} aria-label="Key benefits">
              <h2 className={styles.panelTitle}>Why start here</h2>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <Icon name="bolt" />
                  </div>
                  <p className={styles.featureText}>Fast execution</p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <Icon name="shield" />
                  </div>
                  <p className={styles.featureText}>Official app domain</p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <Icon name="coin" />
                  </div>
                  <p className={styles.featureText}>Clear fee display</p>
                </div>

                <div className={styles.feature}>
                  <div className={styles.featureIcon}>
                    <Icon name="spark" />
                  </div>
                  <p className={styles.featureText}>Quick onboarding</p>
                </div>
              </div>
            </section>

            <section className={styles.panel} aria-label="Trust">
              <h2 className={styles.panelTitle}>Trust signals</h2>

              <div className={styles.trustGrid}>
                <ul className={styles.checks}>
                  <li className={styles.checkItem}>
                    <div className={styles.checkIcon} aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 7 10 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      Link destination is{" "}
                      <span style={{ color: "rgba(243,255,251,0.90)", fontWeight: 650 }}>
                        app.hyperliquid.xyz
                      </span>
                      .
                    </div>
                  </li>

                  <li className={styles.checkItem}>
                    <div className={styles.checkIcon} aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 7 10 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      Join path is{" "}
                      <span style={{ color: "rgba(243,255,251,0.90)", fontWeight: 650 }}>
                        /join/CRYPTOREFERENCE
                      </span>
                      .
                    </div>
                  </li>

                  <li className={styles.checkItem}>
                    <div className={styles.checkIcon} aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 7 10 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      This page has no forms. Click goes straight to the join link.
                    </div>
                  </li>
                </ul>

                <div className={styles.factBox}>
                  <p className={styles.factLabel}>Destination</p>
                  <p className={styles.factValue}>app.hyperliquid.xyz</p>

                  <p className={styles.factLabel}>Referral code</p>
                  <p className={styles.factValue}>CRYPTOREFERENCE</p>
                </div>
              </div>
            </section>

            <section className={styles.repeatCta} aria-label="Call to action">
              <a
                className={styles.cta}
                href={REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {CTA_TEXT}
              </a>
            </section>
          </div>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <div className={styles.footerMark} aria-hidden="true" />
              <div>CryptoReference</div>
            </div>
            <div>This page contains a referral link.</div>
          </footer>
        </div>

        <div className={styles.stickyCta} aria-label="Sticky CTA">
          <div className={styles.stickyCtaInner}>
            <a
              className={styles.cta}
              href={REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {CTA_TEXT}
            </a>
          </div>
        </div>
      </article>
    </main>
  );
}
