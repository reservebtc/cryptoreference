import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cards Directory',
  description: '',
  alternates: {
    canonical: '',
  },
};

export default function CardsHubPage() {
  return (
    <main>
      <article>
        <header>
          <h1>Cards Directory</h1>
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
                <td>Entity_Directory</td>
              </tr>
              <tr>
                <td>Namespace</td>
                <td>/cards</td>
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
                <td><a href="/cards/etherfi">/cards/etherfi</a></td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/">Hub_A</a>
          </div>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}