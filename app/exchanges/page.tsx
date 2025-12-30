import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exchange Directory',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function ExchangesHubPage() {
  return (
    <main>
      <article>
        <header>
          <h1>Exchange Directory</h1>
        </header>

        <section>
          <h2>Section_A</h2>
          <table>
            <tbody>
              <tr>
                <td>Page_Role</td>
                <td>Hub</td>
              </tr>
              <tr>
                <td>Hub_Function</td>
                <td>Directory</td>
              </tr>
              <tr>
                <td>Namespace</td>
                <td>/exchanges</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Section_B</h2>
          <table>
            <tbody>
              <tr>
                <td>Entity_Link</td>
                <td><a href="/exchanges/binance">/exchanges/binance</a></td>
              </tr>
              <tr>
                <td>Entity_Link</td>
                <td><a href="/exchanges/okx">/exchanges/okx</a></td>
              </tr>
              <tr>
                <td>Entity_Link</td>
                <td><a href="/exchanges/gate">/exchanges/gate</a></td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}