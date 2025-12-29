import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Token Swap Interface',
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
          <h1>Token Swap</h1>
        </header>

        {/* Section A */}
        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr><td>Interface_Class</td><td>Execution_Surface</td></tr>
              <tr><td>Interaction_Model</td><td>User_Initiated</td></tr>
              <tr><td>Routing_Model</td><td>Aggregated_Path</td></tr>
              <tr><td>Settlement_Model</td><td>External_Layer</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section B */}
        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr><td>Liquidity_Source</td><td>Multiple_Pools</td></tr>
              <tr><td>Pricing_Model</td><td>Route_Optimized</td></tr>
              <tr><td>Asset_Class</td><td>Fungible_Tokens</td></tr>
              <tr><td>Execution_Context</td><td>User_Wallet</td></tr>
            </tbody>
          </table>
        </section>

        {/* Section C */}
        <section>
          <h2>Section_C</h2>
          <table>
            <tbody>
              <tr><td>Account_Model</td><td>Wallet_Based</td></tr>
              <tr><td>Authorization_Flow</td><td>User_Signed</td></tr>
              <tr><td>Latency_Profile</td><td>Not_Disclosed</td></tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/go/jupiter">Execute_Swap</a>
          </div>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}