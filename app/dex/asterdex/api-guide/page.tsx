import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AsterDEX Registry_02',
  description: 'AsterDEX Registry_02 page.',
  alternates: {
    canonical: 'https://cryptoreference.io/dex/asterdex/registry-02',
  },
};

export default function AsterDEXRegistry02Page() {
  return (
    <main>
      <article>
        <header>
          <h1>AsterDEX Registry_02</h1>
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
              <tr>
                <td>Identifier_B</td>
                <td>Not disclosed</td>
              </tr>
              <tr>
                <td>Identifier_C</td>
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
            Source: docs.asterdex.com
          </div>
        </footer>
      </article>
    </main>
  );
}
