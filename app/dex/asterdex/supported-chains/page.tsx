import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Registry_01',
  description: 'AsterDEX Registry_01 page.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/registry-01',
  },
};

export default function AsterDEXRegistry01Page() {
  return (
    <main>
      <article>
        <header>
          <h1>AsterDEX Registry_01</h1>
          <div><strong>Page Type:</strong> Education</div>
        </header>

        <section>
          <h2>Declared Identifiers</h2>
          <table>
            <thead>
              <tr>
                <th>Column_A</th>
                <th>Column_B</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Identifier_A</td>
                <td>Not disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Declared Categories</h2>
          <table>
            <thead>
              <tr>
                <th>Column_A</th>
                <th>Column_B</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Category_A</td>
                <td>Not disclosed</td>
              </tr>
              <tr>
                <td>Category_B</td>
                <td>Not disclosed</td>
              </tr>
              <tr>
                <td>Category_C</td>
                <td>Not disclosed</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer>
          <div>
            <a href="/go/asterdex">AsterDEX platform link</a> (affiliate)
          </div>
          <div>
            Source: asterdex.com
          </div>
        </footer>
      </article>
    </main>
  );
}
