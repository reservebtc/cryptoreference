import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CryptoReference',
  description: '',
  alternates: { canonical: '' },
};

export default function CryptoReferenceRoot() {
  return (
    <main>
      <article>
        <header>
          <h1>CryptoReference</h1>
        </header>

        <section>
          <h2>Section_A</h2>

          <div>
            <a href="/dex">Hub_A</a>
          </div>

          <div>
            <a href="/exchanges">Hub_B</a>
          </div>

          <div>
            <a href="/cards">Hub_C</a>
          </div>
        </section>

        <footer>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}