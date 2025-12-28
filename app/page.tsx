import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CryptoReference',
  description: '',
  alternates: { canonical: '' },
};

export default function CryptoReferencePage() {
  return (
    <main>
      <article>
        <header>
          <h1>CryptoReference</h1>
        </header>
        <section>
          <h2>Section_A</h2>
          <div><a href="/dex">Hub_A</a></div>
          <div><a href="/exchanges">Hub_B</a></div>
          <div><a href="/cards">Hub_C</a></div>
          <div><a href="/news">Hub_D</a></div>
          <div><a href="/swap">Hub_E</a></div>
          <div><a href="/compare">Hub_F</a></div>
        </section>
        <footer>
          <div>Source_A</div>
        </footer>
      </article>
    </main>
  );
}
