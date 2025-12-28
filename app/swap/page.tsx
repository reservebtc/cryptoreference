import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solana Token Swap',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function SwapPage() {
  return (
    <main>
      <article>
        <header>
          <h1>Solana Token Swap</h1>
        </header>

        {/* Section A — Service Identity */}
        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr><td>Page_Type</td><td>Service</td></tr>
              <tr><td>Service_Category</td><td>Token_Swap</td></tr>
              <tr><td>Primary_Network</td><td>Solana</td></tr>
              <tr><td>Aggregation_Model</td><td>DEX_Aggregator</td></tr>
              <tr><td>Execution_Mode</td><td>User_Initiated</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section B — Operational Characteristics */}
        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr><td>Liquidity_Source</td><td>Multiple_Decentralized_Exchanges</td></tr>
              <tr><td>Pricing_Model</td><td>Aggregated_Routing</td></tr>
              <tr><td>Asset_Scope</td><td>Solana_SPL_Tokens</td></tr>
              <tr><td>Wallet_Interaction</td><td>External_Wallet</td></tr>
              <tr><td>Fee_Model</td><td>Network_Dependent</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section C — Usage Characteristics */}
        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr><td>Account_Model</td><td>Wallet_Based</td></tr>
              <tr><td>Onboarding</td><td>No_Registration</td></tr>
              <tr><td>Execution_Flow</td><td>Direct_Wallet_Confirmation</td></tr>
              <tr><td>Latency_Profile</td><td>Network_Dependent</td></tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a
              href="https://jup.ag?referrer=EfS2zk47CHCGQvgnNB6hXBKd4EWWjtHYJNku8PNj52hq"
              target="_blank"
              rel="noopener noreferrer"
            >
              Execute_Swap
            </a>
          </div>
          <div>Source: external execution interface</div>
        </footer>
      </article>
    </main>
  );
}